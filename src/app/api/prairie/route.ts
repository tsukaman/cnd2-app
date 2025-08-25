import { NextRequest, NextResponse } from 'next/server';
import { PrairieCardParser } from '@/lib/prairie-parser';
import { withErrorHandler, validateRequestBody, withTimeout } from '@/lib/api-middleware';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';
import { z } from 'zod';

// リクエストボディのスキーマ
const prairieRequestSchema = z.object({
  url: z.string().url('有効なURLを指定してください'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // リクエストボディをバリデーション
  const { url } = await validateRequestBody(request, prairieRequestSchema);
  
  // Prairie Cardの取得（10秒タイムアウト）
  const parser = PrairieCardParser.getInstance();
  const profile = await withTimeout(
    parser.parseProfile(url),
    10000
  ).catch((error) => {
    // Check for ApiError timeout first
    if (error instanceof ApiError && error.code === ApiErrorCode.TIMEOUT_ERROR) {
      throw error; // Re-throw the timeout error as-is
    }
    // Check for 404 in error message
    if (error.message?.includes('404')) {
      throw ApiError.notFound('Prairie Card');
    }
    // Other errors are external service errors
    throw ApiError.externalServiceError('Prairie Card', error.message);
  });
  
  return NextResponse.json({
    success: true,
    profile,
    cacheStats: parser.getCacheStats(),
  });
});

// キャッシュクリアのエンドポイント
export const DELETE = withErrorHandler(async (_request: NextRequest) => {
  const parser = PrairieCardParser.getInstance();
  parser.clearCache();
  
  return NextResponse.json({
    success: true,
    message: 'キャッシュをクリアしました',
  });
});