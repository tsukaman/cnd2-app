import { GET } from '../[id]/route';
import { NextRequest } from 'next/server';

// KVストレージのモック
const mockKVGet = jest.fn();
(globalThis as any).DIAGNOSIS_KV = {
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
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    });
    // KVモックをリセット
    mockKVGet.mockReset();
    (globalThis as any).DIAGNOSIS_KV = {
      get: mockKVGet,
      put: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      getWithMetadata: jest.fn(),
    } as any;
  });

  describe('GET /api/results/[id]', () => {
    it('開発環境でモック結果を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/results/test-id');
      const params = Promise.resolve({ id: 'test-id' });

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
      const params = Promise.resolve({ id: '' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('結果IDが指定されていません');
    });

    describe('本番環境', () => {
      beforeEach(() => {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'production',
          writable: true,
          configurable: true
        });
      });

      it('KVから結果を取得して返す（レート制限内）', async () => {
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

        // レート制限チェックと結果取得
        mockKVGet
          .mockResolvedValueOnce(null) // レート制限チェック（カウントなし）
          .mockResolvedValueOnce(mockResult); // 実際の結果

        const request = new NextRequest('http://localhost:3000/api/results/prod-test-id');
        const params = Promise.resolve({ id: 'prod-test-id' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.result).toEqual(mockResult);
        // キャッシュヘッダーの確認
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=7200');
      });

      it('レート制限を超えた場合429を返す', async () => {
        // レート制限を超過
        mockKVGet.mockResolvedValueOnce('30'); // 制限値に達している

        const request = new NextRequest('http://localhost:3000/api/results/rate-limit-test');
        const params = Promise.resolve({ id: 'rate-limit-test' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.success).toBe(false);
        expect(data.error).toContain('リクエスト数が制限を超えています');
      });

      it('KVに結果が存在しない場合404を返す', async () => {
        mockKVGet
          .mockResolvedValueOnce(null) // レート制限チェック
          .mockResolvedValueOnce(null); // 結果が存在しない

        const request = new NextRequest('http://localhost:3000/api/results/not-found');
        const params = Promise.resolve({ id: 'not-found' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('診断結果が見つかりません');
      });

      it('KVエラー時に500を返す', async () => {
        mockKVGet
          .mockResolvedValueOnce(null) // レート制限チェック成功
          .mockRejectedValueOnce(new Error('KV storage error')); // 結果取得でエラー

        const request = new NextRequest('http://localhost:3000/api/results/error-id');
        const params = Promise.resolve({ id: 'error-id' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('診断結果の取得中にエラーが発生しました');
      });
    });

    describe('KVが利用できない本番環境', () => {
      beforeEach(() => {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'production',
          writable: true,
          configurable: true
        });
        delete (globalThis as any).DIAGNOSIS_KV;
      });

      afterEach(() => {
        // テスト後にKVモックを復元
        (globalThis as any).DIAGNOSIS_KV = {
          get: mockKVGet,
          put: jest.fn(),
          delete: jest.fn(),
          list: jest.fn(),
          getWithMetadata: jest.fn(),
        } as any;
      });

      it('503エラーを返す', async () => {
        const request = new NextRequest('http://localhost:3000/api/results/test-id');
        const params = Promise.resolve({ id: 'test-id' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toBe('診断結果の取得機能は本番環境でのみ利用可能です');
      });
    });
  });
});