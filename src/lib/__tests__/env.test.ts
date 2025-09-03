/**
 * @jest-environment node
 */

describe('Environment validation', () => {
  describe('getApiConfig', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('returns default API configuration', () => {
      const { getApiConfig } = require('@/lib/env');
      const config = getApiConfig();

      expect(config.rateLimit).toBe(10);
      expect(config.rateLimitWindow).toBe(60);
      expect(config.timeout).toBe(30000);
      expect(config.corsOrigins).toEqual(['*']);
    });
  });

  describe('getServerConfig', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('throws error when called on client', () => {
      // Mock window to simulate client environment
      (global as typeof globalThis & { window?: unknown }).window = {};
      
      const { getServerConfig } = require('@/lib/env');
      expect(() => getServerConfig()).toThrow('getServerConfig() cannot be called on the client side');
      
      delete (global as typeof globalThis & { window?: unknown }).window;
    });

    it('returns server configuration when called on server', () => {
      // Ensure window is undefined (server environment)
      delete (global as typeof globalThis & { window?: unknown }).window;
      
      const { getServerConfig } = require('@/lib/env');
      const config = getServerConfig();

      expect(config.openai).toBeDefined();
      expect(config.openai.apiKey).toBeDefined();
      expect(config.openai.model).toBeDefined();
      expect(config.api).toBeDefined();
    });
  });
});