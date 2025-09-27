// AI診断のキャッシュ機構
// 同じプロファイルの組み合わせに対して短期間キャッシュすることで
// OpenAI API呼び出しを削減し、レスポンスを高速化

import { PrairieProfile, DiagnosisResult } from '@/types';

export class DiagnosisCache {
  private static instance: DiagnosisCache;
  private cache: Map<string, { result: DiagnosisResult; expiry: number }>;
  private readonly TTL = 60 * 60 * 1000; // 1時間
  private readonly MAX_SIZE = 100; // 最大100件

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): DiagnosisCache {
    if (!DiagnosisCache.instance) {
      DiagnosisCache.instance = new DiagnosisCache();
    }
    return DiagnosisCache.instance;
  }

  // 確率的クリーンアップ（10%の確率で実行）
  private probabilisticCleanup(): void {
    if (Math.random() < 0.1) {
      this.cleanup();
    }
  }

  // プロファイルからキャッシュキーを生成
  private generateKey(profiles: PrairieProfile[], mode: 'duo' | 'group'): string {
    // プロファイルの重要な属性を抽出してソート
    const profileKeys = profiles
      .map(p => ({
        name: p.basic.name,
        topics: (p.details.topics || []).sort().join(','),
        hashtags: (p.details.hashtags || []).sort().join(','),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Edge Runtime互換のハッシュ生成（crypto APIの代わりに簡易実装）
    const data = JSON.stringify({ mode, profiles: profileKeys });
    
    // 簡易的なハッシュ関数（djb2アルゴリズム）
    let hash = 5381;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) + hash) + data.charCodeAt(i);
    }
    
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  // キャッシュから診断結果を取得
  get(profiles: PrairieProfile[], mode: 'duo' | 'group'): DiagnosisResult | null {
    // Edge Runtime対応: 確率的クリーンアップ
    this.probabilisticCleanup();
    
    const key = this.generateKey(profiles, mode);
    const cached = this.cache.get(key);

    if (!cached) {
      console.log('[CND²] AI診断キャッシュミス');
      return null;
    }

    // 期限切れチェック
    if (Date.now() > cached.expiry) {
      console.log('[CND²] AI診断キャッシュ期限切れ');
      this.cache.delete(key);
      return null;
    }

    console.log('[CND²] AI診断キャッシュヒット');
    
    // キャッシュされた結果を返す（新しいIDと時刻で）
    return {
      ...cached.result,
      id: this.generateNewId(),
      createdAt: new Date().toISOString(),
    };
  }

  // 診断結果をキャッシュに保存
  set(profiles: PrairieProfile[], mode: 'duo' | 'group', result: DiagnosisResult): void {
    // Edge Runtime対応: 確率的クリーンアップ
    this.probabilisticCleanup();
    
    // サイズ制限チェック
    if (this.cache.size >= this.MAX_SIZE) {
      // 最も古いエントリを削除
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].expiry - b[1].expiry)[0][0];
      this.cache.delete(oldestKey);
    }

    const key = this.generateKey(profiles, mode);
    this.cache.set(key, {
      result,
      expiry: Date.now() + this.TTL,
    });

    console.log(`[CND²] AI診断をキャッシュに保存: ${key}`);
  }

  // 特定のプロファイルに関連するキャッシュをクリア
  clearForProfile(profile: PrairieProfile): void {
    const profileName = profile.basic.name;
    
    // 該当するプロファイルを含むキャッシュエントリを削除
    for (const [key, value] of this.cache.entries()) {
      const participants = value.result.participants;
      if (participants.some(p => p.basic.name === profileName)) {
        this.cache.delete(key);
      }
    }
  }

  // 全キャッシュクリア
  clear(): void {
    this.cache.clear();
    console.log('[CND²] AI診断キャッシュをクリア');
  }

  // キャッシュサイズを取得
  size(): number {
    return this.cache.size;
  }

  // 期限切れエントリのクリーンアップ
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CND²] ${cleaned}件の期限切れAI診断をクリーンアップ`);
    }
  }


  // 新しいIDを生成
  private generateNewId(): string {
    return Math.random().toString(36).substring(2, 12);
  }

  // 統計情報を取得
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    oldestExpiry?: number;
  } {
    const entries = Array.from(this.cache.values());
    const oldestExpiry = entries.length > 0
      ? Math.min(...entries.map(e => e.expiry))
      : undefined;

    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      ttl: this.TTL,
      oldestExpiry,
    };
  }
}