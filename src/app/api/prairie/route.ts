import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PrairieCardParser } from '@/lib/prairie-parser';
import { withApiMiddleware, validateRequestBody, createSuccessResponse } from '@/lib/api-middleware';
import { ApiError } from '@/lib/api-errors';

// Request validation schema
const prairieRequestSchema = z.object({
  url: z.string().url('有効なURLを入力してください'),
});

export const POST = withApiMiddleware(async (request: NextRequest) => {
  // Validate request body
  const { url } = await validateRequestBody(request, prairieRequestSchema);
  
  try {
    const parser = PrairieCardParser.getInstance();
    const profile = await parser.parseProfile(url);
    
    if (!profile) {
      throw ApiError.notFound('Prairie Card');
    }
    
    return createSuccessResponse({
      profile,
      cacheStats: parser.getCacheStats(),
    });
  } catch (error) {
    console.error('[Prairie API] Error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Check for network errors
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw ApiError.externalService('Prairie Card', error);
      }
      
      if (error.message.includes('timeout')) {
        throw ApiError.timeout('Prairie Cardの取得がタイムアウトしました');
      }
    }
    
    throw ApiError.internal('Prairie Cardの取得に失敗しました');
  }
});

// Cache clear endpoint
export const DELETE = withApiMiddleware(async (_request: NextRequest) => {
  try {
    const parser = PrairieCardParser.getInstance();
    parser.clearCache();
    
    return createSuccessResponse({
      message: 'キャッシュをクリアしました',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Prairie API] Cache clear error:', error);
    throw ApiError.internal('キャッシュのクリアに失敗しました');
  }
});