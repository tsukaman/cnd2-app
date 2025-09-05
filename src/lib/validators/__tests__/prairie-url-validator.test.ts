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

      it('複数ドットを含むユーザー名を受け入れる', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/user.name.test');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.normalizedUrl).toBe('https://my.prairie.cards/u/user.name.test');
      });

      it('ドット、アンダースコア、ハイフンの組み合わせを受け入れる', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/user.name_123-test');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.normalizedUrl).toBe('https://my.prairie.cards/u/user.name_123-test');
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

  describe('セキュリティ関連のエッジケース（サーバーアクセスなし）', () => {
    describe('危険なプロトコルのブロック', () => {
      it('javascript: プロトコルを拒否する', () => {
        const result = validatePrairieCardUrl('javascript:alert(1)');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPSプロトコルのみ対応');
      });

      it('data: プロトコルを拒否する', () => {
        const result = validatePrairieCardUrl('data:text/html,<script>alert(1)</script>');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPSプロトコルのみ対応');
      });

      it('vbscript: プロトコルを拒否する', () => {
        const result = validatePrairieCardUrl('vbscript:msgbox("test")');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPSプロトコルのみ対応');
      });

      it('file: プロトコルを拒否する', () => {
        const result = validatePrairieCardUrl('file:///etc/passwd');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPSプロトコルのみ対応');
      });
    });

    describe('パストラバーサル攻撃の防止', () => {
      it('../を含むURLを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/../../../admin');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Prairie Card URLの形式が正しくありません');
      });

      it('..\\を含むURLを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/..\\..\\admin');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Prairie Card URLの形式が正しくありません');
      });

      it('ダブルスラッシュ//を含むパスを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards//u//user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Prairie Card URLの形式が正しくありません');
      });
    });

    describe('ポート番号の検証', () => {
      it('非標準ポート8080を拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards:8080/u/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('標準ポート以外は許可されていません');
      });

      it('ポート3000を拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards:3000/u/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('標準ポート以外は許可されていません');
      });

      it('明示的なポート443は受け入れる', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards:443/u/user');
        expect(result.isValid).toBe(true);
      });
    });

    describe('クエリパラメータのサニタイゼーション', () => {
      it('クエリパラメータにjavascript:を含む場合拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/user?redirect=javascript:alert(1)');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('クエリパラメータにdata:を含む場合拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/user?image=data:text/html,<script>alert(1)</script>');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('通常のクエリパラメータは許可する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/user?theme=dark&lang=ja');
        expect(result.isValid).toBe(true);
      });
    });

    describe('URL長さとエンコーディング', () => {
      it('極端に長いユーザー名を持つURLも現在は許可される', () => {
        // Note: 現在の実装では長さ制限はない
        const longUsername = 'a'.repeat(500);
        const result = validatePrairieCardUrl(`https://my.prairie.cards/u/${longUsername}`);
        expect(result.isValid).toBe(true);
      });

      it('URLエンコードされた危険な文字を検出する', () => {
        // %2E%2E%2F = ../
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/%2E%2E%2F%2E%2E%2Fadmin');
        expect(result.isValid).toBe(false);
      });

      it('URLエンコードされたユーザー名は現在の正規表現では拒否される', () => {
        // 日本語ユーザー名のエンコード例
        // Note: 現在の実装では%文字が正規表現にマッチしない
        const result = validatePrairieCardUrl('https://my.prairie.cards/u/%E7%94%B0%E4%B8%AD');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Prairie Card URLの形式が正しくありません');
      });
    });

    describe('ドメイン偽装の防止', () => {
      it('サブドメイン付きの偽装ドメインを拒否する', () => {
        const result = validatePrairieCardUrl('https://my.prairie.cards.evil.com/u/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('類似ドメインを拒否する', () => {
        const result = validatePrairieCardUrl('https://my-prairie-cards.com/u/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('IPアドレスを拒否する', () => {
        const result = validatePrairieCardUrl('https://192.168.1.1/u/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });

      it('localhost を拒否する', () => {
        const result = validatePrairieCardUrl('https://localhost/u/user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('my.prairie.cards ドメインのみ対応');
      });
    });
  });
});