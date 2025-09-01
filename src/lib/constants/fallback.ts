/**
 * Fallback diagnosis configuration
 */

import { isDevelopment, getEnvBoolean } from '@/lib/utils/environment';

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
} as const;

/**
 * Check if fallback is allowed in current environment
 * 
 * PR115で診断エンジン大幅更新予定のため、最小限の実装に留める
 * 環境変数 ENABLE_FALLBACK で制御（デフォルト: false）
 */
export function isFallbackAllowed(): boolean {
  // シンプルに環境変数のみで制御
  // ENABLE_FALLBACK=true の時のみフォールバック有効
  return getEnvBoolean('ENABLE_FALLBACK', false);
}

/**
 * Get appropriate score range for current environment
 */
export function getFallbackScoreRange() {
  return isDevelopment() 
    ? FALLBACK_CONFIG.DEVELOPMENT_SCORE 
    : FALLBACK_CONFIG.PRODUCTION_SCORE;
}

/**
 * Generate fallback compatibility score
 */
export function generateFallbackScore(): number {
  const range = getFallbackScoreRange();
  return Math.floor(Math.random() * range.RANGE) + range.MIN;
}

/**
 * Get warning message for current environment
 */
export function getFallbackWarning(): string {
  return isDevelopment() 
    ? FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT 
    : FALLBACK_CONFIG.WARNING_MESSAGE.PRODUCTION;
}