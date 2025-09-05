const {
  isDebugMode,
  isProduction,
  isSensitiveKey,
  getFilteredEnvKeys,
  maskSensitiveValue,
  getSafeKeyInfo,
  createSafeDebugLogger
} = require('../debug-helpers.js');

describe('debug-helpers', () => {
  describe('isDebugMode', () => {
    it('should return true when DEBUG_MODE is true', () => {
      expect(isDebugMode({ DEBUG_MODE: 'true' })).toBe(true);
    });

    it('should return true in development environment', () => {
      expect(isDebugMode({ NODE_ENV: 'development' })).toBe(true);
    });

    it('should require explicit DEBUG_MODE in production', () => {
      expect(isDebugMode({ NODE_ENV: 'production' })).toBe(false);
      expect(isDebugMode({ NODE_ENV: 'production', DEBUG_MODE: 'true' })).toBe(true);
    });

    it('should handle null/undefined env', () => {
      expect(isDebugMode(null)).toBe(false);
      expect(isDebugMode(undefined)).toBe(false);
      expect(isDebugMode({})).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('should detect production environment', () => {
      expect(isProduction({ NODE_ENV: 'production' })).toBe(true);
      expect(isProduction({ CF_PAGES: '1' })).toBe(true);
    });

    it('should return false for non-production', () => {
      expect(isProduction({ NODE_ENV: 'development' })).toBe(false);
      expect(isProduction({})).toBe(false);
    });
  });

  describe('isSensitiveKey', () => {
    it('should detect API keys and tokens', () => {
      expect(isSensitiveKey('OPENAI_API_KEY')).toBe(true);
      expect(isSensitiveKey('GITHUB_TOKEN')).toBe(true);
      expect(isSensitiveKey('SECRET_KEY')).toBe(true);
      expect(isSensitiveKey('ACCESS_TOKEN')).toBe(true);
    });

    it('should detect authentication related keys', () => {
      expect(isSensitiveKey('PASSWORD')).toBe(true);
      expect(isSensitiveKey('AUTH_TOKEN')).toBe(true);
      expect(isSensitiveKey('OAUTH_SECRET')).toBe(true);
    });

    it('should detect database connection strings', () => {
      expect(isSensitiveKey('DATABASE_URL')).toBe(true);
      expect(isSensitiveKey('MONGODB_URI')).toBe(true);
      expect(isSensitiveKey('POSTGRES_CONNECTION')).toBe(true);
    });

    it('should detect cloud service credentials', () => {
      expect(isSensitiveKey('AWS_SECRET_ACCESS_KEY')).toBe(true);
      expect(isSensitiveKey('AZURE_CLIENT_SECRET')).toBe(true);
      expect(isSensitiveKey('CLOUDFLARE_API_TOKEN')).toBe(true);
    });

    it('should not flag safe keys', () => {
      expect(isSensitiveKey('NODE_ENV')).toBe(false);
      expect(isSensitiveKey('PORT')).toBe(false);
      expect(isSensitiveKey('DEBUG_MODE')).toBe(false);
      expect(isSensitiveKey('APP_NAME')).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(isSensitiveKey(null)).toBe(false);
      expect(isSensitiveKey(undefined)).toBe(false);
      expect(isSensitiveKey('')).toBe(false);
      expect(isSensitiveKey(123)).toBe(false);
    });
  });

  describe('getFilteredEnvKeys', () => {
    it('should filter out sensitive keys', () => {
      const env = {
        NODE_ENV: 'production',
        PORT: '3000',
        OPENAI_API_KEY: 'sk-xxx',
        DATABASE_URL: 'postgres://...',
        APP_NAME: 'MyApp'
      };
      
      const filtered = getFilteredEnvKeys(env);
      expect(filtered).toContain('NODE_ENV');
      expect(filtered).toContain('PORT');
      expect(filtered).toContain('APP_NAME');
      expect(filtered).not.toContain('OPENAI_API_KEY');
      expect(filtered).not.toContain('DATABASE_URL');
    });

    it('should respect limit parameter', () => {
      const env = {
        A: '1', B: '2', C: '3', D: '4', E: '5'
      };
      
      expect(getFilteredEnvKeys(env, 3)).toHaveLength(3);
    });

    it('should handle invalid input', () => {
      expect(getFilteredEnvKeys(null)).toEqual([]);
      expect(getFilteredEnvKeys(undefined)).toEqual([]);
      expect(getFilteredEnvKeys('not an object')).toEqual([]);
    });
  });

  describe('maskSensitiveValue', () => {
    it('should mask sensitive values correctly', () => {
      // 18文字 - 4 = 14文字がマスクされる
      expect(maskSensitiveValue('sk-abcdefghijklmnop')).toBe('sk-a***************');
      // 12文字 - 4 = 8文字がマスクされる
      expect(maskSensitiveValue('secret123456')).toBe('secr********');
    });

    it('should handle short values', () => {
      expect(maskSensitiveValue('abc')).toBe('***');
      expect(maskSensitiveValue('1234')).toBe('***');
    });

    it('should limit masked length', () => {
      const longValue = 'a'.repeat(100);
      const masked = maskSensitiveValue(longValue);
      expect(masked).toBe('aaaa' + '*'.repeat(20));
    });

    it('should handle invalid input', () => {
      expect(maskSensitiveValue(null)).toBe('***');
      expect(maskSensitiveValue(undefined)).toBe('***');
      expect(maskSensitiveValue('')).toBe('***');
    });
  });

  describe('getSafeKeyInfo', () => {
    it('should provide safe API key information', () => {
      const keyInfo = getSafeKeyInfo('sk-proj-abcdefghijklmnopqrstuvwxyz');
      
      expect(keyInfo.exists).toBe(true);
      expect(keyInfo.format).toBe('valid');
      expect(keyInfo.length).toBe(34);  // 実際の文字数
      expect(keyInfo.startsWithSk).toBe(true);
      expect(keyInfo.hasWhitespace).toBe(false);
      expect(keyInfo.masked).toBe('sk-p********************');  // 最大20文字のマスク
    });

    it('should detect invalid keys', () => {
      const shortKey = getSafeKeyInfo('sk-123');
      expect(shortKey.format).toBe('invalid');
      
      const whitespaceKey = getSafeKeyInfo('  sk-abcdefghijklmnopqrstuvwxyz  ');
      expect(whitespaceKey.hasWhitespace).toBe(true);
    });

    it('should handle missing keys', () => {
      const missing = getSafeKeyInfo(null);
      expect(missing.exists).toBe(false);
      expect(missing.format).toBe('missing');
    });
  });

  describe('createSafeDebugLogger', () => {
    let originalConsole;

    beforeEach(() => {
      originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn
      };
      console.log = jest.fn();
      console.error = jest.fn();
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    });

    it('should not log in production without DEBUG_MODE', () => {
      const logger = createSafeDebugLogger({ NODE_ENV: 'production' });
      
      logger.log('test');
      logger.error('error');
      logger.warn('warning');
      
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should log in development environment', () => {
      const logger = createSafeDebugLogger({ NODE_ENV: 'development' });
      
      logger.log('test message');
      expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'test message');
    });

    it('should log in production with DEBUG_MODE=true', () => {
      const logger = createSafeDebugLogger({ NODE_ENV: 'production', DEBUG_MODE: 'true' });
      
      logger.log('debug info');
      expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'debug info');
    });

    it('should sanitize sensitive object properties', () => {
      const logger = createSafeDebugLogger({ DEBUG_MODE: 'true' });
      
      logger.log('Config:', {
        PORT: 3000,
        OPENAI_API_KEY: 'sk-secret-key-123',
        DATABASE_URL: 'postgres://user:pass@host/db'
      });
      
      expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'Config:', {
        PORT: 3000,
        OPENAI_API_KEY: '[REDACTED]',
        DATABASE_URL: '[REDACTED]'
      });
    });

    it('should sanitize strings with sensitive patterns', () => {
      const logger = createSafeDebugLogger({ DEBUG_MODE: 'true' });
      
      logger.log('Using key sk-abcdefghijklmnopqrstuvwxyz123456');
      
      const call = console.log.mock.calls[0];
      expect(call[1]).toContain('sk-[REDACTED]');
    });

    it('should handle nested objects', () => {
      const logger = createSafeDebugLogger({ DEBUG_MODE: 'true' });
      
      logger.log({
        level1: {
          level2: {
            API_KEY: 'secret',
            normalField: 'value'
          }
        }
      });
      
      const logged = console.log.mock.calls[0][1];
      expect(logged.level1.level2.API_KEY).toBe('[REDACTED]');
      expect(logged.level1.level2.normalField).toBe('value');
    });

    it('should prevent deep recursion', () => {
      const logger = createSafeDebugLogger({ DEBUG_MODE: 'true' });
      
      const deepObject = {};
      let current = deepObject;
      for (let i = 0; i < 10; i++) {
        current.nested = { level: i };
        current = current.nested;
      }
      
      logger.log(deepObject);
      expect(console.log).toHaveBeenCalled();
      // Should not throw or hang
    });

    it('should use custom prefix', () => {
      const logger = createSafeDebugLogger({ DEBUG_MODE: 'true' }, '[CUSTOM]');
      
      logger.log('message');
      expect(console.log).toHaveBeenCalledWith('[CUSTOM]', 'message');
    });
  });
});