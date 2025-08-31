/**
 * リトライ設定の定数
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  backoffMultiplier: 2, // 指数バックオフの倍率
} as const;

/**
 * 指数バックオフによる待機時間を計算
 * @param attempt 現在の試行回数（0から開始）
 * @returns 待機時間（ミリ秒）
 */
export function calculateBackoffDelay(attempt: number): number {
  return RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
}