import { NextRequest, NextResponse } from 'next/server';
import { ApiError, createErrorResponse } from './api-errors';
import { z } from 'zod';

/**
 * APIハンドラーの型定義
 */
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context?: T
) => Promise<NextResponse>;

/**
 * エラーハンドリングラッパー
 */
export function withErrorHandler<T = unknown>(
  handler: ApiHandler<T>
): ApiHandler<T> {
  return async (request: NextRequest, context?: T) => {
    try {
      // リクエストIDを生成（トレーシング用）
      const requestId = crypto.randomUUID();
      
      // ハンドラーを実行
      const response = await handler(request, context);
      
      // レスポンスヘッダーにリクエストIDを追加
      response.headers.set('X-Request-Id', requestId);
      
      return response;
    } catch (error) {
      console.error('[API Error]', error);
      
      // ApiErrorの場合
      if (error instanceof ApiError) {
        const errorResponse = createErrorResponse(error);
        return NextResponse.json(errorResponse, { 
          status: error.statusCode 
        });
      }
      
      // Zodバリデーションエラーの場合
      if (error instanceof z.ZodError) {
        const apiError = ApiError.validationError(
          'リクエストの検証に失敗しました',
          error.errors
        );
        const errorResponse = createErrorResponse(apiError);
        return NextResponse.json(errorResponse, { 
          status: 422 
        });
      }
      
      // その他のエラー
      const apiError = ApiError.internalServerError();
      const errorResponse = createErrorResponse(apiError);
      return NextResponse.json(errorResponse, { 
        status: 500 
      });
    }
  };
}

/**
 * リクエストボディのバリデーション
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw ApiError.badRequest('無効なJSONフォーマットです');
    }
    throw error;
  }
}

/**
 * クエリパラメータのバリデーション
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return schema.parse(params);
}

/**
 * メソッドの検証
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw ApiError.methodNotAllowed(request.method);
  }
}

/**
 * CORS設定を追加
 */
export function withCors(
  response: NextResponse,
  options: {
    origin?: string;
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  } = {}
): NextResponse {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = false,
  } = options;
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
  
  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

/**
 * タイムアウト処理
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(ApiError.timeoutError()),
        timeoutMs
      )
    ),
  ]);
}