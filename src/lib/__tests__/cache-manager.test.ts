import { CacheManager } from '../cache-manager-generic';

describe('CacheManager', () => {
  let cacheManager: CacheManager<any>;

  beforeEach(() => {
    jest.useFakeTimers();
    cacheManager = new CacheManager<string>({
      maxSize: 100,
      ttl: 60000, // 1 minute
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('値を保存して取得できる', () => {
      cacheManager.set('key1', 'value1');
      expect(cacheManager.get('key1')).toBe('value1');
    });

    it('存在しないキーはundefinedを返す', () => {
      expect(cacheManager.get('nonexistent')).toBeUndefined();
    });

    it('値を更新できる', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key1', 'value2');
      expect(cacheManager.get('key1')).toBe('value2');
    });

    it('値を削除できる', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.delete('key1');
      expect(cacheManager.get('key1')).toBeUndefined();
    });

    it('キャッシュをクリアできる', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.clear();
      expect(cacheManager.get('key1')).toBeUndefined();
      expect(cacheManager.get('key2')).toBeUndefined();
    });

    it('キーの存在を確認できる', () => {
      cacheManager.set('key1', 'value1');
      expect(cacheManager.has('key1')).toBe(true);
      expect(cacheManager.has('key2')).toBe(false);
    });

    it('現在のサイズを取得できる', () => {
      expect(cacheManager.size()).toBe(0);
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      expect(cacheManager.size()).toBe(2);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('TTL後に値が期限切れになる', () => {
      cacheManager.set('key1', 'value1');
      expect(cacheManager.get('key1')).toBe('value1');
      
      // Advance time past TTL
      jest.advanceTimersByTime(61000);
      
      expect(cacheManager.get('key1')).toBeUndefined();
    });

    it('カスタムTTLを設定できる', () => {
      cacheManager.set('key1', 'value1', 5000); // 5 seconds
      expect(cacheManager.get('key1')).toBe('value1');
      
      // Advance 4 seconds - should still be valid
      jest.advanceTimersByTime(4000);
      expect(cacheManager.get('key1')).toBe('value1');
      
      // Advance 2 more seconds - should be expired
      jest.advanceTimersByTime(2000);
      expect(cacheManager.get('key1')).toBeUndefined();
    });

    it('更新時にTTLがリセットされる', () => {
      cacheManager.set('key1', 'value1', 10000);
      
      // Advance 8 seconds
      jest.advanceTimersByTime(8000);
      
      // Update the value - TTL should reset
      cacheManager.set('key1', 'value2', 10000);
      
      // Advance 5 more seconds (total 13 seconds from original)
      jest.advanceTimersByTime(5000);
      
      // Should still be valid because TTL was reset
      expect(cacheManager.get('key1')).toBe('value2');
    });
  });

  describe('Size Limit', () => {
    it('最大サイズを超えると古いエントリが削除される', () => {
      const smallCache = new CacheManager<string>({
        maxSize: 3,
        ttl: 60000,
      });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      expect(smallCache.size()).toBe(3);
      
      // Adding 4th item should evict the oldest (key1)
      smallCache.set('key4', 'value4');
      
      expect(smallCache.size()).toBe(3);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key4')).toBe(true);
    });

    it('LRU方式で削除される', () => {
      const smallCache = new CacheManager<string>({
        maxSize: 3,
        ttl: 60000,
      });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      smallCache.get('key1');
      
      // Adding 4th item should evict key2 (least recently used)
      smallCache.set('key4', 'value4');
      
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });
  });

  describe('Complex Data Types', () => {
    it('オブジェクトを保存できる', () => {
      const objCache = new CacheManager<object>({
        maxSize: 10,
        ttl: 60000,
      });

      const obj = { name: 'test', value: 123 };
      objCache.set('obj1', obj);
      
      expect(objCache.get('obj1')).toEqual(obj);
    });

    it('配列を保存できる', () => {
      const arrayCache = new CacheManager<any[]>({
        maxSize: 10,
        ttl: 60000,
      });

      const arr = [1, 2, 3, 'test'];
      arrayCache.set('arr1', arr);
      
      expect(arrayCache.get('arr1')).toEqual(arr);
    });

    it('nullとundefinedを区別する', () => {
      const cache = new CacheManager<any>({
        maxSize: 10,
        ttl: 60000,
      });

      cache.set('null', null);
      cache.set('undefined', undefined);
      
      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.has('null')).toBe(true);
      expect(cache.has('undefined')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('ヒット率を計算できる', () => {
      cacheManager.set('key1', 'value1');
      
      // 2 hits
      cacheManager.get('key1');
      cacheManager.get('key1');
      
      // 3 misses
      cacheManager.get('key2');
      cacheManager.get('key3');
      cacheManager.get('key4');
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(3);
      expect(stats.hitRate).toBeCloseTo(0.4, 2); // 2/5 = 0.4
    });

    it('統計をリセットできる', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.get('key1');
      cacheManager.get('key2');
      
      cacheManager.resetStats();
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('期限切れエントリを自動的にクリーンアップする', () => {
      cacheManager.set('key1', 'value1', 5000);
      cacheManager.set('key2', 'value2', 10000);
      cacheManager.set('key3', 'value3', 15000);
      
      expect(cacheManager.size()).toBe(3);
      
      // Advance 6 seconds - key1 should expire
      jest.advanceTimersByTime(6000);
      cacheManager.cleanup();
      
      expect(cacheManager.size()).toBe(2);
      expect(cacheManager.has('key1')).toBe(false);
      
      // Advance 5 more seconds - key2 should expire
      jest.advanceTimersByTime(5000);
      cacheManager.cleanup();
      
      expect(cacheManager.size()).toBe(1);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.has('key3')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('空文字列をキーとして使用できる', () => {
      cacheManager.set('', 'empty key');
      expect(cacheManager.get('')).toBe('empty key');
    });

    it('大きなオブジェクトを保存できる', () => {
      const largeObj = {
        data: new Array(1000).fill('x').join(''),
        nested: {
          deep: {
            value: 'test',
          },
        },
      };
      
      cacheManager.set('large', largeObj);
      expect(cacheManager.get('large')).toEqual(largeObj);
    });

    it('同じ参照のオブジェクトを保存できる', () => {
      const sharedObj = { value: 1 };
      cacheManager.set('ref1', sharedObj);
      cacheManager.set('ref2', sharedObj);
      
      // Modify the object
      sharedObj.value = 2;
      
      // Both cache entries should reflect the change
      expect(cacheManager.get('ref1')?.value).toBe(2);
      expect(cacheManager.get('ref2')?.value).toBe(2);
    });
  });
});