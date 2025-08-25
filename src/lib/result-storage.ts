import { DiagnosisResult } from '@/types';

export class ResultStorage {
  private static instance: ResultStorage;
  private results: Map<string, DiagnosisResult> = new Map();

  private constructor() {
    // 7日後に自動削除する仕組み
    this.startCleanupTimer();
  }

  static getInstance(): ResultStorage {
    if (!ResultStorage.instance) {
      ResultStorage.instance = new ResultStorage();
    }
    return ResultStorage.instance;
  }

  // 結果を保存
  saveResult(result: DiagnosisResult): string {
    const id = result.id;
    this.results.set(id, result);
    
    // ブラウザのlocalStorageにも保存（クライアントサイド用）
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cnd2_results') || '{}';
        const results = JSON.parse(stored);
        results[id] = {
          ...result,
          createdAt: result.createdAt.toISOString(),
        };
        localStorage.setItem('cnd2_results', JSON.stringify(results));
      } catch (error) {
        console.error('[CND²] 結果の保存エラー:', error);
      }
    }
    
    console.log(`[CND²] 診断結果を保存: ${id}`);
    return id;
  }

  // 結果を取得
  getResult(id: string): DiagnosisResult | null {
    // メモリから取得
    const memoryResult = this.results.get(id);
    if (memoryResult) return memoryResult;

    // ブラウザのlocalStorageから取得
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cnd2_results');
        if (stored) {
          const results = JSON.parse(stored);
          if (results[id]) {
            const result = results[id];
            // 日付を復元
            result.createdAt = new Date(result.createdAt);
            return result;
          }
        }
      } catch (error) {
        console.error('[CND²] 結果の取得エラー:', error);
      }
    }

    return null;
  }

  // 全結果を取得
  getAllResults(): DiagnosisResult[] {
    const results: DiagnosisResult[] = [];
    
    // メモリから
    this.results.forEach(result => results.push(result));
    
    // localStorageから
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cnd2_results');
        if (stored) {
          const storageResults = JSON.parse(stored);
          Object.values(storageResults).forEach((result: any) => {
            // 重複チェック
            if (!results.find(r => r.id === result.id)) {
              result.createdAt = new Date(result.createdAt);
              results.push(result);
            }
          });
        }
      } catch (error) {
        console.error('[CND²] 全結果取得エラー:', error);
      }
    }
    
    return results;
  }

  // 古い結果を削除（7日以上経過）
  private cleanupOldResults(): void {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // メモリから削除
    this.results.forEach((result, id) => {
      if (result.createdAt.getTime() < sevenDaysAgo) {
        this.results.delete(id);
        console.log(`[CND²] 古い結果を削除: ${id}`);
      }
    });
    
    // localStorageから削除
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cnd2_results');
        if (stored) {
          const results = JSON.parse(stored);
          let changed = false;
          
          Object.keys(results).forEach(id => {
            const createdAt = new Date(results[id].createdAt).getTime();
            if (createdAt < sevenDaysAgo) {
              delete results[id];
              changed = true;
              console.log(`[CND²] localStorageから古い結果を削除: ${id}`);
            }
          });
          
          if (changed) {
            localStorage.setItem('cnd2_results', JSON.stringify(results));
          }
        }
      } catch (error) {
        console.error('[CND²] クリーンアップエラー:', error);
      }
    }
  }

  // クリーンアップタイマーを開始
  private startCleanupTimer(): void {
    // 1時間ごとにクリーンアップを実行
    setInterval(() => {
      this.cleanupOldResults();
    }, 60 * 60 * 1000);
    
    // 初回実行
    this.cleanupOldResults();
  }

  // 統計情報を取得
  getStats(): { total: number; recentCount: number } {
    const all = this.getAllResults();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentCount = all.filter(r => 
      r.createdAt.getTime() > oneDayAgo
    ).length;
    
    return {
      total: all.length,
      recentCount,
    };
  }
}