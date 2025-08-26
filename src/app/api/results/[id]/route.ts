import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/workers/kv-storage-v2';

// Edge Runtimeを使用
export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storage = new KVStorage();
    const result = await storage.get(params.id);
    
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Result not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Results API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve result',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storage = new KVStorage();
    await storage.delete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('[Results API] Delete error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete result',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}