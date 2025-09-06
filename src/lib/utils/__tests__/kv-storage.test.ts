import { saveDiagnosisResult, loadDiagnosisResult, cleanupOldResults } from '../kv-storage';
import { logger } from '@/lib/logger';
import type { DiagnosisResult } from '@/types';
import { StorageFactory } from '@/lib/storage/storage-factory';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock StorageFactory
jest.mock('@/lib/storage/storage-factory');

// Mock localStorage for cleanupOldResults
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
    type: 'standard',
    compatibility: 85,
    summary: 'Test summary',
    participants: [],
    createdAt: new Date().toISOString(),
    aiPowered: true,
    luckyItem: 'Test item',
    luckyAction: 'Test action'
  };

  // Mock storage implementation
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Setup mock storage
    mockStorage = {
      save: jest.fn(),
      get: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn()
    };
    
    (StorageFactory.getStorage as jest.Mock).mockReturnValue(mockStorage);
  });

  describe('saveDiagnosisResult', () => {
    it('should save using StorageFactory', async () => {
      mockStorage.save.mockResolvedValue({ success: true });
      
      const result = await saveDiagnosisResult(mockResult);

      expect(mockStorage.save).toHaveBeenCalledWith(mockResult);
      expect(result.success).toBe(true);
    });

    it('should handle save errors', async () => {
      mockStorage.save.mockResolvedValue({ success: false, error: 'Save failed' });
      
      const result = await saveDiagnosisResult(mockResult);

      expect(mockStorage.save).toHaveBeenCalledWith(mockResult);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Save failed');
    });

    it('should set kvSaved flag in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      mockStorage.save.mockResolvedValue({ success: true });

      const result = await saveDiagnosisResult(mockResult);

      expect(result.kvSaved).toBe(true);
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should not set kvSaved flag in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      mockStorage.save.mockResolvedValue({ success: true });

      const result = await saveDiagnosisResult(mockResult);

      expect(result.kvSaved).toBe(false);
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should handle exceptions during save', async () => {
      mockStorage.save.mockRejectedValue(new Error('Storage error'));

      const result = await saveDiagnosisResult(mockResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] Save failed:',
        expect.any(Error)
      );
    });
  });

  describe('loadDiagnosisResult', () => {
    it('should load from StorageFactory', async () => {
      mockStorage.get.mockResolvedValue(mockResult);

      const result = await loadDiagnosisResult('test-123');

      expect(mockStorage.get).toHaveBeenCalledWith('test-123');
      expect(result).toEqual(mockResult);
      expect(logger.info).toHaveBeenCalledWith('[KV Storage] Loaded result: test-123');
    });

    it('should return null when not found', async () => {
      mockStorage.get.mockResolvedValue(null);

      const result = await loadDiagnosisResult('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle load errors gracefully', async () => {
      mockStorage.get.mockRejectedValue(new Error('Load failed'));

      const result = await loadDiagnosisResult('test-123');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        '[KV Storage] Load failed:',
        expect.any(Error)
      );
    });
  });

  describe('cleanupOldResults', () => {
    beforeEach(() => {
      localStorageMock.length = 0;
      localStorageMock.key.mockImplementation((index) => {
        const keys = ['diagnosis-result-old', 'diagnosis-result-new', 'other-key'];
        return keys[index] || null;
      });
    });

    it('should remove old results', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      const newDate = new Date();

      localStorageMock.length = 2;
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'diagnosis-result-old') {
          return JSON.stringify({ ...mockResult, createdAt: oldDate.toISOString() });
        } else if (key === 'diagnosis-result-new') {
          return JSON.stringify({ ...mockResult, createdAt: newDate.toISOString() });
        }
        return null;
      });

      cleanupOldResults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('diagnosis-result-old');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('diagnosis-result-new');
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock.length = 1;
      localStorageMock.getItem.mockReturnValue('invalid json');

      cleanupOldResults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('diagnosis-result-old');
    });

    it('should skip if window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      cleanupOldResults();

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();

      global.window = originalWindow as any;
    });
  });
});