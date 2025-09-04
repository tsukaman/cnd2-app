/**
 * @jest-environment node
 */

// fetch モック
global.fetch = jest.fn();

describe('API Client', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    // 環境変数設定 - モジュールをリロードして環境変数を反映
    jest.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://test-api.example.com';
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    }
  });

  describe('Prairie API', () => {
    describe('fetch', () => {
      it('正しいURLでPOSTリクエストを送信する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const mockResponse = { success: true, data: { name: 'Test User' } };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiClient.prairie.fetch('https://my.prairie.cards/u/testuser');

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-api.example.com/api/prairie',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://my.prairie.cards/u/testuser' }),
          })
        );
        // API client now returns data || result for wrapped responses
        expect(result).toEqual(mockResponse.data);
      });

      it('HTTPエラーの場合、エラーをスローする', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Not found' } }),
        });

        await expect(apiClient.prairie.fetch('https://example.com/error-test'))
          .rejects.toThrow('Not found');
      });

      it('ネットワークエラーの場合、デフォルトエラーメッセージを使用する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => { throw new Error('Parse error'); },
        });

        await expect(apiClient.prairie.fetch('https://example.com/error-test'))
          .rejects.toThrow('Prairie Card の取得に失敗しました');
      });
    });
  });

  describe('Diagnosis API', () => {
    describe('generate', () => {
      const mockProfiles = [
        { basic: { name: 'User1' } },
        { basic: { name: 'User2' } },
      ];

      it('2人診断のリクエストを正しく送信する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const mockResponse = { 
          success: true, 
          data: { 
            result: { 
              id: 'test-123',
              compatibility: 85 
            } 
          } 
        };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiClient.diagnosis.generate(mockProfiles, 'duo');

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-api.example.com/api/diagnosis',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profiles: mockProfiles, mode: 'duo' }),
          })
        );
        // API client now returns data || result for wrapped responses
        expect(result).toEqual(mockResponse.data);
      });

      it('グループ診断のリクエストを正しく送信する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const groupProfiles = [...mockProfiles, { basic: { name: 'User3' } }];
        const mockResponse = { success: true, data: { result: { id: 'group-123' } } };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiClient.diagnosis.generate(groupProfiles, 'group');

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-api.example.com/api/diagnosis',
          expect.objectContaining({
            body: JSON.stringify({ profiles: groupProfiles, mode: 'group' }),
          })
        );
        // API client now returns data || result for wrapped responses
        expect(result).toEqual(mockResponse.data);
      });

      it('デフォルトでduoモードを使用する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const mockResponse = { success: true };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await apiClient.diagnosis.generate(mockProfiles);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"mode":"duo"'),
          })
        );
      });
    });
  });

  describe('Results API', () => {
    describe('get', () => {
      it('結果を取得する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const mockResult = { 
          success: true, 
          data: { 
            result: { id: 'test-123', compatibility: 85 } 
          } 
        };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResult,
        });

        const result = await apiClient.results.get('test-123');

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-api.example.com/api/results?id=test-123',
          expect.objectContaining({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
        );
        // API client now returns data || result for wrapped responses
        expect(result).toEqual(mockResult.data);
      });

      it('404エラーを処理する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Result not found' } }),
        });

        await expect(apiClient.results.get('nonexistent'))
          .rejects.toThrow('Result not found');
      });
    });

    describe('save', () => {
      it('結果を保存する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const mockResult = { id: 'test-123', compatibility: 85 };
        const mockResponse = { success: true, data: { id: 'test-123' } };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiClient.results.save(mockResult);

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-api.example.com/api/results',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockResult),
          })
        );
        // API client now returns data || result for wrapped responses
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('delete', () => {
      it('結果を削除する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
        const mockResponse = { success: true, message: 'Deleted' };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await apiClient.results.delete('test-123');

        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-api.example.com/api/results?id=test-123',
          expect.objectContaining({
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
        );
        // For delete, the response doesn't have a data wrapper
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('URL処理', () => {
    it('先頭のスラッシュを削除する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // スラッシュ付きのパスでも正しいURLになる
      await apiClient.prairie.fetch('test', { enableRetry: false });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/api/prairie',
        expect.any(Object)
      );
    });

    it('API_BASE_URLが未設定の場合相対パスを使用する', async () => {
      // windowオブジェクトをモック（モジュールロード前に設定が必要）
      (global as unknown as { window?: unknown }).window = {};
      
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      
      // windowが定義されている状態でモジュールを再読み込み
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.prairie.fetch('test', { enableRetry: false });
      
      // 相対パスでfetchが呼ばれることを確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prairie',
        expect.any(Object)
      );
      
      // クリーンアップ
      delete (global as unknown as { window?: unknown }).window;
      jest.resetModules();
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(apiClient.prairie.fetch('test', { enableRetry: true }))
        .rejects.toThrow('Network error');
    });

    it('JSONパースエラーを処理する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(apiClient.prairie.fetch('test', { enableRetry: true }))
        .rejects.toThrow('Invalid JSON');
    });

    it('タイムアウトエラーを処理する', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { apiClient } = require('../api-client');
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(apiClient.prairie.fetch('test', { enableRetry: true }))
        .rejects.toThrow('Request timeout');
    });
  });
});