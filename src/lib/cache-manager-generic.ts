interface CacheEntry<T> {
  value: T;
  expiry: number;
}

interface CacheOptions {
  maxSize: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  private stats: { hits: number; misses: number };
  private accessOrder: string[];

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.options = options;
    this.stats = { hits: 0, misses: 0 };
    this.accessOrder = [];
  }

  set(key: string, value: T, ttl?: number): void {
    const expiryTime = Date.now() + (ttl || this.options.ttl);
    
    // Remove from access order if exists
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
    
    // Check size limit
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      // Remove least recently used
      const lru = this.accessOrder.shift();
      if (lru) {
        this.cache.delete(lru);
      }
    }
    
    this.cache.set(key, { value, expiry: expiryTime });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.stats.misses++;
      return undefined;
    }
    
    // Update access order (move to end)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
    
    this.stats.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate
    };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }
}