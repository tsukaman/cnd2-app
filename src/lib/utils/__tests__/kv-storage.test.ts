import { saveDiagnosisResult, loadDiagnosisResult, cleanupOldResults } from '../kv-storage';
import { logger } from '@/lib/logger';
import type { DiagnosisResult } from '@/types';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('kv-storage', () => {
  const mockResult: DiagnosisResult = {
    id: 'test-123',
    mode: 'duo',
    type: 'test',
    compatibility: 85,
    summary: 'Test summary',
    strengths: ['Test strength'],
    opportunities: ['Test opportunity'],
    advice: 'Test advice',
    participants: [],
    createdAt: new Date().toISOString(),
    aiPowered: true,
    conversationTopics: ['Test topic'],
    conversationStarters: ['Test starter'],
    luckyItem: 'Test item',
    luckyAction: 'Test action',
    luckyProject: 'kubernetes',
    luckyProjectDescription: 'Container orchestration platform',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('saveDiagnosisResult', () => {
    it('should save to localStorage when enabled', async () => {
      const result = await saveDiagnosisResult(mockResult, {
        saveToLocalStorage: true,
        saveToKV: false,
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'diagnosis-result-test-123',
        JSON.stringify(mockResult)
      );
      expect(result).toEqual({ success: true, kvSaved: false });
    });

    it('should skip localStorage when disabled', async () => {
      const result = await saveDiagnosisResult(mockResult, {
        saveToLocalStorage: false,
        saveToKV: false,
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, kvSaved: false });
    });

    it('should save to KV storage with successful response', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await saveDiagnosisResult(mockResult, {
        saveToLocalStorage: false,
        saveToKV: true,
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mockResult.id, result: mockResult }),
      });
      expect(result).toEqual({ success: true, kvSaved: true });
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should retry on KV storage failure', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const result = await saveDiagnosisResult(mockResult, {
        saveToKV: true,
        retryCount: 2,
        retryDelay: 10,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true, kvSaved: true });
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return error after all retries fail', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await saveDiagnosisResult(mockResult, {
        saveToKV: true,
        retryCount: 2,
        retryDelay: 10,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true); // LocalStorage might succeed
      expect(result.kvSaved).toBe(false);
      expect(result.error).toBe('Network error');
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should skip KV storage in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';

      const result = await saveDiagnosisResult(mockResult, {
        saveToKV: true,
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, kvSaved: false });

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should save to KV in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await saveDiagnosisResult(mockResult, {
        saveToKV: true,
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual({ success: true, kvSaved: true });

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = await saveDiagnosisResult(mockResult, {
        saveToLocalStorage: true,
        saveToKV: false,
      });

      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] LocalStorage save failed:',
        expect.any(Error)
      );
      expect(result).toEqual({ success: true, kvSaved: false });
    });

    it('should handle HTTP error responses', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      const result = await saveDiagnosisResult(mockResult, {
        saveToKV: true,
        retryCount: 1,
        retryDelay: 10,
      });

      expect(result.success).toBe(true);
      expect(result.kvSaved).toBe(false);
      expect(result.error).toContain('Server error');
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should use exponential backoff for retries', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      let callCount = 0;
      const startTime = Date.now();
      
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      const result = await saveDiagnosisResult(mockResult, {
        saveToKV: true,
        retryCount: 3,
        retryDelay: 50,
      });

      const elapsedTime = Date.now() - startTime;
      
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result.kvSaved).toBe(true);
      // First retry after 50ms, second after 100ms (50*2)
      expect(elapsedTime).toBeGreaterThanOrEqual(150);
      
      (process.env as any).NODE_ENV = originalEnv;
    });
  });

  describe('loadDiagnosisResult', () => {
    it('should load from localStorage when available', async () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockResult));

      const result = await loadDiagnosisResult('test-123', {
        checkLocalStorage: true,
        checkKV: false,
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('diagnosis-result-test-123');
      expect(result).toEqual(mockResult);
    });

    it('should load from KV when localStorage is empty in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      localStorageMock.getItem.mockReturnValueOnce(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockResult }),
      });

      const result = await loadDiagnosisResult('test-123', {
        checkLocalStorage: true,
        checkKV: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/results?id=test-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        })
      );
      expect(result).toEqual(mockResult);
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should cache KV result in localStorage in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      localStorageMock.getItem.mockReturnValueOnce(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockResult }),
      });

      await loadDiagnosisResult('test-123', {
        checkLocalStorage: true,
        checkKV: true,
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'diagnosis-result-test-123',
        JSON.stringify(mockResult)
      );
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return null when result not found', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await loadDiagnosisResult('test-123');

      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const result = await loadDiagnosisResult('test-123', {
        checkLocalStorage: true,
        checkKV: false,
      });

      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] LocalStorage load failed:',
        expect.any(Error)
      );
      expect(result).toBeNull();
    });

    it('should handle KV fetch errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      localStorageMock.getItem.mockReturnValueOnce(null);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await loadDiagnosisResult('test-123');

      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] KV load failed:',
        expect.any(Error)
      );
      expect(result).toBeNull();
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should handle malformed JSON in localStorage', async () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const result = await loadDiagnosisResult('test-123', {
        checkLocalStorage: true,
        checkKV: false,
      });

      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] LocalStorage load failed:',
        expect.any(Error)
      );
      expect(result).toBeNull();
    });

    it('should skip localStorage when disabled', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockResult }),
      });

      const result = await loadDiagnosisResult('test-123', {
        checkLocalStorage: false,
        checkKV: true,
      });

      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should skip KV when disabled', async () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockResult));

      const result = await loadDiagnosisResult('test-123', {
        checkLocalStorage: true,
        checkKV: false,
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('cleanupOldResults', () => {
    it('should remove old results from localStorage', () => {
      const now = Date.now();
      const oldDate = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(); // 8 days old
      const recentDate = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day old

      const oldResult = { ...mockResult, createdAt: oldDate };
      const recentResult = { ...mockResult, createdAt: recentDate };

      localStorageMock.length = 2;
      localStorageMock.key.mockImplementation((index: number) => {
        if (index === 0) return 'diagnosis-result-old';
        if (index === 1) return 'diagnosis-result-recent';
        return null;
      });

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'diagnosis-result-old') return JSON.stringify(oldResult);
        if (key === 'diagnosis-result-recent') return JSON.stringify(recentResult);
        return null;
      });

      cleanupOldResults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('diagnosis-result-old');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('diagnosis-result-recent');
    });

    it('should remove results with invalid JSON', () => {
      localStorageMock.length = 1;
      localStorageMock.key.mockReturnValueOnce('diagnosis-result-invalid');
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      cleanupOldResults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('diagnosis-result-invalid');
    });

    it('should skip non-diagnosis keys', () => {
      localStorageMock.length = 2;
      localStorageMock.key.mockImplementation((index: number) => {
        if (index === 0) return 'other-key';
        if (index === 1) return 'diagnosis-result-test';
        return null;
      });

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockResult));

      cleanupOldResults();

      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other-key');
    });

    it('should handle results without createdAt', () => {
      const resultWithoutDate = { ...mockResult, createdAt: undefined };

      localStorageMock.length = 1;
      localStorageMock.key.mockReturnValueOnce('diagnosis-result-no-date');
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(resultWithoutDate));

      cleanupOldResults();

      // Results without createdAt are not removed (createdAt becomes 0 which is falsy)
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('should use custom maxAge parameter', () => {
      const now = Date.now();
      const twoDaysOld = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
      const result = { ...mockResult, createdAt: twoDaysOld };

      localStorageMock.length = 1;
      localStorageMock.key.mockReturnValueOnce('diagnosis-result-old');
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(result));

      // Custom maxAge of 1 day
      cleanupOldResults(1 * 24 * 60 * 60 * 1000);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('diagnosis-result-old');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.length = 1;
      localStorageMock.key.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      cleanupOldResults();

      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] Cleanup failed:',
        expect.any(Error)
      );
    });

    // Skip test for non-browser environment as it's difficult to test in Jest
    // The actual implementation checks typeof window === 'undefined' at the beginning

    it('should log summary when items are cleaned', () => {
      const now = Date.now();
      const oldDate = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
      const oldResult = { ...mockResult, createdAt: oldDate };

      localStorageMock.length = 2;
      localStorageMock.key.mockImplementation((index: number) => {
        if (index === 0) return 'diagnosis-result-old1';
        if (index === 1) return 'diagnosis-result-old2';
        return null;
      });

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldResult));

      cleanupOldResults();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 2 old results')
      );
    });
  });
});