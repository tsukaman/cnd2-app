import { logger } from '@/lib/logger';
import type { DiagnosisResult } from '@/types';

/**
 * 診断結果をローカルストレージとKVストレージに保存
 * @param result 診断結果
 * @param options オプション設定
 */
export async function saveDiagnosisResult(
  result: DiagnosisResult,
  options: {
    saveToLocalStorage?: boolean;
    saveToKV?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
): Promise<{ success: boolean; kvSaved?: boolean; error?: string }> {
  const {
    saveToLocalStorage = true,
    saveToKV = true,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  // LocalStorageへの保存
  if (saveToLocalStorage && typeof window !== 'undefined') {
    try {
      const key = `diagnosis-result-${result.id}`;
      localStorage.setItem(key, JSON.stringify(result));
      logger.info(`[KV Storage] Saved to LocalStorage: ${result.id}`);
    } catch (error) {
      logger.error('[KV Storage] LocalStorage save failed:', error);
      // LocalStorageのエラーは続行可能なので警告のみ
    }
  }

  // KVストレージへの保存（APIエンドポイント経由）
  if (!saveToKV) {
    return { success: true, kvSaved: false };
  }

  // 開発環境ではKVストレージをスキップすることも可能
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_KV_IN_DEV) {
    logger.info('[KV Storage] Skipping KV save in development');
    return { success: true, kvSaved: false };
  }

  // リトライ付きでKVストレージに保存
  let lastError: Error | null = null;
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: result.id,
          result: result
        }),
      });

      if (response.ok) {
        const data = await response.json();
        logger.info(`[KV Storage] Saved to KV: ${result.id}`, data);
        return { success: true, kvSaved: true };
      }

      // HTTPエラーの場合
      const errorData = await response.json().catch(() => null);
      lastError = new Error(
        errorData?.error || `HTTP ${response.status}: ${response.statusText}`
      );
      logger.warn(`[KV Storage] Save attempt ${i + 1} failed:`, lastError);

    } catch (error) {
      lastError = error as Error;
      logger.warn(`[KV Storage] Save attempt ${i + 1} error:`, error);
    }

    // リトライ間隔を待つ（最後の試行後は待たない）
    if (i < retryCount - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
    }
  }

  // すべてのリトライが失敗
  logger.error('[KV Storage] All save attempts failed:', lastError);
  return { 
    success: true, // LocalStorageには保存できているので部分的成功
    kvSaved: false, 
    error: lastError?.message || 'Failed to save to KV storage'
  };
}

/**
 * 診断結果をストレージから取得
 * @param id 診断結果ID
 * @param options オプション設定
 */
export async function loadDiagnosisResult(
  id: string,
  options: {
    checkLocalStorage?: boolean;
    checkKV?: boolean;
  } = {}
): Promise<DiagnosisResult | null> {
  const {
    checkLocalStorage = true,
    checkKV = true
  } = options;

  // LocalStorageから取得を試みる
  if (checkLocalStorage && typeof window !== 'undefined') {
    try {
      const key = `diagnosis-result-${id}`;
      const data = localStorage.getItem(key);
      if (data) {
        const result = JSON.parse(data);
        logger.info(`[KV Storage] Loaded from LocalStorage: ${id}`);
        return result;
      }
    } catch (error) {
      logger.error('[KV Storage] LocalStorage load failed:', error);
    }
  }

  // KVストレージから取得を試みる
  if (checkKV) {
    try {
      const response = await fetch(`/api/results?id=${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result || data;
        
        // LocalStorageにもキャッシュ
        if (checkLocalStorage && typeof window !== 'undefined') {
          try {
            const key = `diagnosis-result-${id}`;
            localStorage.setItem(key, JSON.stringify(result));
          } catch {
            // キャッシュ失敗は無視
          }
        }
        
        logger.info(`[KV Storage] Loaded from KV: ${id}`);
        return result;
      }
    } catch (error) {
      logger.error('[KV Storage] KV load failed:', error);
    }
  }

  return null;
}

/**
 * 古い診断結果をクリーンアップ
 * @param maxAge 最大保存期間（ミリ秒）
 */
export function cleanupOldResults(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // LocalStorageのキーをチェック
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('diagnosis-result-')) continue;

      try {
        const data = localStorage.getItem(key);
        if (!data) continue;

        const result = JSON.parse(data);
        const createdAt = result.createdAt ? new Date(result.createdAt).getTime() : 0;
        
        if (createdAt && (now - createdAt) > maxAge) {
          keysToRemove.push(key);
        }
      } catch {
        // パースエラーのアイテムも削除対象
        keysToRemove.push(key);
      }
    }

    // 古い結果を削除
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      logger.info(`[KV Storage] Cleaned up old result: ${key}`);
    });

    if (keysToRemove.length > 0) {
      logger.info(`[KV Storage] Cleaned up ${keysToRemove.length} old results`);
    }
  } catch (error) {
    logger.error('[KV Storage] Cleanup failed:', error);
  }
}