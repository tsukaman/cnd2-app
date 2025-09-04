import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Get CORS headers based on environment and request origin
 */
function getCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get('origin') || '';
  
  // In development, allow common development origins
  if (process.env.NODE_ENV === 'development') {
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ];
    
    if (devOrigins.includes(origin) || !origin) {
      return {
        'Access-Control-Allow-Origin': origin || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      };
    }
  }
  
  // In production, only allow specific origins
  const prodOrigins = [
    'https://cnd2.cloudnativedays.jp',
    'https://cnd2-app.pages.dev',
  ];
  
  if (prodOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // Default: no CORS headers (will block cross-origin requests)
  return {};
}

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
        { 
          status: 400,
          headers: getCorsHeaders(request)
        }
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
        }, {
          headers: getCorsHeaders(request)
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
        }, {
          headers: getCorsHeaders(request)
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
        }, {
          headers: getCorsHeaders(request)
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
        const errorData = await response.json().catch((parseError) => {
          logger.warn('[Results API] Failed to parse error response:', parseError);
          return { error: 'Unknown error' };
        });
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `Failed to fetch result: ${response.status}` 
          },
          { status: response.status }
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        logger.error('[Results API] Failed to parse response:', parseError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid response from upstream server' 
          },
          { 
            status: 502,
            headers: getCorsHeaders(request)
          }
        );
      }
      return NextResponse.json(data, {
        headers: getCorsHeaders(request)
      });
    }

    // データが見つからない場合
    return NextResponse.json(
      { 
        success: false, 
        error: 'Result not found' 
      },
      { 
        status: 404,
        headers: getCorsHeaders(request)
      }
    );
    
  } catch (error) {
    logger.error('[Results API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { 
        status: 500,
        headers: getCorsHeaders(request)
      }
    );
  }
}

/**
 * POST /api/results
 * 診断結果を保存するAPIエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('[Results API] JSON parse error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body' 
        },
        { 
          status: 400,
          headers: getCorsHeaders(request)
        }
      );
    }
    
    if (!body.id || !body.result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: id and result' 
        },
        { 
          status: 400,
          headers: getCorsHeaders(request)
        }
      );
    }
    
    // Validate result structure
    if (typeof body.result !== 'object' || !body.result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid result format: must be an object' 
        },
        { 
          status: 400,
          headers: getCorsHeaders(request)
        }
      );
    }
    
    // Basic validation of result fields if it's a diagnosis result
    if (body.result.id && body.result.id !== body.id) {
      logger.warn('[Results API] Mismatched IDs:', { bodyId: body.id, resultId: body.result.id });
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
      }, {
        headers: getCorsHeaders(request)
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
        const errorData = await response.json().catch((parseError) => {
          logger.warn('[Results API] Failed to parse error response:', parseError);
          return { error: 'Unknown error' };
        });
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `Failed to save result: ${response.status}` 
          },
          { status: response.status }
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        logger.error('[Results API] Failed to parse response:', parseError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid response from upstream server' 
          },
          { 
            status: 502,
            headers: getCorsHeaders(request)
          }
        );
      }
      return NextResponse.json(data, {
        headers: getCorsHeaders(request)
      });
    }

    return NextResponse.json({
      success: true,
      id: body.id,
      message: 'Result saved successfully'
    }, {
      headers: getCorsHeaders(request)
    });

  } catch (error) {
    logger.error('[Results API] Save error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { 
        status: 500,
        headers: getCorsHeaders(request)
      }
    );
  }
}

/**
 * OPTIONS /api/results
 * CORS プリフライトリクエスト対応
 */
export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request);
  
  // If no CORS headers (unauthorized origin), return 403
  if (Object.keys(headers).length === 0) {
    return new Response('Forbidden', {
      status: 403,
    });
  }
  
  return new Response(null, {
    status: 200,
    headers,
  });
}