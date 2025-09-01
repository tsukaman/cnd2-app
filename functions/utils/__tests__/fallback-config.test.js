/**
 * Cloudflare Functions用フォールバック設定のテスト
 */

const { FALLBACK_CONFIG, isFallbackAllowed } = require('../fallback-config');

describe('Cloudflare Functions フォールバック設定', () => {
  describe('FALLBACK_CONFIG', () => {
    it('開発環境のフォールバック設定が正しい', () => {
      expect(FALLBACK_CONFIG.ALLOW_IN_DEVELOPMENT).toBe(false);
      expect(FALLBACK_CONFIG.DEVELOPMENT_SCORE.MIN).toBe(30);
      expect(FALLBACK_CONFIG.DEVELOPMENT_SCORE.MAX).toBe(40);
      expect(FALLBACK_CONFIG.DEVELOPMENT_SCORE.RANGE).toBe(10);
    });

    it('本番環境のフォールバック設定が正しい', () => {
      expect(FALLBACK_CONFIG.ALLOW_IN_PRODUCTION).toBe(false);
      expect(FALLBACK_CONFIG.PRODUCTION_SCORE.MIN).toBe(85);
      expect(FALLBACK_CONFIG.PRODUCTION_SCORE.MAX).toBe(100);
      expect(FALLBACK_CONFIG.PRODUCTION_SCORE.RANGE).toBe(15);
    });

    it('フォールバック識別子プレフィックスが正しい', () => {
      expect(FALLBACK_CONFIG.ID_PREFIX).toBe('fallback-');
    });
  });

  describe('isFallbackAllowed', () => {
    it('ENABLE_FALLBACK=trueの場合trueを返す', () => {
      const env = { ENABLE_FALLBACK: 'true' };
      expect(isFallbackAllowed(env)).toBe(true);
    });

    it('ENABLE_FALLBACK=falseの場合falseを返す', () => {
      const env = { ENABLE_FALLBACK: 'false' };
      expect(isFallbackAllowed(env)).toBe(false);
    });

    it('ENABLE_FALLBACKが未設定の場合falseを返す', () => {
      const env = {};
      expect(isFallbackAllowed(env)).toBe(false);
    });

    it('envがnullの場合falseを返す', () => {
      expect(isFallbackAllowed(null)).toBe(false);
    });

    it('envがundefinedの場合falseを返す', () => {
      expect(isFallbackAllowed(undefined)).toBe(false);
    });

    it('大文字小文字を区別する（"True"はfalse）', () => {
      const env = { ENABLE_FALLBACK: 'True' };
      expect(isFallbackAllowed(env)).toBe(false);
    });
  });

  describe('環境別スコア生成の検証', () => {
    it('開発環境のスコアが正しい範囲内で生成される', () => {
      const { MIN, MAX, RANGE } = FALLBACK_CONFIG.DEVELOPMENT_SCORE;
      const score = MIN + Math.floor(Math.random() * RANGE);
      
      expect(score).toBeGreaterThanOrEqual(MIN);
      expect(score).toBeLessThan(MAX);
    });

    it('本番環境のスコアが正しい範囲内で生成される', () => {
      const { MIN, MAX, RANGE } = FALLBACK_CONFIG.PRODUCTION_SCORE;
      const score = MIN + Math.floor(Math.random() * RANGE);
      
      expect(score).toBeGreaterThanOrEqual(MIN);
      expect(score).toBeLessThan(MAX);
    });

    it('開発環境と本番環境でスコア範囲が異なる', () => {
      const devScore = FALLBACK_CONFIG.DEVELOPMENT_SCORE;
      const prodScore = FALLBACK_CONFIG.PRODUCTION_SCORE;
      
      // 本番環境の方が高いスコア
      expect(prodScore.MIN).toBeGreaterThan(devScore.MAX);
      
      // 開発環境は低めの視認性のあるスコア
      expect(devScore.MIN).toBe(30);
      expect(devScore.MAX).toBe(40);
      
      // 本番環境は高めのポジティブなスコア
      expect(prodScore.MIN).toBe(85);
      expect(prodScore.MAX).toBe(100);
    });
  });

  describe('エラーハンドリングのテスト', () => {
    it('環境変数の値が不正でも安全にfalseを返す', () => {
      const testCases = [
        { ENABLE_FALLBACK: '' },
        { ENABLE_FALLBACK: '1' },
        { ENABLE_FALLBACK: '0' },
        { ENABLE_FALLBACK: 'yes' },
        { ENABLE_FALLBACK: 'no' },
        { ENABLE_FALLBACK: null },
        { ENABLE_FALLBACK: undefined },
        { ENABLE_FALLBACK: 123 },
        { ENABLE_FALLBACK: {} },
        { ENABLE_FALLBACK: [] }
      ];

      testCases.forEach((env) => {
        const result = isFallbackAllowed(env);
        expect(result).toBe(env.ENABLE_FALLBACK === 'true');
      });
    });
  });
});