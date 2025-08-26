import { KVStorage } from '@/lib/workers/kv-storage';

// This is a catch-all API route for Cloudflare Workers
// It handles KV storage operations when deployed to Cloudflare

export const runtime = 'edge';

// Define the KV namespace type (will be bound by Cloudflare)
declare global {
  const CND2_RESULTS: KVNamespace;
}

interface Env {
  CND2_RESULTS: KVNamespace;
}

export async function GET(request: Request, env: Env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if KV is available
  if (!env?.CND2_RESULTS) {
    return new Response(JSON.stringify({ 
      error: 'KV namespace not configured' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const kv = new KVStorage(env.CND2_RESULTS);

  // Handle different API endpoints
  if (pathname.startsWith('/api/kv/diagnosis/')) {
    const id = pathname.split('/').pop();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await kv.getDiagnosis(id);
    if (!result) {
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ 
    error: 'Not found' 
  }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request, env: Env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if KV is available
  if (!env?.CND2_RESULTS) {
    return new Response(JSON.stringify({ 
      error: 'KV namespace not configured' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const kv = new KVStorage(env.CND2_RESULTS);

  // Store diagnosis result
  if (pathname === '/api/kv/diagnosis') {
    try {
      const body = await request.json();
      const { id, result } = body;

      if (!id || !result) {
        return new Response(JSON.stringify({ 
          error: 'ID and result required' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await kv.storeDiagnosis(id, result);

      return new Response(JSON.stringify({ 
        success: true, 
        id 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to store diagnosis' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ 
    error: 'Not found' 
  }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}