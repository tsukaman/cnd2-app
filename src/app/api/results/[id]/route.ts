import { NextRequest, NextResponse } from 'next/server';
import { ResultStorage } from '@/lib/result-storage';
import { withErrorHandler } from '@/lib/api-middleware';
import { ApiError } from '@/lib/api-errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    
    if (!id) {
      throw ApiError.badRequest('結果IDが指定されていません');
    }
    
    const storage = ResultStorage.getInstance();
    const result = storage.getResult(id);
    
    if (!result) {
      throw ApiError.notFound('診断結果');
    }
    
    return NextResponse.json({
      success: true,
      result,
    });
  })(request);
}