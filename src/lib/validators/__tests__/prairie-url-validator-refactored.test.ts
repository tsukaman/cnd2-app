import { 
  validatePrairieCardUrl, 
  validateMultiplePrairieUrls,
  isPrairieCardUrl 
} from '../prairie-url-validator';

describe('Prairie Card URL Validator (Refactored with describe.each)', () => {
  
  describe('validatePrairieCardUrl', () => {
    
    // 有効なURLのテストケース
    describe.each([
      [
        'basic username',
        'https://my.prairie.cards/u/tsukaman',
        'https://my.prairie.cards/u/tsukaman'
      ],
      [
        'username with dot',
        'https://my.prairie.cards/u/akane.sakaki',
        'https://my.prairie.cards/u/akane.sakaki'
      ],
      [
        'username with multiple dots',
        'https://my.prairie.cards/u/user.name.test',
        'https://my.prairie.cards/u/user.name.test'
      ],
      [
        'username with dots, underscores and hyphens',
        'https://my.prairie.cards/u/user.name_123-test',
        'https://my.prairie.cards/u/user.name_123-test'
      ],
      [
        'card UUID (lowercase)',
        'https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043',
        'https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043'
      ],
      [
        'card UUID (uppercase)',
        'https://my.prairie.cards/cards/20BC9E4A-C2F4-402A-A449-5C59ECA48043',
        'https://my.prairie.cards/cards/20BC9E4A-C2F4-402A-A449-5C59ECA48043'
      ],
      [
        'card UUID (mixed case)',
        'https://my.prairie.cards/cards/20bc9E4a-c2F4-402A-a449-5c59eca48043',
        'https://my.prairie.cards/cards/20bc9E4a-c2F4-402A-a449-5c59eca48043'
      ]
    ])('Valid URLs: %s', (description, url, expectedNormalizedUrl) => {
      it(`should accept ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.normalizedUrl).toBe(expectedNormalizedUrl);
      });
    });

    // 無効なドメインのテストケース
    describe.each([
      ['prairie.cards without my subdomain', 'https://prairie.cards/u/tsukaman', 'my.prairie.cards ドメインのみ対応'],
      ['subdomain.prairie.cards', 'https://subdomain.prairie.cards/u/tsukaman', 'my.prairie.cards ドメインのみ対応'],
      ['example.com', 'https://example.com/user', 'my.prairie.cards ドメインのみ対応'],
      ['prairie-cards.com (fake domain)', 'https://prairie-cards.com/user', 'my.prairie.cards ドメインのみ対応']
    ])('Invalid domains', (description, url, expectedError) => {
      it(`should reject ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });

    // 無効なプロトコルのテストケース
    describe.each([
      ['HTTP protocol', 'http://my.prairie.cards/u/tsukaman', 'HTTPSプロトコルのみ'],
      ['FTP protocol', 'ftp://my.prairie.cards/u/tsukaman', 'HTTPSプロトコルのみ']
    ])('Invalid protocols', (description, url, expectedError) => {
      it(`should reject ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });

    // 無効なポートのテストケース
    describe.each([
      ['port 8080', 'https://my.prairie.cards:8080/u/tsukaman', '標準ポート以外'],
      ['port 3000', 'https://my.prairie.cards:3000/u/tsukaman', '標準ポート以外'],
      ['port 80', 'https://my.prairie.cards:80/u/tsukaman', '標準ポート以外']
    ])('Invalid ports', (description, url, expectedError) => {
      it(`should reject ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });

    // 無効なパスパターンのテストケース
    describe.each([
      ['root path', 'https://my.prairie.cards/', '/u/{username} または /cards/{uuid} の形式'],
      ['profile path', 'https://my.prairie.cards/profile', '/u/{username} または /cards/{uuid} の形式'],
      ['settings path', 'https://my.prairie.cards/settings', '/u/{username} または /cards/{uuid} の形式'],
      ['invalid user path', 'https://my.prairie.cards/user/test', '/u/{username} または /cards/{uuid} の形式'],
      ['invalid card path', 'https://my.prairie.cards/card/123', '/u/{username} または /cards/{uuid} の形式']
    ])('Invalid path patterns', (description, url, expectedError) => {
      it(`should reject ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });

    // セキュリティ関連の無効なケース
    describe.each([
      ['directory traversal with ../', 'https://my.prairie.cards/../admin', 'Prairie Card URLの形式が正しくありません'],
      ['directory traversal with ..\\', 'https://my.prairie.cards/..\\admin', 'Prairie Card URLの形式が正しくありません'],
      ['double slash in path', 'https://my.prairie.cards//user', 'Prairie Card URLの形式が正しくありません'],
      ['javascript: in query', 'https://my.prairie.cards/u/test?redirect=javascript:alert(1)', 'my.prairie.cards ドメインのみ対応'],
      ['data: in query', 'https://my.prairie.cards/u/test?url=data:text/html,<script>alert(1)</script>', 'my.prairie.cards ドメインのみ対応'],
      ['vbscript: in query', 'https://my.prairie.cards/u/test?url=vbscript:alert(1)', 'my.prairie.cards ドメインのみ対応']
    ])('Security violations', (description, url, expectedError) => {
      it(`should reject ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });

    // 特殊な入力のテストケース
    describe.each([
      ['empty string', '', 'URLが指定されていません'],
      ['whitespace only', '   ', '無効なURL形式'],  // whitespaceは無効なURL形式として扱われる
      ['null value', null as unknown as string, 'URLが指定されていません'],
      ['undefined value', undefined as unknown as string, 'URLが指定されていません'],
      ['invalid URL format', 'not-a-url', '無効なURL形式'],
      ['missing protocol', 'my.prairie.cards/u/test', '無効なURL形式'],
      ['protocol only', 'https://', '無効なURL形式']
    ])('Edge cases', (description, url, expectedError) => {
      it(`should handle ${description}`, () => {
        const result = validatePrairieCardUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(expectedError);
      });
    });
  });

  describe('validateMultiplePrairieUrls', () => {
    describe.each([
      [
        'all valid URLs',
        [
          'https://my.prairie.cards/u/user1',
          'https://my.prairie.cards/u/user2',
          'https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043'
        ],
        true,
        []
      ],
      [
        'one invalid URL',
        [
          'https://my.prairie.cards/u/user1',
          'http://my.prairie.cards/u/user2',
          'https://my.prairie.cards/u/user3'
        ],
        false,
        ['HTTPSプロトコルのみ']
      ],
      [
        'multiple invalid URLs',
        [
          'https://prairie.cards/u/user1',
          'http://my.prairie.cards/u/user2',
          'not-a-url'
        ],
        false,
        ['my.prairie.cards ドメインのみ対応', 'HTTPSプロトコルのみ', '無効なURL形式']
      ],
      [
        'empty array',
        [],
        true,
        []
      ],
      [
        'all invalid URLs',
        [
          'https://example.com',
          'ftp://my.prairie.cards/u/test',
          ''
        ],
        false,
        ['my.prairie.cards ドメインのみ対応', 'HTTPSプロトコルのみ', 'URLが指定されていません']
      ]
    ])('Multiple URL validation: %s', (description, urls, expectedAllValid, expectedErrorPatterns) => {
      it(`should correctly validate ${description}`, () => {
        const result = validateMultiplePrairieUrls(urls);
        
        expect(result.allValid).toBe(expectedAllValid);
        expect(result.results).toHaveLength(urls.length);
        expect(result.errors).toHaveLength(expectedErrorPatterns.length);
        
        expectedErrorPatterns.forEach((pattern, index) => {
          expect(result.errors[index]).toContain(pattern);
        });
      });
    });
  });

  describe('isPrairieCardUrl', () => {
    describe.each([
      ['valid Prairie Card URL', 'https://my.prairie.cards/u/test', true],
      ['valid Prairie Card UUID URL', 'https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043', true],
      ['invalid domain', 'https://example.com/u/test', false],
      ['HTTP protocol', 'http://my.prairie.cards/u/test', false],
      ['empty string', '', false],
      ['null value', null as unknown as string, false],
      ['invalid format', 'not-a-url', false],
      ['wrong path pattern', 'https://my.prairie.cards/profile', false]
    ])('isPrairieCardUrl helper', (description, url, expected) => {
      it(`should return ${expected} for ${description}`, () => {
        expect(isPrairieCardUrl(url)).toBe(expected);
      });
    });
  });

  // パフォーマンステスト（CI環境ではスキップ）
  describe('Performance tests', () => {
    const testFn = process.env.CI ? it.skip : it;
    
    testFn.each([
      ['valid URLs', 'https://my.prairie.cards/u/test'],
      ['invalid URLs', 'https://example.com/test']
    ])('should handle rapid validation of %s efficiently', (description, url) => {
      const startTime = Date.now();
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        validatePrairieCardUrl(url);
      }
      
      const duration = Date.now() - startTime;
      
      // 10000回の検証が300ms以内で完了すること（CI環境を考慮）
      expect(duration).toBeLessThan(300);
      
      // 平均時間が0.03ms以下であること（CI環境を考慮）
      const avgTime = duration / iterations;
      expect(avgTime).toBeLessThan(0.03);
    });
  });
});