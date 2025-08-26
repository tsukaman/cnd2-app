/**
 * ログレベル制御ユーティリティ
 * 環境に応じて適切なログレベルを設定
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private isTest: boolean;
  
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isTest = process.env.NODE_ENV === 'test';
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment && !this.isTest) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 情報ログ
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isTest) return; // テスト環境ではログを出力しない
    if (this.isProduction) {
      // 本番環境では機密情報を除外
      console.info(`[INFO] ${message}`);
    } else {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * 警告ログ
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isTest) {
      // テスト環境では直接console.warnを呼び出し（モックされる）
      console.warn(message, ...args);
      return;
    }
    if (this.isProduction) {
      // 本番環境では最小限の情報のみ
      console.warn(`[WARN] ${message}`);
    } else {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * エラーログ
   */
  error(message: string, error?: unknown): void {
    if (this.isTest) {
      // テスト環境では直接console.errorを呼び出し（モックされる）
      console.error(message, error);
      return;
    }
    if (this.isProduction) {
      // 本番環境では機密情報を含まないエラーメッセージのみ
      const safeError = this.sanitizeError(error);
      console.error(`[ERROR] ${message}`, safeError);
    } else {
      // 開発環境では完全なエラー情報
      console.error(`[ERROR] ${message}`, error);
    }
  }

  /**
   * エラー情報のサニタイズ
   */
  private sanitizeError(error: unknown): string | object {
    if (error instanceof Error) {
      // スタックトレースやセンシティブな情報を除外
      return {
        name: error.name,
        message: this.sanitizeMessage(error.message),
      };
    }
    return 'An error occurred';
  }

  /**
   * エラーメッセージのサニタイズ
   */
  private sanitizeMessage(message: string): string {
    // APIキー、トークン、URLパラメータなどを除去
    return message
      .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
      .replace(/sk-[A-Za-z0-9]{48}/gi, '[API_KEY_REDACTED]')
      .replace(/api[_-]?key[=:]\s*[A-Za-z0-9\-._~+/]+/gi, 'api_key=[REDACTED]')
      .replace(/token[=:]\s*[A-Za-z0-9\-._~+/]+/gi, 'token=[REDACTED]')
      .replace(/password[=:]\s*[^\s&]+/gi, 'password=[REDACTED]');
  }
}

// シングルトンインスタンス
export const logger = new Logger();