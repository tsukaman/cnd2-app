/**
 * @jest-environment node
 */

import { KVStorage } from '../kv-storage';

// Edge-compat モック
jest.mock('@/lib/utils/edge-compat', () => ({
  toBase64: (str: string) => Buffer.from(str).toString('base64'),
}));

// Cloudflare KV名前空間のモック
class MockKVNamespace {
  private store: Map<string, string> = new Map();
  private metadata: Map<string, any> = new Map();
  private expirations: Map<string, number> = new Map();

  async put(key: string, value: string, options?: any): Promise<void> {
    this.store.set(key, value);
    if (options?.metadata) {
      this.metadata.set(key, options.metadata);
    }
    if (options?.expirationTtl) {
      this.expirations.set(key, Date.now() + options.expirationTtl * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    // 有効期限チェック
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.metadata.delete(key);
      this.expirations.delete(key);
      return null;
    }
    
    return this.store.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.metadata.delete(key);
    this.expirations.delete(key);
  }

  async list(options?: any): Promise<any> {
    const prefix = options?.prefix || '';
    const limit = options?.limit || 100;
    const keys = Array.from(this.store.keys())
      .filter(key => key.startsWith(prefix))
      .slice(0, limit)
      .map(name => ({ 
        name, 
        metadata: this.metadata.get(name) 
      }));
    
    return { 
      keys,
      list_complete: keys.length < limit 
    };
  }

  // テスト用ヘルパー
  clear() {
    this.store.clear();
    this.metadata.clear();
    this.expirations.clear();
  }
}

import { toBase64 } from '@/lib/utils/edge-compat';

describe('KVStorage', () => {
  let kv: KVStorage;
  let mockNamespace: MockKVNamespace;

  beforeEach(() => {
    mockNamespace = new MockKVNamespace();
    kv = new KVStorage(mockNamespace as any, 'test');
  });

  describe('Diagnosis Storage', () => {
    it('should store and retrieve diagnosis results', async () => {
      const diagnosisResult = {
        title: 'Test Diagnosis',
        score: 85,
        profiles: [],
        message: 'Great compatibility!',
      };

      await kv.storeDiagnosis('test-id-123', diagnosisResult);
      const retrieved = await kv.getDiagnosis('test-id-123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Diagnosis');
      expect(retrieved?.score).toBe(85);
      expect(retrieved?.message).toBe('Great compatibility!');
      expect(retrieved?.storedAt).toBeDefined();
    });

    it('should return null for non-existent diagnosis', async () => {
      const result = await kv.getDiagnosis('non-existent');
      expect(result).toBeNull();
    });

    it('should delete diagnosis', async () => {
      await kv.storeDiagnosis('to-delete', { test: true });
      await kv.deleteDiagnosis('to-delete');
      
      const result = await kv.getDiagnosis('to-delete');
      expect(result).toBeNull();
    });

    it('should list diagnosis results', async () => {
      await kv.storeDiagnosis('diag-1', { title: 'First' });
      await kv.storeDiagnosis('diag-2', { title: 'Second' });

      const list = await kv.listDiagnoses();
      expect(list.keys).toHaveLength(2);
      expect(list.keys.some(k => k.name.includes('diag-1'))).toBe(true);
      expect(list.keys.some(k => k.name.includes('diag-2'))).toBe(true);
    });
  });

  describe('Prairie Profile Cache', () => {
    const mockProfile = {
      name: 'Test User',
      bio: 'Software Engineer',
      skills: ['JavaScript', 'TypeScript'],
    };

    const profileUrl = 'https://my.prairie.cards/test-user';

    it('should store and retrieve Prairie profiles', async () => {
      await kv.storePrairieProfile(profileUrl, mockProfile);
      const retrieved = await kv.getPrairieProfile(profileUrl);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test User');
      expect(retrieved?.bio).toBe('Software Engineer');
      expect(retrieved?.cachedAt).toBeDefined();
    });

    it('should use base64 encoding for URL keys', async () => {
      await kv.storePrairieProfile(profileUrl, mockProfile);
      
      // Verify the key format
      const list = await mockNamespace.list();
      const profileKey = list.keys.find((k: any) => k.name.includes('prairie'));
      expect(profileKey).toBeDefined();
      expect(profileKey?.name).toContain(toBase64(profileUrl));
    });

    it('should return null for non-cached profiles', async () => {
      const result = await kv.getPrairieProfile('https://my.prairie.cards/unknown');
      expect(result).toBeNull();
    });

    it('should handle cache expiration', async () => {
      // Store with expired timestamp
      const expiredProfile = {
        ...mockProfile,
        cachedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      const encodedUrl = toBase64(profileUrl);
      const key = `test:prairie:${encodedUrl}`;
      await mockNamespace.put(key, JSON.stringify(expiredProfile));

      const result = await kv.getPrairieProfile(profileUrl);
      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    const identifier = 'test-user-ip';

    it('should track rate limit counts', async () => {
      const count1 = await kv.incrementRateLimit(identifier, 5);
      expect(count1).toBe(1);

      const count2 = await kv.incrementRateLimit(identifier, 5);
      expect(count2).toBe(2);

      const count3 = await kv.incrementRateLimit(identifier, 5);
      expect(count3).toBe(3);
    });

    it('should check rate limit status', async () => {
      // First few requests should pass (limit=3, window=5 minutes)
      expect(await kv.checkRateLimit(identifier, 3, 5)).toBe(true);
      expect(await kv.checkRateLimit(identifier, 3, 5)).toBe(true);
      expect(await kv.checkRateLimit(identifier, 3, 5)).toBe(true);
      
      // Fourth request should fail
      expect(await kv.checkRateLimit(identifier, 3, 5)).toBe(false);
    });

    it('should handle rate limit errors gracefully', async () => {
      // Mock an error in the KV store
      const errorKV = new KVStorage({
        get: async () => { throw new Error('KV Error'); },
        put: async () => { throw new Error('KV Error'); },
        delete: async () => {},
        list: async () => ({ keys: [], list_complete: true }),
      } as any);

      // Should return false (fail-safe behavior)
      const result = await errorKV.checkRateLimit('test', 5, 10);
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      // Store invalid JSON
      const key = 'test:diagnosis:invalid';
      await mockNamespace.put(key, 'invalid json{');

      const result = await kv.getDiagnosis('invalid');
      expect(result).toBeNull();
    });

    it('should handle missing KV namespace gracefully', () => {
      const emptyKV = new KVStorage(null as any);
      
      // These should not throw errors
      expect(async () => {
        await emptyKV.getDiagnosis('test');
      }).not.toThrow();
    });
  });

  describe('Metadata', () => {
    it('should store metadata with diagnosis', async () => {
      const diagnosis = {
        title: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
      };

      await kv.storeDiagnosis('meta-test', diagnosis);
      
      const list = await mockNamespace.list();
      const item = list.keys.find((k: any) => k.name.includes('meta-test'));
      
      expect(item?.metadata).toBeDefined();
      expect((item?.metadata as any)?.type).toBe('diagnosis');
      expect((item?.metadata as any)?.createdAt).toBe('2024-01-01T00:00:00Z');
    });

    it('should store metadata with Prairie profiles', async () => {
      const url = 'https://my.prairie.cards/user';
      await kv.storePrairieProfile(url, { name: 'User' });
      
      const list = await mockNamespace.list();
      const item = list.keys.find((k: any) => k.name.includes('prairie'));
      
      expect(item?.metadata).toBeDefined();
      expect((item?.metadata as any)?.type).toBe('prairie_profile');
      expect((item?.metadata as any)?.url).toBe(url);
    });
  });
});