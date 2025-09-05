/**
 * ストレージファクトリー - 環境に応じた適切なストレージ実装を提供
 */

import type { DiagnosisResult } from '@/types';

/**
 * ストレージインターフェース
 */
export interface IStorage {
  save(result: DiagnosisResult): Promise<{ success: boolean; error?: string }>;
  get(id: string): Promise<DiagnosisResult | null>;
  exists(id: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

/**
 * ローカルストレージ実装（開発環境・ブラウザ用）
 */
class LocalStorageImpl implements IStorage {
  private readonly prefix = 'diagnosis-result-';
  
  async save(result: DiagnosisResult): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'LocalStorage is not available in server context' };
    }
    
    try {
      const key = `${this.prefix}${result.id}`;
      localStorage.setItem(key, JSON.stringify(result));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save to localStorage' 
      };
    }
  }
  
  async get(id: string): Promise<DiagnosisResult | null> {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const key = `${this.prefix}${id}`;
      const data = localStorage.getItem(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  
  async exists(id: string): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const key = `${this.prefix}${id}`;
    return localStorage.getItem(key) !== null;
  }
  
  async delete(id: string): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      const key = `${this.prefix}${id}`;
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * KVストレージ実装（本番環境・Cloudflare用）
 */
class KVStorageImpl implements IStorage {
  private readonly apiEndpoint = '/api/results';
  
  async save(result: DiagnosisResult): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(this.apiEndpoint, {
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
        return { success: true };
      }
      
      const errorData = await response.json().catch(() => null);
      return { 
        success: false, 
        error: errorData?.error || `HTTP ${response.status}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save to KV storage' 
      };
    }
  }
  
  async get(id: string): Promise<DiagnosisResult | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.result || null;
      }
      return null;
    } catch {
      return null;
    }
  }
  
  async exists(id: string): Promise<boolean> {
    const result = await this.get(id);
    return result !== null;
  }
  
  async delete(id: string): Promise<boolean> {
    // KVストレージの削除は通常TTLに任せるため未実装
    return false;
  }
}

/**
 * 複合ストレージ実装（LocalStorage + KV）
 */
class CompositeStorage implements IStorage {
  constructor(
    private primary: IStorage,
    private secondary?: IStorage
  ) {}
  
  async save(result: DiagnosisResult): Promise<{ success: boolean; error?: string }> {
    // プライマリストレージに保存
    const primaryResult = await this.primary.save(result);
    
    // セカンダリストレージがある場合は並行して保存（エラーは無視）
    if (this.secondary) {
      this.secondary.save(result).catch(() => {
        // セカンダリストレージのエラーは無視
      });
    }
    
    return primaryResult;
  }
  
  async get(id: string): Promise<DiagnosisResult | null> {
    // まずプライマリから取得
    const primaryResult = await this.primary.get(id);
    if (primaryResult) {
      return primaryResult;
    }
    
    // セカンダリから取得
    if (this.secondary) {
      return await this.secondary.get(id);
    }
    
    return null;
  }
  
  async exists(id: string): Promise<boolean> {
    const primaryExists = await this.primary.exists(id);
    if (primaryExists) {
      return true;
    }
    
    if (this.secondary) {
      return await this.secondary.exists(id);
    }
    
    return false;
  }
  
  async delete(id: string): Promise<boolean> {
    const primaryDeleted = await this.primary.delete(id);
    
    if (this.secondary) {
      await this.secondary.delete(id);
    }
    
    return primaryDeleted;
  }
}

/**
 * ストレージファクトリー
 */
export class StorageFactory {
  private static instance: IStorage | null = null;
  
  /**
   * 環境に応じた適切なストレージ実装を取得
   */
  static getStorage(): IStorage {
    if (StorageFactory.instance) {
      return StorageFactory.instance;
    }
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isServer = typeof window === 'undefined';
    
    if (isDevelopment) {
      // 開発環境：LocalStorageのみ使用
      StorageFactory.instance = new LocalStorageImpl();
    } else if (isServer) {
      // 本番サーバーサイド：KVのみ
      StorageFactory.instance = new KVStorageImpl();
    } else {
      // 本番クライアントサイド：LocalStorage + KV
      StorageFactory.instance = new CompositeStorage(
        new LocalStorageImpl(),
        new KVStorageImpl()
      );
    }
    
    return StorageFactory.instance;
  }
  
  /**
   * テスト用：インスタンスをリセット
   */
  static reset(): void {
    StorageFactory.instance = null;
  }
  
  /**
   * テスト用：モックストレージを設定
   */
  static setStorage(storage: IStorage): void {
    StorageFactory.instance = storage;
  }
}

// デフォルトエクスポート
export const storage = StorageFactory.getStorage();