import { PrairieProfile } from "@/types";

interface CacheEntry {
  data: PrairieProfile;
  timestamp: number;
  cnd2Score?: number;
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly ttl: {
    memory: number;
    browser: number;
  };

  constructor() {
    this.ttl = {
      memory: 3600 * 1000, // 1時間
      browser: 7200 * 1000, // 2時間（二乗っぽく）
    };
  }

  // メモリキャッシュから取得
  getFromMemory(key: string): PrairieProfile | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl.memory) {
      this.memoryCache.delete(key);
      return null;
    }

    // 二乗効果：キャッシュヒット時にスコアを上げる
    if (entry.cnd2Score) {
      entry.cnd2Score = Math.min(entry.cnd2Score * 2, 100);
    }

    console.log(`[CND²] メモリキャッシュヒット: ${key} (スコア: ${entry.cnd2Score})`);
    return entry.data;
  }

  // ブラウザキャッシュから取得
  async getFromBrowser(key: string): Promise<PrairieProfile | null> {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`cnd2_cache_${key}`);
      if (!stored) return null;

      const entry: CacheEntry = JSON.parse(stored);
      const now = Date.now();

      if (now - entry.timestamp > this.ttl.browser) {
        localStorage.removeItem(`cnd2_cache_${key}`);
        return null;
      }

      console.log(`[CND²] ブラウザキャッシュヒット: ${key}`);
      
      // メモリキャッシュにも保存
      this.memoryCache.set(key, entry);
      
      return entry.data;
    } catch (_error) {
      console.error('[CND²] ブラウザキャッシュ読み込みエラー:', error);
      return null;
    }
  }

  // 二乗キャッシュ戦略：関連URLも含めてチェック
  async getWithSquaredCache(url: string): Promise<PrairieProfile | null> {
    // 1. メモリキャッシュチェック
    const memoryResult = this.getFromMemory(url);
    if (memoryResult) return memoryResult;

    // 2. ブラウザキャッシュチェック
    const browserResult = await this.getFromBrowser(url);
    if (browserResult) return browserResult;

    // 3. 関連キャッシュチェック（同じイベント参加者など）
    const relatedCache = await this.findRelatedCache(url);
    if (relatedCache) {
      console.log('[CND²] 関連キャッシュヒット! Connection squared!');
      return relatedCache;
    }

    return null;
  }

  // キャッシュに保存
  async save(key: string, data: PrairieProfile): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      cnd2Score: 1,
    };

    // メモリキャッシュに保存
    this.memoryCache.set(key, entry);

    // ブラウザキャッシュに保存
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cnd2_cache_${key}`, JSON.stringify(entry));
      } catch (_error) {
        console.error('[CND²] ブラウザキャッシュ保存エラー:', error);
      }
    }

    console.log(`[CND²] キャッシュ保存: ${key}`);
  }

  // 関連キャッシュを探す（二乗効果）
  private async findRelatedCache(url: string): Promise<PrairieProfile | null> {
    // URLから推測される関連URL（例：同じドメインの他のプロフィール）
    const urlObj = new URL(url);
    const baseDomain = urlObj.origin;

    // メモリキャッシュから関連URLを探す
    for (const [cachedUrl, entry] of this.memoryCache.entries()) {
      if (cachedUrl.startsWith(baseDomain) && cachedUrl !== url) {
        const now = Date.now();
        if (now - entry.timestamp <= this.ttl.memory) {
          // 関連データの一部を返すかどうかは実装次第
          // ここでは null を返す
          break;
        }
      }
    }

    return null;
  }

  // キャッシュクリア
  clear(): void {
    this.memoryCache.clear();
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cnd2_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    console.log('[CND²] キャッシュクリア完了');
  }

  // キャッシュ統計
  getStats(): { memorySize: number; browserSize: number } {
    const browserSize = typeof window !== 'undefined' 
      ? Object.keys(localStorage).filter(k => k.startsWith('cnd2_cache_')).length
      : 0;

    return {
      memorySize: this.memoryCache.size,
      browserSize,
    };
  }
}