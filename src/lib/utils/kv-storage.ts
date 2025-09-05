import { logger } from '@/lib/logger';
import type { DiagnosisResult } from '@/types';
import { StorageFactory } from '@/lib/storage/storage-factory';

/**
 * 診断結果をストレージに保存
 * StorageFactoryを使用して環境に応じた適切なストレージ実装を使用
 * @param result 診断結果
 * @param options オプション設定（後方互換性のため維持）
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
  const storage = StorageFactory.getStorage();
  
  try {
    const saveResult = await storage.save(result);
    
    // 後方互換性のため、kvSavedフラグを設定
    // 開発環境ではLocalStorageのみ、本番環境では両方に保存される
    const kvSaved = process.env.NODE_ENV === 'production' && saveResult.success;
    
    return {
      ...saveResult,
      kvSaved
    };
  } catch (error) {
    logger.error('[KV Storage] Save failed:', error);
    return {
      success: false,
      kvSaved: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 診断結果をストレージから取得
 * StorageFactoryを使用して環境に応じた適切なストレージ実装を使用
 * @param id 診断結果ID
 * @param options オプション設定（後方互換性のため維持）
 */
export async function loadDiagnosisResult(
  id: string,
  options: {
    checkLocalStorage?: boolean;
    checkKV?: boolean;
  } = {}
): Promise<DiagnosisResult | null> {
  const storage = StorageFactory.getStorage();
  
  try {
    const result = await storage.get(id);
    
    if (result) {
      logger.info(`[KV Storage] Loaded result: ${id}`);
      return result;
    }
    
    return null;
  } catch (error) {
    logger.error('[KV Storage] Load failed:', error);
    return null;
  }
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