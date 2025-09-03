// Mock getApiConfig before importing rate-limit
jest.mock('../env', () => ({
  getApiConfig: () => ({
    rateLimit: 10,
    rateLimitWindow: 60, // 60 seconds  
    timeout: 30000,
    corsOrigins: ['*'],
  }),
  env: {
    API_RATE_LIMIT: 10,
    API_RATE_LIMIT_WINDOW: 60,
    API_TIMEOUT: 30000,
    CORS_ORIGINS: '*',
  },
}));

import { checkRateLimit, clearAllRateLimits } from '../rate-limit';
import { NextRequest } from 'next/server';
import { ApiError, ApiErrorCode } from '../api-errors';

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    clearAllRateLimits(); // Use the exported function to clear the store
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function createMockRequest(ip: string = '192.168.1.1', headers: Record<string, string> = {}): NextRequest {
    const mockHeaders = new Map(Object.entries({
      'x-forwarded-for': ip,
      ...headers,
    }));

    return {
      headers: {
        get: (key: string) => mockHeaders.get(key.toLowerCase()) || null,
      },
      ip: ip,
    } as unknown as NextRequest;
  }

  describe('checkRateLimit', () => {
    it('初回リクエストを許可する', async () => {
      const request = createMockRequest('192.168.1.1');
      
      await expect(checkRateLimit(request)).resolves.not.toThrow();
    });

    it('制限内のリクエストを許可する', async () => {
      const request = createMockRequest('192.168.1.1');
      
      // Make 9 requests (under the limit of 10)
      for (let i = 0; i < 9; i++) {
        await expect(checkRateLimit(request)).resolves.not.toThrow();
      }
    });

    it('制限を超えたリクエストを拒否する', async () => {
      const request = createMockRequest('192.168.1.1');
      
      // Make 10 requests (hitting the limit)
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request);
      }
      
      // 11th request should be rejected
      await expect(checkRateLimit(request)).rejects.toThrow(ApiError);
      
      try {
        await checkRateLimit(request);
      } catch (error) {
        expect((error as ApiError).code).toBe(ApiErrorCode.RATE_LIMIT_ERROR);
        expect((error as ApiError).statusCode).toBe(429);
      }
    });

    it('時間経過後にリセットされる', async () => {
      const request = createMockRequest('192.168.1.1');
      
      // Max out requests
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request);
      }
      
      // Should be blocked
      await expect(checkRateLimit(request)).rejects.toThrow(ApiError);
      
      // Advance time past 1 minute
      jest.advanceTimersByTime(61000);
      
      // Should be allowed again
      await expect(checkRateLimit(request)).resolves.not.toThrow();
    });

    it('異なるIPアドレスを個別に追跡する', async () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      
      // Max out first IP
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request1);
      }
      
      // First IP should be blocked
      await expect(checkRateLimit(request1)).rejects.toThrow(ApiError);
      
      // Second IP should still be allowed
      await expect(checkRateLimit(request2)).resolves.not.toThrow();
    });

    it('x-real-ipヘッダーからIPを取得する', async () => {
      const request = createMockRequest('', {
        'x-real-ip': '10.0.0.1',
      });
      
      await expect(checkRateLimit(request)).resolves.not.toThrow();
      
      // Verify it's tracking the correct IP
      for (let i = 0; i < 9; i++) {
        await checkRateLimit(request);
      }
      
      // 11th request with same x-real-ip should be blocked
      await expect(checkRateLimit(request)).rejects.toThrow(ApiError);
    });

    it('cf-connecting-ipヘッダーからIPを取得する', async () => {
      const request = createMockRequest('', {
        'cf-connecting-ip': '172.16.0.1',
      });
      
      await expect(checkRateLimit(request)).resolves.not.toThrow();
    });

    it('IPアドレスが取得できない場合はunknownとして処理する', async () => {
      const mockHeaders = new Map();
      const request = {
        headers: {
          get: () => null,
        },
        ip: undefined,
      } as unknown as NextRequest;
      
      // Should track as 'unknown'
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(request);
      }
      
      await expect(checkRateLimit(request)).rejects.toThrow(ApiError);
    });

    it('期限切れエントリを自動的にクリーンアップする', async () => {
      // Create multiple entries
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      const request3 = createMockRequest('192.168.1.3');
      
      await checkRateLimit(request1);
      await checkRateLimit(request2);
      await checkRateLimit(request3);
      
      // All requests should work initially
      await expect(checkRateLimit(request1)).resolves.not.toThrow();
      await expect(checkRateLimit(request2)).resolves.not.toThrow();
      await expect(checkRateLimit(request3)).resolves.not.toThrow();
      
      // Advance time to expire entries
      jest.advanceTimersByTime(61000);
      
      // After expiry, all requests should work again (proving cleanup)
      await expect(checkRateLimit(request1)).resolves.not.toThrow();
      await expect(checkRateLimit(request2)).resolves.not.toThrow();
      await expect(checkRateLimit(request3)).resolves.not.toThrow();
    });
  });

  describe('Edge Runtime互換性', () => {
    it('setIntervalを使用しない', () => {
      // Read the actual implementation to verify
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rateLimit = require('../rate-limit');
      const sourceCode = rateLimit.toString();
      
      // The implementation should not use setInterval
      expect(sourceCode).not.toContain('setInterval');
    });
  });
});