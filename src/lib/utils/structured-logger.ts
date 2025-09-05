/**
 * 構造化ログシステム (Next.js用)
 * 
 * ログレベル管理とJSON形式の構造化ログを提供
 * 本番環境でのセキュリティを最優先に設計
 */

import { isProduction } from '@/lib/utils/environment';

/**
 * ログレベル定義
 */
export enum LogLevel {
  ERROR = 0,    // エラーのみ
  WARN = 1,     // 警告以上
  INFO = 2,     // 情報以上
  DEBUG = 3,    // デバッグ含む全て
  TRACE = 4     // 詳細トレース（開発環境のみ）
}

/**
 * ログレベル名のマッピング
 */
const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.TRACE]: 'TRACE'
};

/**
 * センシティブなキーのパターン
 */
const SENSITIVE_PATTERNS = [
  /^.*(KEY|TOKEN|SECRET|CREDENTIAL|CERT|PRIVATE).*$/i,
  /^.*(API|ACCESS|REFRESH|BEARER|JWT|SESSION|CSRF).*$/i,
  /^.*(PASSWORD|PASSWD|PWD|PASS|PIN).*$/i,
  /^.*(AUTH|OAUTH|SAML|OIDC|SSO).*$/i,
];

/**
 * キーがセンシティブかどうか判定
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * センシティブな値をマスク
 */
function maskSensitiveValue(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars) return '***';
  const prefix = value.substring(0, visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars, 20));
  return `${prefix}${masked}`;
}

/**
 * ログエントリの型定義
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: Record<string, any>;
  service: string;
  component: string;
  env: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * ロガーオプション
 */
interface LoggerOptions {
  service?: string;
  component?: string;
  defaultContext?: Record<string, any>;
  logLevel?: LogLevel;
}

/**
 * 環境変数からログレベルを取得
 */
function getLogLevelFromEnv(): LogLevel {
  const isProd = isProduction();
  
  // 本番環境ではINFO以下に制限
  if (isProd) {
    const level = process.env.NEXT_PUBLIC_LOG_LEVEL || 'INFO';
    const numericLevel = LogLevel[level as keyof typeof LogLevel] ?? LogLevel.INFO;
    // 本番環境でDEBUG/TRACEは許可しない
    return Math.min(numericLevel, LogLevel.INFO);
  }
  
  // 開発環境
  const level = process.env.NEXT_PUBLIC_LOG_LEVEL || 'DEBUG';
  return LogLevel[level as keyof typeof LogLevel] ?? LogLevel.DEBUG;
}

/**
 * コンテキストオブジェクトをサニタイズ
 */
function sanitizeContext(context: any, depth = 0): any {
  if (!context || typeof context !== 'object') return context;
  if (depth > 3) return '[深いネスト]';
  
  const sanitized: Record<string, any> = {};
  
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
export class StructuredLogger {
  private level: LogLevel;
  private service: string;
  private component: string;
  private defaultContext: Record<string, any>;
  private isProd: boolean;
  
  constructor(options: LoggerOptions = {}) {
    this.level = options.logLevel ?? getLogLevelFromEnv();
    this.service = options.service || 'cnd2-app';
    this.component = options.component || 'unknown';
    this.defaultContext = options.defaultContext || {};
    this.isProd = isProduction();
  }
  
  /**
   * ログ出力の共通メソッド
   */
  private _log(level: LogLevel, message: string, context: Record<string, any> = {}): void {
    // 設定されたログレベル以下は出力しない
    if (level > this.level) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevelNames[level],
      message,
      context: sanitizeContext({ ...this.defaultContext, ...context }),
      service: this.service,
      component: this.component,
      env: this.isProd ? 'production' : 'development',
    };
    
    // 本番環境では構造化JSON、開発環境では見やすい形式
    if (this.isProd) {
      console.log(JSON.stringify(entry));
    } else {
      // 開発環境では色付きで見やすく
      const levelColors: Record<string, string> = {
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
        Object.keys(context).length > 0 ? context : ''
      );
    }
  }
  
  /**
   * エラーログ
   */
  error(message: string, contextOrError: Record<string, any> | Error = {}): void {
    const context = contextOrError instanceof Error
      ? { error: contextOrError, ...this._extractErrorContext(contextOrError) }
      : contextOrError;
    this._log(LogLevel.ERROR, message, context);
  }
  
  /**
   * 警告ログ
   */
  warn(message: string, context: Record<string, any> = {}): void {
    this._log(LogLevel.WARN, message, context);
  }
  
  /**
   * 情報ログ
   */
  info(message: string, context: Record<string, any> = {}): void {
    this._log(LogLevel.INFO, message, context);
  }
  
  /**
   * デバッグログ（開発環境のみ）
   */
  debug(message: string, context: Record<string, any> = {}): void {
    if (this.isProd) return; // 本番環境では出力しない
    this._log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * トレースログ（開発環境のみ）
   */
  trace(message: string, context: Record<string, any> = {}): void {
    if (this.isProd) return; // 本番環境では出力しない
    this._log(LogLevel.TRACE, message, context);
  }
  
  /**
   * エラーオブジェクトからコンテキストを抽出
   */
  private _extractErrorContext(error: any): Record<string, any> {
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
   */
  child(component: string, additionalContext: Record<string, any> = {}): StructuredLogger {
    return new StructuredLogger({
      service: this.service,
      component: `${this.component}.${component}`,
      defaultContext: { ...this.defaultContext, ...additionalContext },
      logLevel: this.level
    });
  }
  
  /**
   * パフォーマンス計測用タイマー開始
   */
  startTimer(label: string): (context?: Record<string, any>) => number {
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
   */
  logRequest(method: string, url: string, context: Record<string, any> = {}): void {
    this.info('API Request', {
      method,
      url,
      ...context
    });
  }
  
  /**
   * APIレスポンスログ用ヘルパー
   */
  logResponse(status: number, duration: number, context: Record<string, any> = {}): void {
    const level = status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this._log(level, 'API Response', {
      status,
      duration_ms: duration,
      ...context
    });
  }
}

/**
 * デフォルトロガーインスタンスを作成する工場関数
 */
export function createLogger(component: string): StructuredLogger {
  return new StructuredLogger({
    service: 'cnd2-app-nextjs',
    component
  });
}

/**
 * グローバルシングルトンロガー（オプション）
 */
let globalLogger: StructuredLogger | null = null;

export function getGlobalLogger(): StructuredLogger {
  if (!globalLogger) {
    globalLogger = createLogger('global');
  }
  return globalLogger;
}