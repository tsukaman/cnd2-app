// Mock the environment utilities first before importing the module
jest.mock('@/lib/utils/environment', () => ({
  isDevelopment: jest.fn(),
  getEnvBoolean: jest.fn()
}));

import { isFallbackAllowed, getFallbackScoreRange } from '../fallback';
import { isDevelopment, getEnvBoolean } from '@/lib/utils/environment';

describe('フォールバック診断制御', () => {
  const mockIsDevelopment = isDevelopment as jest.MockedFunction<typeof isDevelopment>;
  const mockGetEnvBoolean = getEnvBoolean as jest.MockedFunction<typeof getEnvBoolean>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isFallbackAllowed', () => {
    it('ENABLE_FALLBACK=trueの場合trueを返す', () => {
      mockGetEnvBoolean.mockReturnValue(true);
      
      expect(isFallbackAllowed()).toBe(true);
      expect(mockGetEnvBoolean).toHaveBeenCalledWith('ENABLE_FALLBACK', false);
    });

    it('ENABLE_FALLBACK=falseの場合falseを返す', () => {
      mockGetEnvBoolean.mockReturnValue(false);
      
      expect(isFallbackAllowed()).toBe(false);
      expect(mockGetEnvBoolean).toHaveBeenCalledWith('ENABLE_FALLBACK', false);
    });

    it('環境変数が未設定の場合デフォルトでfalseを返す', () => {
      mockGetEnvBoolean.mockImplementation((key: string, defaultValue: boolean = false) => defaultValue);
      
      expect(isFallbackAllowed()).toBe(false);
    });
  });

  describe('getFallbackScoreRange', () => {
    describe('開発環境', () => {
      beforeEach(() => {
        mockIsDevelopment.mockReturnValue(true);
      });

      it('開発環境のスコア範囲を返す（30-40）', () => {
        const range = getFallbackScoreRange();
        
        expect(range.MIN).toBe(30);
        expect(range.MAX).toBe(40);
      });

      it('生成されるスコアが範囲内に収まる', () => {
        const range = getFallbackScoreRange();
        const score = range.MIN + Math.floor(Math.random() * (range.MAX - range.MIN + 1));
        
        expect(score).toBeGreaterThanOrEqual(30);
        expect(score).toBeLessThanOrEqual(40);
      });
    });

    describe('本番環境', () => {
      beforeEach(() => {
        mockIsDevelopment.mockReturnValue(false);
      });

      it('本番環境のスコア範囲を返す（85-100）', () => {
        const range = getFallbackScoreRange();
        
        expect(range.MIN).toBe(85);
        expect(range.MAX).toBe(100);
      });

      it('生成されるスコアが範囲内に収まる', () => {
        const range = getFallbackScoreRange();
        const score = range.MIN + Math.floor(Math.random() * (range.MAX - range.MIN + 1));
        
        expect(score).toBeGreaterThanOrEqual(85);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    describe('環境別のスコア生成ロジック', () => {
      it('開発環境と本番環境で異なるスコア範囲を使用する', () => {
        // 開発環境
        mockIsDevelopment.mockReturnValue(true);
        const devRange = getFallbackScoreRange();
        
        // 本番環境
        mockIsDevelopment.mockReturnValue(false);
        const prodRange = getFallbackScoreRange();
        
        // 開発環境は低めのスコア（30-40）
        expect(devRange.MIN).toBeLessThan(prodRange.MIN);
        expect(devRange.MAX).toBeLessThan(prodRange.MAX);
        
        // 本番環境は高めのスコア（85-100）
        expect(prodRange.MIN).toBeGreaterThanOrEqual(85);
      });
    });
  });

  describe('環境変数とフォールバック動作の統合テスト', () => {
    it('本番環境でENABLE_FALLBACK=falseの場合フォールバックが無効', () => {
      mockIsDevelopment.mockReturnValue(false);
      mockGetEnvBoolean.mockReturnValue(false);
      
      expect(isFallbackAllowed()).toBe(false);
      
      // この場合、エラーが即座に検知されることを期待
      // （実際のエラーハンドリングは診断エンジンで実装）
    });

    it('本番環境でENABLE_FALLBACK=trueの場合フォールバックが有効', () => {
      mockIsDevelopment.mockReturnValue(false);
      mockGetEnvBoolean.mockReturnValue(true);
      
      expect(isFallbackAllowed()).toBe(true);
      
      const range = getFallbackScoreRange();
      expect(range.MIN).toBe(85);
      expect(range.MAX).toBe(100);
    });

    it('開発環境でENABLE_FALLBACK=falseでもスコア範囲は開発用', () => {
      mockIsDevelopment.mockReturnValue(true);
      mockGetEnvBoolean.mockReturnValue(false);
      
      expect(isFallbackAllowed()).toBe(false);
      
      const range = getFallbackScoreRange();
      expect(range.MIN).toBe(30);
      expect(range.MAX).toBe(40);
    });
  });
});