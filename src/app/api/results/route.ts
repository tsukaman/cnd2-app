import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Mock KV storage for development
const mockStorage = new Map<string, unknown>();

/**
 * GET /api/results?id=xxx
 * 診断結果を取得するAPIエンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing result ID' 
        },
        { status: 400 }
      );
    }

    // 開発環境では LocalStorage のデータをエミュレート
    if (process.env.NODE_ENV === 'development') {
      // モックストレージから取得を試みる
      const key = `diagnosis:${id}`;
      const mockData = mockStorage.get(key);
      
      if (mockData) {
        return NextResponse.json({
          success: true,
          result: mockData,
          cache: {
            hit: true,
            source: 'memory'
          }
        });
      }

      // LocalStorage形式のキーも確認（後方互換性）
      const localStorageKey = `diagnosis-result-${id}`;
      const localData = mockStorage.get(localStorageKey);
      
      if (localData) {
        return NextResponse.json({
          success: true,
          result: localData,
          cache: {
            hit: true,
            source: 'localStorage-compat'
          }
        });
      }

      // デモデータを返す（開発環境のみ）
      if (id === 'demo' || id === 'test') {
        return NextResponse.json({
          success: true,
          result: {
            id: id,
            compatibility: 85,
            summary: '素晴らしい相性です！',
            details: 'テスト用のデモデータです。',
            createdAt: new Date().toISOString(),
            profiles: [
              { basic: { name: 'テストユーザー1' } },
              { basic: { name: 'テストユーザー2' } }
            ]
          },
          cache: {
            hit: false,
            source: 'demo'
          }
        });
      }
    }

    // 本番環境ではCloudflare Functionsを呼び出す
    if (process.env.NODE_ENV === 'production') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cnd2.cloudnativedays.jp';
      const response = await fetch(`${baseUrl}/api/results?id=${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `Failed to fetch result: ${response.status}` 
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // データが見つからない場合
    return NextResponse.json(
      { 
        success: false, 
        error: 'Result not found' 
      },
      { status: 404 }
    );
    
  } catch (error) {
    logger.error('[Results API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/results
 * 診断結果を保存するAPIエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id || !body.result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: id and result' 
        },
        { status: 400 }
      );
    }

    // 開発環境ではメモリに保存
    if (process.env.NODE_ENV === 'development') {
      const key = `diagnosis:${body.id}`;
      mockStorage.set(key, body.result);
      
      // LocalStorage形式でも保存（後方互換性）
      const localStorageKey = `diagnosis-result-${body.id}`;
      mockStorage.set(localStorageKey, body.result);

      logger.info(`[Results API] Saved result: ${body.id}`);
      
      return NextResponse.json({
        success: true,
        id: body.id,
        message: 'Result saved successfully'
      });
    }

    // 本番環境ではCloudflare Functionsを呼び出す
    if (process.env.NODE_ENV === 'production') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cnd2.cloudnativedays.jp';
      const response = await fetch(`${baseUrl}/api/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `Failed to save result: ${response.status}` 
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({
      success: true,
      id: body.id,
      message: 'Result saved successfully'
    });

  } catch (error) {
    logger.error('[Results API] Save error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/results
 * CORS プリフライトリクエスト対応
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}