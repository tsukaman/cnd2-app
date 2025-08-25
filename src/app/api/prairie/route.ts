import { NextRequest, NextResponse } from 'next/server';
import { PrairieCardParser } from '@/lib/prairie-parser';
import { withErrorHandler, validateRequestBody, withTimeout } from '@/lib/api-middleware';
import { ApiError } from '@/lib/api-errors';
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
    if (error.message.includes('404')) {
      throw ApiError.notFound('Prairie Card');
    }
    if (error.message.includes('timeout')) {
      throw ApiError.timeoutError('Prairie Cardの取得がタイムアウトしました');
    }
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