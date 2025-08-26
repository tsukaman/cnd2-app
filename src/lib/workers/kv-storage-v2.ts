/**
 * Enhanced Cloudflare Workers KV Storage
 * Edge-compatible storage with automatic expiration
 */

export class KVStorage {
  private kv: KVNamespace | null = null;
  
  constructor() {
    // Cloudflare Workers環境でのKV取得
    if (typeof globalThis !== 'undefined' && 'CND2_RESULTS' in globalThis) {
      this.kv = (globalThis as any).CND2_RESULTS;
    }
  }

  /**
   * 診断結果を保存（7日間の有効期限付き）
   */
  async save(id: string, data: any, options?: SaveOptions): Promise<void> {
    if (!this.kv) {
      console.warn('[KV] Storage not available, using in-memory fallback');
      // フォールバック: LocalStorageやメモリに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`cnd2_result_${id}`, JSON.stringify(data));
      }
      return;
    }

    const key = `result:${id}`;
    const metadata = {
      createdAt: new Date().toISOString(),
      expiresAt: this.calculateExpiry(options?.expirationTtl || 7 * 24 * 60 * 60),
      version: '2.0',
    };

    await this.kv.put(key, JSON.stringify(data), {
      expirationTtl: options?.expirationTtl || 604800, // デフォルト7日間
      metadata,
    });

    // インデックスに追加（最近の結果一覧用）
    await this.addToIndex(id, metadata);
  }

  /**
   * 診断結果を取得
   */
  async get(id: string): Promise<any | null> {
    if (!this.kv) {
      // フォールバック
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(`cnd2_result_${id}`);
        return data ? JSON.parse(data) : null;
      }
      return null;
    }

    const key = `result:${id}`;
    const data = await this.kv.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('[KV] Parse error:', error);
      return null;
    }
  }

  /**
   * 診断結果を削除
   */
  async delete(id: string): Promise<void> {
    if (!this.kv) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`cnd2_result_${id}`);
      }
      return;
    }

    const key = `result:${id}`;
    await this.kv.delete(key);
    await this.removeFromIndex(id);
  }

  /**
   * 最近の診断結果一覧を取得
   */
  async listRecent(limit: number = 10): Promise<RecentResult[]> {
    if (!this.kv) {
      return [];
    }

    const indexKey = 'index:recent';
    const indexData = await this.kv.get(indexKey);

    if (!indexData) {
      return [];
    }

    try {
      const index = JSON.parse(indexData) as IndexEntry[];
      // 最新のものから返す
      return index
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map(entry => ({
          id: entry.id,
          createdAt: entry.createdAt,
          expiresAt: entry.expiresAt,
        }));
    } catch (error) {
      console.error('[KV] Index parse error:', error);
      return [];
    }
  }

  /**
   * 統計情報を取得
   */
  async getStats(): Promise<StorageStats> {
    if (!this.kv) {
      return {
        totalResults: 0,
        recentResults: 0,
        storageUsed: '0 KB',
      };
    }

    const list = await this.kv.list({ prefix: 'result:', limit: 1000 });
    const recent = await this.listRecent(100);

    return {
      totalResults: list.keys.length,
      recentResults: recent.length,
      storageUsed: this.formatBytes(list.keys.length * 2048), // 推定値
    };
  }

  /**
   * インデックスに追加
   */
  private async addToIndex(id: string, metadata: any): Promise<void> {
    if (!this.kv) return;

    const indexKey = 'index:recent';
    const currentIndex = await this.kv.get(indexKey);
    
    let index: IndexEntry[] = [];
    if (currentIndex) {
      try {
        index = JSON.parse(currentIndex);
      } catch {
        index = [];
      }
    }

    // 新しいエントリを追加
    index.push({
      id,
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
    });

    // 期限切れのエントリを削除
    const now = new Date();
    index = index.filter(entry => new Date(entry.expiresAt) > now);

    // 最大1000件まで保持
    if (index.length > 1000) {
      index = index.slice(-1000);
    }

    await this.kv.put(indexKey, JSON.stringify(index), {
      expirationTtl: 30 * 24 * 60 * 60, // 30日間
    });
  }

  /**
   * インデックスから削除
   */
  private async removeFromIndex(id: string): Promise<void> {
    if (!this.kv) return;

    const indexKey = 'index:recent';
    const currentIndex = await this.kv.get(indexKey);
    
    if (!currentIndex) return;

    try {
      let index = JSON.parse(currentIndex) as IndexEntry[];
      index = index.filter(entry => entry.id !== id);
      await this.kv.put(indexKey, JSON.stringify(index), {
        expirationTtl: 30 * 24 * 60 * 60,
      });
    } catch (error) {
      console.error('[KV] Index update error:', error);
    }
  }

  /**
   * 有効期限を計算
   */
  private calculateExpiry(ttlSeconds: number): string {
    const date = new Date();
    date.setSeconds(date.getSeconds() + ttlSeconds);
    return date.toISOString();
  }

  /**
   * バイト数をフォーマット
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Types
interface SaveOptions {
  expirationTtl?: number; // 秒単位
}

interface IndexEntry {
  id: string;
  createdAt: string;
  expiresAt: string;
}

interface RecentResult {
  id: string;
  createdAt: string;
  expiresAt: string;
}

interface StorageStats {
  totalResults: number;
  recentResults: number;
  storageUsed: string;
}

// Cloudflare Workers KV型定義
declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: any): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: any): Promise<any>;
  }
}