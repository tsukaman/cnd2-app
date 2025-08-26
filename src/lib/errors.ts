/**
 * CND² アプリケーション用カスタムエラークラス
 */

export class CND2Error extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CND2Error';
  }
}

export class NetworkError extends CND2Error {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}

export class ParseError extends CND2Error {
  constructor(message: string, details?: unknown) {
    super(message, 'PARSE_ERROR', 422, details);
    this.name = 'ParseError';
  }
}

export class ValidationError extends CND2Error {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends CND2Error {
  constructor(message: string, details?: unknown) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
  }
}

export class ConfigurationError extends CND2Error {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * エラーハンドリングユーティリティ
 */
export class ErrorHandler {
  /**
   * エラーを適切な形式にマッピング
   */
  static mapError(error: unknown): CND2Error {
    if (error instanceof CND2Error) {
      return error;
    }
    
    if (error instanceof TypeError) {
      return new ValidationError(
        'データの形式が正しくありません',
        { originalError: error.message }
      );
    }
    
    if (error instanceof SyntaxError) {
      return new ParseError(
        'データの解析に失敗しました',
        { originalError: error.message }
      );
    }
    
    if (error instanceof Error) {
      // ネットワーク関連のエラーをチェック
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new NetworkError(
          'ネットワークエラーが発生しました。接続を確認してください。',
          { originalError: error.message }
        );
      }
      
      // その他のエラー
      return new CND2Error(
        error.message || '予期しないエラーが発生しました',
        'UNKNOWN_ERROR',
        500,
        { originalError: error.message }
      );
    }
    
    return new CND2Error(
      '予期しないエラーが発生しました',
      'UNKNOWN_ERROR',
      500,
      { originalError: String(error) }
    );
  }
  
  /**
   * ユーザー向けのエラーメッセージを生成
   */
  static getUserMessage(error: CND2Error): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'ネットワーク接続に問題があります。しばらく待ってから再試行してください。';
      case 'PARSE_ERROR':
        return 'データの処理中にエラーが発生しました。サポートにお問い合わせください。';
      case 'VALIDATION_ERROR':
        return error.message;
      case 'RATE_LIMIT_ERROR':
        return 'リクエストが多すぎます。少し待ってから再試行してください。';
      case 'CONFIGURATION_ERROR':
        return 'システムの設定に問題があります。管理者にお問い合わせください。';
      default:
        return '予期しないエラーが発生しました。再度お試しください。';
    }
  }
  
  /**
   * エラーログを出力
   */
  static logError(error: CND2Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      context,
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack
      }
    };
    
    // 開発環境では詳細なログを出力
    if (process.env.NODE_ENV === 'development') {
      console.error('[CND² Error]', logEntry);
    } else {
      // 本番環境では簡潔なログ
      console.error(`[CND²] ${error.code}: ${error.message}`);
      // Send to Sentry if configured
      if (typeof window !== 'undefined') {
        const win = window as Window & { Sentry?: { captureException: (error: unknown, context?: unknown) => void } };
        if (win.Sentry?.captureException) {
            win.Sentry.captureException(error, {
            level: 'error',
            tags: {
              context,
              errorCode: error.code,
            },
          });
        }
      }
    }
  }
}