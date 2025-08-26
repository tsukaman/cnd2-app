import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/workers/kv-storage-v2';
import { ApiError } from '@/lib/api-errors';

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}