import { 
  validatePrairieCardUrl, 
  validateMultiplePrairieUrls,
  isPrairieCardUrl 
} from '../prairie-url-validator';

describe('Prairie Card URL Validator', () => {
  // Note: These tests only validate URL format, no actual network access is made
  describe('validatePrairieCardUrl', () => {
    describe('有効なURL', () => {
      it('my.prairie.cardsの/u/{username}形式のURLを受け入れる', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/tsukaman');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.normalizedUrl).toBe('https://my.prairie.cards/u/tsukaman');
      });

      it('ドットを含むユーザー名も受け入れる', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/akane.sakaki');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.normalizedUrl).toBe('https://my.prairie.cards/u/akane.sakaki');
      });

      it('my.prairie.cardsの/cards/{uuid}形式のURLを受け入れる', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('無効なURL', () => {
      it('prairie.cardsドメインを拒否する', () => {
        const result = validatePrairieCardUrl('https://prairie.cards/u/tsukaman');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('サブドメインを拒否する', () => {
        const result = validatePrairieCardUrl('https://subdomain.prairie.cards/u/tsukaman');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('不正なパスパターンを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/profile');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('/u/{username} または /cards/{uuid} の形式');
      });

      it('HTTPプロトコルを拒否する', () => {
        const result = validatePrairieCardUrl('http://my.prairie.cards/u/tsukaman');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPSプロトコルのみ');
      });

      it('FTPプロトコルを拒否する', () => {
        const result = validatePrairieCardUrl('ftp://my.prairie.cards/u/tsukaman');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPSプロトコルのみ');
      });

      it('非標準ポートを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards:8080/u/tsukaman');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('標準ポート以外');
      });

      it('無関係なドメインを拒否する', () => {
        const result = validatePrairieCardUrl('https://example.com/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('prairie.cardsに似た偽ドメインを拒否する', () => {
        const result = validatePrairieCardUrl('https://prairie-cards.com/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('ディレクトリトラバーサルを含むパスを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/../admin');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Prairie Card URLの形式が正しくありません');
      });

      it('ダブルスラッシュを含むパスを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards//user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Prairie Card URLの形式が正しくありません');
      });

      it('JavaScriptスキームを含むクエリを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/test?redirect=javascript:alert(1)');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('空文字列を拒否する', () => {
        const result = validatePrairieCardUrl('');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('URLが指定されていません');
      });

      it('nullを拒否する', () => {
        const result = validatePrairieCardUrl(null as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('URLが指定されていません');
      });

      it('不正な形式のURLを拒否する', () => {
        const result = validatePrairieCardUrl('not-a-url');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('無効なURL形式');
      });
    });
  });

  describe('validateMultiplePrairieUrls', () => {
    it('全て有効なURLの場合trueを返す', () => {
      const urls = [
        'https://my.prairie.cards/u/user1',
        'https://my.prairie.cards/u/user2',
        'https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043'
      ];
      
      const result = validateMultiplePrairieUrls(urls);
      expect(result.allValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.results).toHaveLength(3);
    });

    it('一部無効なURLがある場合falseを返す', () => {
      const urls = [
        'https://my.prairie.cards/u/user1',  // 有効
        'http://my.prairie.cards/u/user2',   // HTTPは無効
        'https://example.com/user3'          // 無関係なドメイン
      ];
      
      const result = validateMultiplePrairieUrls(urls);
      expect(result.allValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('HTTPSプロトコルのみ');
      expect(result.errors[1]).toContain('my.prairie.cards ドメインのみ対応');
    });
  });

  describe('isPrairieCardUrl', () => {
    it('有効なPrairie Card URLに対してtrueを返す', () => {
      expect(isPrairieCardUrl('https://my.prairie.cards/u/user')).toBe(true);
      expect(isPrairieCardUrl('https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043')).toBe(true);
    });

    it('無効なURLに対してfalseを返す', () => {
      expect(isPrairieCardUrl('https://prairie.cards/u/user')).toBe(false);
      expect(isPrairieCardUrl('http://my.prairie.cards/u/user')).toBe(false);
      expect(isPrairieCardUrl('https://example.com/user')).toBe(false);
      expect(isPrairieCardUrl('not-a-url')).toBe(false);
    });

    it('例外が発生してもクラッシュしない', () => {
      expect(isPrairieCardUrl(null as unknown as string)).toBe(false);
      expect(isPrairieCardUrl(undefined as unknown as string)).toBe(false);
    });
  });
});