import { NextRequest, NextResponse } from 'next/server';
import { KVStorage } from '@/lib/workers/kv-storage';

// This route is for Cloudflare Workers KV operations
export const runtime = 'edge';

// Type-safe context interface for Cloudflare Workers
interface CloudflareContext {
  env?: {
    CND2_RESULTS?: KVNamespace;
  };
  waitUntil?: (promise: Promise<any>) => void;
}

/**
 * Helper to get KV storage instance with proper type safety
 */
function getKVStorage(context?: CloudflareContext): KVStorage | null {
  const kvNamespace = context?.env?.CND2_RESULTS;
  if (!kvNamespace) {
    return null;
  }
  return new KVStorage(kvNamespace as any);
}

/**
 * GET /api/kv/diagnosis/[id] - Retrieve diagnosis result
 */
export async function GET(
  request: NextRequest,
  { params, ...context }: { params: { path?: string[] } } & CloudflareContext
) {
  const kv = getKVStorage(context);
  
  if (!kv) {
    return NextResponse.json(
      { error: 'KV namespace not configured' },
      { status: 503 }
    );
  }

  const path = params.path || [];
  
  // Handle diagnosis retrieval
  if (path[0] === 'diagnosis' && path[1]) {
    const id = path[1];
    
    try {
      const result = await kv.getDiagnosis(id);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Diagnosis not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('[KV] Failed to retrieve diagnosis:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve diagnosis' },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Invalid endpoint' },
    { status: 404 }
  );
}

/**
 * POST /api/kv/diagnosis - Store diagnosis result
 */
export async function POST(
  request: NextRequest,
  context: CloudflareContext
) {
  const kv = getKVStorage(context);
  
  if (!kv) {
    return NextResponse.json(
      { error: 'KV namespace not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { id, result } = body;

    if (!id || !result) {
      return NextResponse.json(
        { error: 'ID and result are required' },
        { status: 400 }
      );
    }

    await kv.storeDiagnosis(id, result);

    return NextResponse.json({ 
      success: true, 
      id 
    });
  } catch (error) {
    console.error('[KV] Failed to store diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to store diagnosis' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kv/diagnosis/[id] - Delete diagnosis result
 */
export async function DELETE(
  request: NextRequest,
  { params, ...context }: { params: { path?: string[] } } & CloudflareContext
) {
  const kv = getKVStorage(context);
  
  if (!kv) {
    return NextResponse.json(
      { error: 'KV namespace not configured' },
      { status: 503 }
    );
  }

  const path = params.path || [];
  
  if (path[0] === 'diagnosis' && path[1]) {
    const id = path[1];
    
    try {
      await kv.deleteDiagnosis(id);
      return NextResponse.json({ 
        success: true,
        message: `Diagnosis ${id} deleted`
      });
    } catch (error) {
      console.error('[KV] Failed to delete diagnosis:', error);
      return NextResponse.json(
        { error: 'Failed to delete diagnosis' },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Invalid endpoint' },
    { status: 404 }
  );
}