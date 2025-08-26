import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';

describe('Environment validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear module cache
    jest.resetModules();
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('client-side configuration', () => {
    it('validates required client environment variables', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      process.env.NEXT_PUBLIC_APP_NAME = 'Test App';
      process.env.NEXT_PUBLIC_CND2_API = '/api';
      process.env.NEXT_PUBLIC_PRAIRIE_CARD_API = '/api/prairie';

      const { env } = require('@/lib/env');
      expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
      expect(env.NEXT_PUBLIC_APP_NAME).toBe('Test App');
    });

    it('uses default values when optional variables are not provided', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      delete process.env.NEXT_PUBLIC_APP_NAME;

      const { env } = require('@/lib/env');
      expect(env.NEXT_PUBLIC_APP_NAME).toBe('CND² 相性診断');
    });

    it('throws error for invalid URL format', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'not-a-url';

      expect(() => require('@/lib/env')).toThrow();
    });
  });

  describe('server-side configuration', () => {
    beforeEach(() => {
      // Mock window to simulate server environment
      global.window = undefined as any;
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('validates server environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.OPENAI_MODEL = 'gpt-4';
      process.env.API_RATE_LIMIT = '100';
      process.env.API_RATE_LIMIT_WINDOW = '60';
      process.env.API_TIMEOUT = '30000';
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';
      process.env.PRAIRIE_CARD_BASE_URL = 'https://prairie-card.example.com';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const { env, getServerConfig } = require('@/lib/env');
      const serverConfig = getServerConfig();

      expect(serverConfig.openai.apiKey).toBe('sk-test123');
      expect(serverConfig.openai.model).toBe('gpt-4');
      expect(serverConfig.database.url).toBe('postgresql://localhost/db');
    });

    it('throws error when calling getServerConfig on client', () => {
      global.window = {} as any;
      
      const { getServerConfig } = require('@/lib/env');
      expect(() => getServerConfig()).toThrow('getServerConfig() cannot be called on the client side');
    });

    it('validates integer conversion for rate limit', () => {
      process.env.API_RATE_LIMIT = '100';
      process.env.API_RATE_LIMIT_WINDOW = '60';
      process.env.API_TIMEOUT = '30000';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const { env } = require('@/lib/env');
      expect(env.API_RATE_LIMIT).toBe(100);
      expect(env.API_RATE_LIMIT_WINDOW).toBe(60);
      expect(env.API_TIMEOUT).toBe(30000);
    });

    it('throws error for negative numbers', () => {
      process.env.API_RATE_LIMIT = '-1';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      expect(() => require('@/lib/env')).toThrow();
    });

    it('throws error for non-integer strings', () => {
      process.env.API_RATE_LIMIT = 'abc';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      expect(() => require('@/lib/env')).toThrow();
    });
  });

  describe('getApiConfig', () => {
    it('returns parsed API configuration', () => {
      process.env.API_RATE_LIMIT = '100';
      process.env.API_RATE_LIMIT_WINDOW = '60';
      process.env.API_TIMEOUT = '30000';
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const { getApiConfig } = require('@/lib/env');
      const config = getApiConfig();

      expect(config.rateLimit).toBe(100);
      expect(config.rateLimitWindow).toBe(60);
      expect(config.timeout).toBe(30000);
      expect(config.corsOrigins).toEqual(['http://localhost:3000', 'https://example.com']);
    });

    it('caches CORS origins parsing', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000';
      process.env.API_RATE_LIMIT = '100';
      process.env.API_RATE_LIMIT_WINDOW = '60';
      process.env.API_TIMEOUT = '30000';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const { getApiConfig } = require('@/lib/env');
      const config1 = getApiConfig();
      const config2 = getApiConfig();

      // Should return the same array instance (cached)
      expect(config1.corsOrigins).toBe(config2.corsOrigins);
    });
  });

  describe('environment variable security', () => {
    it('does not expose OPENAI_API_KEY in client config', () => {
      process.env.OPENAI_API_KEY = 'sk-secret-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const { env } = require('@/lib/env');
      
      // Should not have OPENAI_API_KEY in the exported env
      expect('OPENAI_API_KEY' in env).toBe(false);
    });

    it('only exposes NEXT_PUBLIC_ variables to client', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      process.env.NEXT_PUBLIC_APP_NAME = 'Test App';
      process.env.DATABASE_URL = 'postgresql://secret';
      process.env.REDIS_URL = 'redis://secret';
      process.env.OPENAI_API_KEY = 'sk-secret';

      const { env } = require('@/lib/env');
      const publicKeys = Object.keys(env).filter(key => key.startsWith('NEXT_PUBLIC_'));
      const privateKeys = Object.keys(env).filter(key => !key.startsWith('NEXT_PUBLIC_'));

      // Client should only see NEXT_PUBLIC_ variables
      if (typeof window !== 'undefined') {
        expect(publicKeys.length).toBeGreaterThan(0);
        expect(privateKeys).not.toContain('OPENAI_API_KEY');
        expect(privateKeys).not.toContain('DATABASE_URL');
        expect(privateKeys).not.toContain('REDIS_URL');
      }
    });
  });
});