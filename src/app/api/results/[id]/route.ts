import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/workers/kv-storage-v2';
import { ApiError } from '@/lib/api-errors';
import { getCorsHeaders } from '@/lib/cors';

export const runtime = 'edge';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    if (!id || typeof id !== 'string') {
      throw ApiError.validation('Invalid result ID');
    }
    
    const storage = new KVStorage();
    const result = await storage.get(id);
    
    if (!result) {
      throw ApiError.notFound('Result');
    }
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Results API error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    if (!id || typeof id !== 'string') {
      throw ApiError.validation('Invalid result ID');
    }
    
    const storage = new KVStorage();
    await storage.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('Results API delete error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete result' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS', // カスタムメソッド
    },
  });
}