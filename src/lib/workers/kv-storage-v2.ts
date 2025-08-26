/**
 * Enhanced Cloudflare Workers KV Storage
 * Edge-compatible storage with automatic expiration
 */

import { DiagnosisResult } from '@/types/diagnosis';
import { logger } from '../logger';

export class KVStorage {
  private kv: KVNamespace | null = null;
  private isAvailable: boolean = false;
  
  constructor() {
    // Cloudflare Workers環境でのKV取得
    this.initializeKV();
  }

  private initializeKV(): void {
    try {
      // Cloudflare Workers環境のチェック
      if (typeof globalThis !== 'undefined') {
        const env = (globalThis as { env?: { CND2_RESULTS?: KVNamespace }; CND2_RESULTS?: KVNamespace }).env || (globalThis as { CND2_RESULTS?: KVNamespace });
        
        // KV Namespaceの存在を確認
        if (env.CND2_RESULTS && typeof env.CND2_RESULTS === 'object') {
          this.kv = env.CND2_RESULTS as KVNamespace;
          this.isAvailable = true;
          logger.info('KV Storage initialized successfully');
        } else if ('CND2_RESULTS' in globalThis) {
          this.kv = (globalThis as { CND2_RESULTS?: KVNamespace }).CND2_RESULTS as KVNamespace;
          this.isAvailable = true;
          logger.info('KV Storage initialized from globalThis');
        }
      }
      
      if (!this.isAvailable) {
        logger.warn('KV Storage not available in current environment');
      }
    } catch (error) {
      logger.error('Failed to initialize KV storage', error);
      this.isAvailable = false;
    }
  }

  /**
   * 診断結果を保存（7日間の有効期限付き）
   */
  async save(id: string, data: DiagnosisResult, options?: SaveOptions): Promise<void> {
    if (!this.isAvailable || !this.kv) {
      logger.debug('KV Storage not available, using fallback');
      await this.saveFallback(id, data);
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
  async get(id: string): Promise<DiagnosisResult | null> {
    if (!this.isAvailable || !this.kv) {
      return this.getFallback(id);
    }

    const key = `result:${id}`;
    const data = await this.kv.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to parse KV data', error);
      return null;
    }
  }

  /**
   * 診断結果を削除
   */
  async delete(id: string): Promise<void> {
    if (!this.isAvailable || !this.kv) {
      await this.deleteFallback(id);
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
      logger.error('Failed to parse KV index', error);
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
  private async addToIndex(id: string, metadata: IndexMetadata): Promise<void> {
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
      logger.error('Failed to update KV index', error);
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

  /**
   * LocalStorageフォールバック
   */
  private async saveFallback(id: string, data: DiagnosisResult): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`cnd2_result_${id}`, JSON.stringify(data));
      } catch (error) {
        logger.error('Fallback save failed', error);
      }
    }
  }

  private getFallback(id: string): DiagnosisResult | null {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(`cnd2_result_${id}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        logger.error('Fallback get failed', error);
        return null;
      }
    }
    return null;
  }

  private async deleteFallback(id: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`cnd2_result_${id}`);
      } catch (error) {
        logger.error('Fallback delete failed', error);
      }
    }
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

interface IndexMetadata {
  createdAt: string;
  expiresAt: string;
  version: string;
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
    put(key: string, value: string, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
  }

  interface KVPutOptions {
    expirationTtl?: number;
    metadata?: Record<string, unknown>;
  }

  interface KVListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }

  interface KVListResult {
    keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
    list_complete: boolean;
    cursor?: string;
  }
}