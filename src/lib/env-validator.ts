import { ConfigurationError } from './errors';

/**
 * 環境変数の検証
 */
export class EnvValidator {
  private static validated = false;

  /**
   * 必須の環境変数を検証
   */
  static validate(): void {
    if (this.validated) return;

    // サーバーサイドでのみ検証
    if (typeof window !== 'undefined') {
      this.validated = true;
      return;
    }

    const required = {
      // API Keys
      OPENAI_API_KEY: {
        description: 'OpenAI API key for AI diagnosis',
        pattern: /^sk-[a-zA-Z0-9]{48,}$/,
        fallback: 'mock', // モック診断を使用
      },
    };

    const optional = {
      // URLs
      NEXT_PUBLIC_APP_URL: {
        description: 'Application URL',
        default: 'https://cnd2.cloudnativedays.jp',
      },
      NEXT_PUBLIC_PRAIRIE_URL: {
        description: 'Prairie Card base URL',
        default: 'https://my.prairie.cards',
      },
      NEXT_PUBLIC_CND2_API: {
        description: 'CND² API endpoint',
        default: '/api',
      },
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    // 必須環境変数のチェック
    for (const [key, config] of Object.entries(required)) {
      const value = process.env[key];
      
      if (!value || value === `your_${key.toLowerCase()}_here`) {
        if (config.fallback === 'mock') {
          warnings.push(`${key}: Not configured. Using ${config.fallback} mode.`);
        } else {
          errors.push(`${key}: ${config.description} is required`);
        }
      } else if (config.pattern && !config.pattern.test(value)) {
        errors.push(`${key}: Invalid format. ${config.description}`);
      }
    }

    // オプション環境変数のチェック（設定されていない場合はデフォルト値を使用）
    for (const [key, config] of Object.entries(optional)) {
      const value = process.env[key];
      
      if (!value) {
        console.log(`[CND²] ${key} not set. Using default: ${config.default}`);
        // 実際にはNext.jsの環境変数は動的に設定できないため、
        // デフォルト値はアプリケーション側で処理する
      }
    }

    // エラーがある場合は例外をスロー
    if (errors.length > 0) {
      throw new ConfigurationError(
        'Environment configuration error:\n' + errors.join('\n'),
        { errors }
      );
    }

    // 警告を表示
    if (warnings.length > 0) {
      console.warn('[CND²] Environment warnings:\n' + warnings.join('\n'));
    }

    this.validated = true;
    console.log('[CND²] Environment validation completed successfully');
  }

  /**
   * 環境変数の値を安全に取得
   */
  static get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    
    if (!value && !defaultValue) {
      throw new ConfigurationError(`Environment variable ${key} is not set`);
    }
    
    return value || defaultValue || '';
  }

  /**
   * 現在の環境を取得
   */
  static getEnvironment(): 'development' | 'production' | 'test' {
    const env = process.env.NODE_ENV;
    
    if (env === 'production') return 'production';
    if (env === 'test') return 'test';
    return 'development';
  }

  /**
   * 開発環境かどうか
   */
  static isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  /**
   * 本番環境かどうか
   */
  static isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * テスト環境かどうか
   */
  static isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  /**
   * 環境変数のサマリーを取得（デバッグ用）
   */
  static getSummary(): Record<string, string> {
    const summary: Record<string, string> = {
      NODE_ENV: this.getEnvironment(),
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      PRAIRIE_URL: process.env.NEXT_PUBLIC_PRAIRIE_URL || 'not set',
      API_ENDPOINT: process.env.NEXT_PUBLIC_CND2_API || 'not set',
      OPENAI_CONFIGURED: process.env.OPENAI_API_KEY ? 'yes' : 'no (using mock)',
    };

    // 開発環境でのみ詳細を表示
    if (this.isDevelopment()) {
      console.table(summary);
    }

    return summary;
  }
}

// アプリケーション起動時に自動的に検証を実行
if (typeof window === 'undefined') {
  try {
    EnvValidator.validate();
  } catch (error) {
    console.error('[CND²] Environment validation failed:', error);
    // 開発環境では警告のみ、本番環境では例外をスロー
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}