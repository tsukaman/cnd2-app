/**
 * 環境判定ユーティリティ
 */

/**
 * 開発環境かどうかを判定
 * NODE_ENVとENVIRONMENTの両方をチェック（Cloudflare対応）
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.ENVIRONMENT === 'development';
}

/**
 * 本番環境かどうかを判定
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && 
         process.env.ENVIRONMENT !== 'development';
}

/**
 * テスト環境かどうかを判定
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * 環境変数を安全に取得
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

/**
 * 環境変数をブール値として取得
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 */
export function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * 環境変数を数値として取得
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key);
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 必須環境変数の検証
 * @param requiredVars 必須環境変数のキー配列
 * @throws Error 必須環境変数が設定されていない場合
 */
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missing: string[] = [];
  
  for (const key of requiredVars) {
    if (!getEnvVar(key)) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * 環境情報をログ出力（デバッグ用）
 */
export function logEnvironment(): void {
  if (isDevelopment() || getEnvBoolean('DEBUG_MODE')) {
    console.log('[Environment]', {
      NODE_ENV: process.env.NODE_ENV,
      ENVIRONMENT: process.env.ENVIRONMENT,
      ENABLE_FALLBACK: process.env.ENABLE_FALLBACK,
      DEBUG_MODE: process.env.DEBUG_MODE,
      isDevelopment: isDevelopment(),
      isProduction: isProduction(),
      isTest: isTest()
    });
  }
}