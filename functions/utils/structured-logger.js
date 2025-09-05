// @ts-check

/**
 * 構造化ログシステム (Cloudflare Functions用)
 * 
 * ログレベル管理とJSON形式の構造化ログを提供
 * 本番環境でのセキュリティを最優先に設計
 */

const { isSensitiveKey, maskSensitiveValue, isProduction } = require('./debug-helpers.js');

/**
 * ログレベル定義
 */
const LogLevel = {
  ERROR: 0,    // エラーのみ
  WARN: 1,     // 警告以上
  INFO: 2,     // 情報以上
  DEBUG: 3,    // デバッグ含む全て
  TRACE: 4     // 詳細トレース（開発環境のみ）
};

/**
 * ログレベル名の逆引き用マップ
 */
const LogLevelNames = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.TRACE]: 'TRACE'
};

/**
 * 環境変数からログレベルを取得
 * @param {Object} env - 環境変数オブジェクト
 * @returns {number} ログレベル
 */
function getLogLevelFromEnv(env) {
  // 本番環境ではINFO以下に制限
  if (isProduction(env)) {
    const level = env?.LOG_LEVEL || 'INFO';
    const numericLevel = LogLevel[level.toUpperCase()] ?? LogLevel.INFO;
    // 本番環境でDEBUG/TRACEは許可しない
    return Math.min(numericLevel, LogLevel.INFO);
  }
  
  // 開発環境
  const level = env?.LOG_LEVEL || 'DEBUG';
  return LogLevel[level.toUpperCase()] ?? LogLevel.DEBUG;
}

/**
 * 構造化ログエントリを生成
 * @param {number} level - ログレベル
 * @param {string} message - ログメッセージ
 * @param {Object} context - コンテキスト情報
 * @param {Object} meta - メタデータ
 * @returns {Object} 構造化ログエントリ
 */
function createLogEntry(level, message, context = {}, meta = {}) {
  return {
    timestamp: new Date().toISOString(),
    level: LogLevelNames[level],
    message,
    context: sanitizeContext(context),
    ...meta,
    // Cloudflare固有のメタデータを追加
    cf: {
      ray: globalThis.CF_RAY_ID || null,
      colo: globalThis.CF_COLO || null,
      requestId: context.requestId || null
    }
  };
}

/**
 * コンテキストオブジェクトをサニタイズ
 * @param {Object} context - コンテキストオブジェクト
 * @param {number} depth - 再帰深度
 * @returns {Object} サニタイズ済みオブジェクト
 */
function sanitizeContext(context, depth = 0) {
  if (!context || typeof context !== 'object') return context;
  if (depth > 3) return '[深いネスト]';
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(context)) {
    // センシティブなキーはマスク
    if (isSensitiveKey(key)) {
      sanitized[key] = typeof value === 'string' 
        ? maskSensitiveValue(value, 4)
        : '[REDACTED]';
      continue;
    }
    
    // 値の型に応じて処理
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (value instanceof Error) {
      // エラーオブジェクトを安全にシリアライズ
      sanitized[key] = {
        name: value.name,
        message: value.message,
        stack: isProduction() ? '[スタックトレースは本番環境で非表示]' : value.stack
      };
    } else if (typeof value === 'object') {
      sanitized[key] = Array.isArray(value)
        ? value.slice(0, 10).map(v => sanitizeContext(v, depth + 1))
        : sanitizeContext(value, depth + 1);
    } else if (typeof value === 'string' && value.length > 500) {
      // 長い文字列は切り詰め
      sanitized[key] = value.substring(0, 500) + '... [切り詰め]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 構造化ロガークラス
 */
class StructuredLogger {
  /**
   * @param {Object} options - ロガーオプション
   * @param {Object} options.env - 環境変数オブジェクト
   * @param {string} options.service - サービス名
   * @param {string} options.component - コンポーネント名
   * @param {Object} options.defaultContext - デフォルトコンテキスト
   */
  constructor(options = {}) {
    this.env = options.env || {};
    this.level = getLogLevelFromEnv(this.env);
    this.service = options.service || 'cnd2-app';
    this.component = options.component || 'unknown';
    this.defaultContext = options.defaultContext || {};
    this.isProd = isProduction(this.env);
  }
  
  /**
   * ログ出力の共通メソッド
   * @param {number} level - ログレベル
   * @param {string} message - メッセージ
   * @param {Object} context - コンテキスト
   * @private
   */
  _log(level, message, context = {}) {
    // 設定されたログレベル以下は出力しない
    if (level > this.level) return;
    
    const entry = createLogEntry(
      level,
      message,
      { ...this.defaultContext, ...context },
      {
        service: this.service,
        component: this.component,
        env: this.isProd ? 'production' : 'development'
      }
    );
    
    // 本番環境では構造化JSON、開発環境では見やすい形式
    if (this.isProd) {
      console.log(JSON.stringify(entry));
    } else {
      // 開発環境では色付きで見やすく
      const levelColors = {
        ERROR: '\x1b[31m', // 赤
        WARN: '\x1b[33m',  // 黄
        INFO: '\x1b[36m',  // シアン
        DEBUG: '\x1b[90m', // グレー
        TRACE: '\x1b[35m'  // マゼンタ
      };
      const reset = '\x1b[0m';
      const color = levelColors[LogLevelNames[level]] || reset;
      
      console.log(
        `${color}[${LogLevelNames[level]}]${reset}`,
        `[${this.component}]`,
        message,
        context && Object.keys(context).length > 0 ? context : ''
      );
    }
  }
  
  /**
   * エラーログ
   * @param {string} message - エラーメッセージ
   * @param {Object|Error} contextOrError - コンテキストまたはエラーオブジェクト
   */
  error(message, contextOrError = {}) {
    const context = contextOrError instanceof Error
      ? { error: contextOrError, ...this._extractErrorContext(contextOrError) }
      : contextOrError;
    this._log(LogLevel.ERROR, message, context);
  }
  
  /**
   * 警告ログ
   * @param {string} message - 警告メッセージ
   * @param {Object} context - コンテキスト
   */
  warn(message, context = {}) {
    this._log(LogLevel.WARN, message, context);
  }
  
  /**
   * 情報ログ
   * @param {string} message - 情報メッセージ
   * @param {Object} context - コンテキスト
   */
  info(message, context = {}) {
    this._log(LogLevel.INFO, message, context);
  }
  
  /**
   * デバッグログ（開発環境のみ）
   * @param {string} message - デバッグメッセージ
   * @param {Object} context - コンテキスト
   */
  debug(message, context = {}) {
    if (this.isProd) return; // 本番環境では出力しない
    this._log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * トレースログ（開発環境のみ）
   * @param {string} message - トレースメッセージ
   * @param {Object} context - コンテキスト
   */
  trace(message, context = {}) {
    if (this.isProd) return; // 本番環境では出力しない
    this._log(LogLevel.TRACE, message, context);
  }
  
  /**
   * エラーオブジェクトからコンテキストを抽出
   * @param {Error} error - エラーオブジェクト
   * @returns {Object} エラーコンテキスト
   * @private
   */
  _extractErrorContext(error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      statusCode: error.statusCode,
      // スタックトレースは開発環境のみ
      ...(this.isProd ? {} : { stack: error.stack })
    };
  }
  
  /**
   * 子ロガーを作成（コンテキストを継承）
   * @param {string} component - コンポーネント名
   * @param {Object} additionalContext - 追加コンテキスト
   * @returns {StructuredLogger} 子ロガーインスタンス
   */
  child(component, additionalContext = {}) {
    return new StructuredLogger({
      env: this.env,
      service: this.service,
      component: `${this.component}.${component}`,
      defaultContext: { ...this.defaultContext, ...additionalContext }
    });
  }
  
  /**
   * パフォーマンス計測用タイマー開始
   * @param {string} label - タイマーラベル
   * @returns {Function} タイマー終了関数
   */
  startTimer(label) {
    const startTime = Date.now();
    return (context = {}) => {
      const duration = Date.now() - startTime;
      this.info(`${label} completed`, {
        duration_ms: duration,
        ...context
      });
      return duration;
    };
  }
  
  /**
   * APIリクエストログ用ヘルパー
   * @param {Request} request - リクエストオブジェクト
   * @param {Object} context - 追加コンテキスト
   */
  logRequest(request, context = {}) {
    this.info('API Request', {
      method: request.method,
      url: request.url,
      headers: this._sanitizeHeaders(request.headers),
      ...context
    });
  }
  
  /**
   * APIレスポンスログ用ヘルパー
   * @param {Response} response - レスポンスオブジェクト
   * @param {number} duration - 処理時間（ミリ秒）
   * @param {Object} context - 追加コンテキスト
   */
  logResponse(response, duration, context = {}) {
    const level = response.status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this._log(level, 'API Response', {
      status: response.status,
      duration_ms: duration,
      ...context
    });
  }
  
  /**
   * ヘッダーをサニタイズ
   * @param {Headers} headers - ヘッダーオブジェクト
   * @returns {Object} サニタイズ済みヘッダー
   * @private
   */
  _sanitizeHeaders(headers) {
    const sanitized = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const [key, value] of headers.entries()) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

/**
 * デフォルトロガーインスタンスを作成する工場関数
 * @param {Object} env - 環境変数オブジェクト
 * @param {string} component - コンポーネント名
 * @returns {StructuredLogger} ロガーインスタンス
 */
function createLogger(env, component) {
  return new StructuredLogger({
    env,
    service: 'cnd2-app-functions',
    component
  });
}

// CommonJS形式でエクスポート
module.exports = {
  LogLevel,
  StructuredLogger,
  createLogger
};