/**
 * Cloudflare Workers KV Storage Interface
 * This module provides methods to interact with Workers KV for persistent storage
 */

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
}

interface KVPutOptions {
  expirationTtl?: number; // TTL in seconds
  expiration?: number; // Unix timestamp
  metadata?: Record<string, any>;
}

interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface KVListResult {
  keys: Array<{ name: string; metadata?: Record<string, any> }>;
  list_complete: boolean;
  cursor?: string;
}

export class KVStorage {
  private kv: KVNamespace;
  private prefix: string;

  constructor(kvNamespace: KVNamespace, prefix: string = 'cnd2') {
    this.kv = kvNamespace;
    this.prefix = prefix;
  }

  /**
   * Generate a namespaced key
   */
  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Store diagnosis result
   */
  async storeDiagnosis(id: string, result: any): Promise<void> {
    const key = this.getKey(`diagnosis:${id}`);
    const value = JSON.stringify({
      ...result,
      storedAt: new Date().toISOString(),
    });

    // Store for 30 days
    await this.kv.put(key, value, {
      expirationTtl: 30 * 24 * 60 * 60, // 30 days in seconds
      metadata: {
        type: 'diagnosis',
        createdAt: result.createdAt || new Date().toISOString(),
      },
    });
  }

  /**
   * Retrieve diagnosis result
   */
  async getDiagnosis(id: string): Promise<any | null> {
    const key = this.getKey(`diagnosis:${id}`);
    const value = await this.kv.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('[KV] Failed to parse diagnosis:', error);
      return null;
    }
  }

  /**
   * Delete diagnosis result
   */
  async deleteDiagnosis(id: string): Promise<void> {
    const key = this.getKey(`diagnosis:${id}`);
    await this.kv.delete(key);
  }

  /**
   * List all diagnosis results
   */
  async listDiagnoses(limit: number = 100, cursor?: string): Promise<KVListResult> {
    return await this.kv.list({
      prefix: this.getKey('diagnosis:'),
      limit,
      cursor,
    });
  }

  /**
   * Store Prairie Card profile cache
   */
  async storePrairieProfile(url: string, profile: any): Promise<void> {
    const key = this.getKey(`prairie:${Buffer.from(url).toString('base64')}`);
    const value = JSON.stringify({
      ...profile,
      cachedAt: new Date().toISOString(),
    });

    // Cache for 24 hours
    await this.kv.put(key, value, {
      expirationTtl: 24 * 60 * 60, // 24 hours in seconds
      metadata: {
        type: 'prairie_profile',
        url,
      },
    });
  }

  /**
   * Retrieve Prairie Card profile from cache
   */
  async getPrairieProfile(url: string): Promise<any | null> {
    const key = this.getKey(`prairie:${Buffer.from(url).toString('base64')}`);
    const value = await this.kv.get(key);

    if (!value) {
      return null;
    }

    try {
      const data = JSON.parse(value);
      
      // Check if cache is still valid (24 hours)
      const cachedAt = new Date(data.cachedAt);
      const now = new Date();
      const hoursSinceCached = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCached > 24) {
        // Cache expired, delete and return null
        await this.kv.delete(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[KV] Failed to parse Prairie profile:', error);
      return null;
    }
  }

  /**
   * Store rate limit data
   */
  async incrementRateLimit(identifier: string, windowMinutes: number = 15): Promise<number> {
    const now = new Date();
    const window = Math.floor(now.getTime() / (windowMinutes * 60 * 1000));
    const key = this.getKey(`ratelimit:${identifier}:${window}`);
    
    const current = await this.kv.get(key);
    const count = current ? parseInt(current, 10) + 1 : 1;
    
    await this.kv.put(key, count.toString(), {
      expirationTtl: windowMinutes * 60, // Expire after the window
    });

    return count;
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(identifier: string, limit: number, windowMinutes: number = 15): Promise<boolean> {
    const count = await this.incrementRateLimit(identifier, windowMinutes);
    return count <= limit;
  }
}