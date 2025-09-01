/**
 * Fallback diagnosis configuration
 * Cloudflare Functions用の共通設定
 */

export const FALLBACK_CONFIG = {
  // 開発環境でフォールバックを許可するか
  ALLOW_IN_DEVELOPMENT: false,
  
  // 本番環境でフォールバックを許可するか（イベント時はfalse推奨）
  ALLOW_IN_PRODUCTION: false,  // イベント中は無効化してエラーを即座に検知
  
  // フォールバック時のスコア範囲（開発環境では低めに設定）
  DEVELOPMENT_SCORE: {
    MIN: 30,
    MAX: 40,
    RANGE: 10
  },
  
  // 本番環境のスコア範囲（ユーザー体験を維持）
  PRODUCTION_SCORE: {
    MIN: 85,
    MAX: 100,
    RANGE: 15
  },
  
  // フォールバック時の識別子
  ID_PREFIX: 'fallback-',
  
  // フォールバック時の警告メッセージ
  WARNING_MESSAGE: {
    DEVELOPMENT: '⚠️ フォールバック診断が動作しています。OpenAI APIキーを確認してください。',
    PRODUCTION: ''  // 本番環境では表示しない
  },
  
  // フォールバック時のメタデータ
  METADATA: {
    engine: 'fallback',
    model: 'mock',
    warning: 'This is a fallback diagnosis result'
  }
};

/**
 * Check if fallback is allowed in current environment
 * 
 * @param {Object} env - Environment variables
 * @returns {boolean}
 */
export function isFallbackAllowed(env) {
  // シンプルに環境変数のみで制御
  // ENABLE_FALLBACK=true の時のみフォールバック有効
  return env?.ENABLE_FALLBACK === 'true';
}

/**
 * Get appropriate score range for current environment
 * 
 * @param {Object} env - Environment variables
 * @returns {Object} Score range configuration
 */
export function getFallbackScoreRange(env) {
  const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
  return isDevelopment 
    ? FALLBACK_CONFIG.DEVELOPMENT_SCORE 
    : FALLBACK_CONFIG.PRODUCTION_SCORE;
}

/**
 * Generate fallback compatibility score
 * 
 * @param {Object} env - Environment variables
 * @returns {number} Random score within range
 */
export function generateFallbackScore(env) {
  const range = getFallbackScoreRange(env);
  return Math.floor(Math.random() * range.RANGE) + range.MIN;
}

/**
 * Get warning message for current environment
 * 
 * @param {Object} env - Environment variables
 * @returns {string} Warning message
 */
export function getFallbackWarning(env) {
  const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
  return isDevelopment 
    ? FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT 
    : FALLBACK_CONFIG.WARNING_MESSAGE.PRODUCTION;
}