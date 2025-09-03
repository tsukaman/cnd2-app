/**
 * API Client Edge Cases Test
 * @jest-environment node
 */

// fetch モック
global.fetch = jest.fn();

describe('API Client Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('パス正規化の境界値テスト', () => {
    it('二重スラッシュを正しく処理する', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://test.com';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.prairie.fetch('test');
      
      // 正しいURLが構築されることを確認
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.com/api/prairie',
        expect.any(Object)
      );
    });

    it('空のAPI_BASE_URLで相対パスを使用する', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = '';
      // windowオブジェクトをモック
      (global as unknown as { window?: unknown }).window = {};
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.prairie.fetch('test');
      
      // 相対パスが使用されることを確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prairie',
        expect.any(Object)
      );
      
      // クリーンアップ
      delete (global as unknown as { window?: unknown }).window;
    });

    it('末尾スラッシュがあるAPI_BASE_URLを正しく処理する', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://test.com/';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.prairie.fetch('test');
      
      // 二重スラッシュにならないことを確認
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.com/api/prairie', // 末尾スラッシュが正規化される
        expect.any(Object)
      );
    });
  });

  describe('環境判定のテスト', () => {
    it('サーバーサイドでエラーをスローする', async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      // windowが存在しない環境をシミュレート
      delete (global as unknown as { window?: unknown }).window;
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      // SSR環境でのエラー
      await expect(apiClient.prairie.fetch('test'))
        .rejects.toThrow('API_BASE_URL is not configured for server-side rendering');
    });

    it('異なるAPI_BASE_URL形式を正しく処理する', async () => {
      const testCases = [
        { baseUrl: 'https://test.com', expectedUrl: 'https://test.com/api/prairie' },
        { baseUrl: 'https://test.com/', expectedUrl: 'https://test.com/api/prairie' },
        { baseUrl: 'https://api.example.com/v1', expectedUrl: 'https://api.example.com/v1/api/prairie' },
        { baseUrl: 'https://api.example.com/v1/', expectedUrl: 'https://api.example.com/v1/api/prairie' },
      ];

      for (const { baseUrl, expectedUrl } of testCases) {
        jest.clearAllMocks();
        jest.resetModules();
        
        process.env.NEXT_PUBLIC_API_BASE_URL = baseUrl;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await apiClient.prairie.fetch('test');
        
        expect(global.fetch).toHaveBeenCalledWith(
          expectedUrl,
          expect.any(Object)
        );
      }
    });
  });

  describe('異なるドメインでの動作', () => {
    it('プレビュー環境で相対パスが動作する', async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      (global as unknown as { window: unknown }).window = { 
        location: { 
          origin: 'https://preview-123.cnd2-app.pages.dev' 
        } 
      };
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.prairie.fetch('test');
      
      // 相対パスでfetchが呼ばれる
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prairie',
        expect.any(Object)
      );
      
      // クリーンアップ
      delete (global as unknown as { window?: unknown }).window;
    });

    it('本番ドメインで相対パスが動作する', async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      (global as unknown as { window: unknown }).window = { 
        location: { 
          origin: 'https://cnd2.cloudnativedays.jp' 
        } 
      };
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.prairie.fetch('test');
      
      // 相対パスでfetchが呼ばれる
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prairie',
        expect.any(Object)
      );
      
      // クリーンアップ  
      delete (global as unknown as { window?: unknown }).window;
    });
  });
});