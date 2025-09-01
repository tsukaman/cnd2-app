import { GET } from '../[id]/route';
import { NextRequest } from 'next/server';

// KVストレージのモック
const mockKVGet = jest.fn();
global.DIAGNOSIS_KV = {
  get: mockKVGet,
  put: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  getWithMetadata: jest.fn(),
} as any;

describe('Results API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトは開発環境
    process.env.NODE_ENV = 'development';
  });

  describe('GET /api/results/[id]', () => {
    it('開発環境でモック結果を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/results/test-id');
      const params = { id: 'test-id' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.result).toBeDefined();
      expect(data.data.result.id).toBe('test-id');
      expect(data.data.result.mode).toBe('duo');
      expect(data.data.result.compatibility).toBe(92);
    });

    it('IDが指定されていない場合エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/results/');
      const params = { id: '' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('結果IDが指定されていません');
    });

    describe('本番環境', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('KVから結果を取得して返す', async () => {
        const mockResult = {
          id: 'prod-test-id',
          mode: 'duo',
          type: 'クラウドネイティブ達人',
          compatibility: 95,
          summary: 'KVから取得した結果',
          strengths: ['強み1'],
          opportunities: ['機会1'],
          advice: 'アドバイス',
          participants: [],
          createdAt: new Date().toISOString(),
        };

        mockKVGet.mockResolvedValueOnce(mockResult);

        const request = new NextRequest('http://localhost:3000/api/results/prod-test-id');
        const params = { id: 'prod-test-id' };

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.result).toEqual(mockResult);
        expect(mockKVGet).toHaveBeenCalledWith('prod-test-id', 'json');
      });

      it('KVに結果が存在しない場合404を返す', async () => {
        mockKVGet.mockResolvedValueOnce(null);

        const request = new NextRequest('http://localhost:3000/api/results/not-found');
        const params = { id: 'not-found' };

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('診断結果が見つかりません');
      });

      it('KVエラー時に500を返す', async () => {
        mockKVGet.mockRejectedValueOnce(new Error('KV storage error'));

        const request = new NextRequest('http://localhost:3000/api/results/error-id');
        const params = { id: 'error-id' };

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('診断結果の取得中にエラーが発生しました');
      });
    });

    describe('KVが利用できない本番環境', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        delete (global as any).DIAGNOSIS_KV;
      });

      afterEach(() => {
        // テスト後にKVモックを復元
        global.DIAGNOSIS_KV = {
          get: mockKVGet,
          put: jest.fn(),
          delete: jest.fn(),
          list: jest.fn(),
          getWithMetadata: jest.fn(),
        } as any;
      });

      it('503エラーを返す', async () => {
        const request = new NextRequest('http://localhost:3000/api/results/test-id');
        const params = { id: 'test-id' };

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toBe('診断結果の取得機能は本番環境でのみ利用可能です');
      });
    });
  });
});