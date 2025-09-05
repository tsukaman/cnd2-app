const { 
  isDevelopment, 
  isKVAvailable, 
  withKV, 
  kvGet, 
  kvPut, 
  kvDelete,
  incrementMetrics 
} = require('../kv-helpers.js');

describe('KV Helpers', () => {
  let mockKV;
  
  beforeEach(() => {
    // Mock KV namespace
    mockKV = {
      get: jest.fn(),
      put: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('isDevelopment', () => {
    it('should return true for development environment', () => {
      expect(isDevelopment({ NODE_ENV: 'development' })).toBe(true);
    });
    
    it('should return true for CF_PAGES non-main branch', () => {
      expect(isDevelopment({ CF_PAGES: '1', CF_PAGES_BRANCH: 'feature' })).toBe(true);
    });
    
    it('should return true for CF_PAGES main branch without KV', () => {
      // KVがない場合は開発環境と判定される
      expect(isDevelopment({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' })).toBe(true);
    });
    
    it('should return false for CF_PAGES main branch with KV', () => {
      // KVがある場合のみ本番環境と判定
      expect(isDevelopment({ 
        CF_PAGES: '1', 
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      })).toBe(false);
    });
    
    it('should return true when KV is not available', () => {
      expect(isDevelopment({})).toBe(true);
    });
    
    it('should return false for production with KV', () => {
      expect(isDevelopment({ 
        NODE_ENV: 'production', 
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      })).toBe(false);
    });
  });
  
  describe('isKVAvailable', () => {
    it('should return false in development', () => {
      expect(isKVAvailable({ NODE_ENV: 'development', DIAGNOSIS_KV: mockKV })).toBe(false);
    });
    
    it('should return false without KV namespace', () => {
      expect(isKVAvailable({ NODE_ENV: 'production' })).toBe(false);
    });
    
    it('should return true in production with KV', () => {
      expect(isKVAvailable({ 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      })).toBe(true);
    });
  });
  
  describe('withKV', () => {
    it('should execute operation in production', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      const operation = jest.fn().mockResolvedValue('result');
      
      const result = await withKV(env, operation, 'fallback');
      
      expect(operation).toHaveBeenCalledWith(mockKV);
      expect(result).toBe('result');
    });
    
    it('should return fallback in development', async () => {
      const env = { NODE_ENV: 'development', DIAGNOSIS_KV: mockKV };
      const operation = jest.fn();
      
      const result = await withKV(env, operation, 'fallback');
      
      expect(operation).not.toHaveBeenCalled();
      expect(result).toBe('fallback');
    });
    
    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      const operation = jest.fn().mockRejectedValue(new Error('KV Error'));
      
      const result = await withKV(env, operation, 'fallback');
      
      expect(result).toBe('fallback');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('kvGet', () => {
    it('should get value from KV in production', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      mockKV.get.mockResolvedValue('stored-value');
      
      const result = await kvGet(env, 'test-key', 'default');
      
      expect(mockKV.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('stored-value');
    });
    
    it('should return default value in development', async () => {
      const env = { NODE_ENV: 'development' };
      
      const result = await kvGet(env, 'test-key', 'default');
      
      expect(mockKV.get).not.toHaveBeenCalled();
      expect(result).toBe('default');
    });
  });
  
  describe('kvPut', () => {
    it('should store value in KV in production', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      
      const result = await kvPut(env, 'test-key', 'test-value', { expirationTtl: 3600 });
      
      expect(mockKV.put).toHaveBeenCalledWith('test-key', 'test-value', { expirationTtl: 3600 });
      expect(result).toBe(true);
    });
    
    it('should return false in development', async () => {
      const env = { NODE_ENV: 'development' };
      
      const result = await kvPut(env, 'test-key', 'test-value');
      
      expect(mockKV.put).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('kvDelete', () => {
    it('should delete value from KV in production', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      
      const result = await kvDelete(env, 'test-key');
      
      expect(mockKV.delete).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });
    
    it('should return false in development', async () => {
      const env = { NODE_ENV: 'development' };
      
      const result = await kvDelete(env, 'test-key');
      
      expect(mockKV.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('incrementMetrics', () => {
    it('should increment metrics in production', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      mockKV.get.mockResolvedValue('5');
      
      const result = await incrementMetrics(env, 'metrics:test');
      
      expect(mockKV.get).toHaveBeenCalledWith('metrics:test');
      expect(mockKV.put).toHaveBeenCalledWith('metrics:test', '6');
      expect(result).toBe(6);
    });
    
    it('should handle null value as 0', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      mockKV.get.mockResolvedValue(null);
      
      const result = await incrementMetrics(env, 'metrics:test');
      
      expect(mockKV.put).toHaveBeenCalledWith('metrics:test', '1');
      expect(result).toBe(1);
    });
    
    it('should return 0 in development', async () => {
      const env = { NODE_ENV: 'development' };
      
      const result = await incrementMetrics(env, 'metrics:test');
      
      expect(mockKV.get).not.toHaveBeenCalled();
      expect(mockKV.put).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
    
    it('should return 0 on error', async () => {
      const env = { 
        NODE_ENV: 'production',
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DIAGNOSIS_KV: mockKV 
      };
      mockKV.get.mockRejectedValue(new Error('KV Error'));
      
      const result = await incrementMetrics(env, 'metrics:test');
      
      expect(result).toBe(0);
    });
  });
});