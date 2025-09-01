// Results API for Cloudflare Functions

// GET handler for query parameter format (/api/results?id=xxx)
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Get ID from query parameter
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing result ID' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Fetch from KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${id}`;
      const data = await env.DIAGNOSIS_KV.get(key);
      
      if (data) {
        try {
          const result = JSON.parse(data);
          
          // データの基本的な検証
          if (!result || typeof result !== 'object') {
            throw new Error('Invalid result format');
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              result,
              cache: {
                hit: true,
                source: 'kv',
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=7200',
                ...corsHeaders,
              },
            }
          );
        } catch (parseError) {
          console.error('Failed to parse KV data:', parseError, { id, dataLength: data?.length });
          // 破損データの場合は404として扱う
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Result data is corrupted' 
            }),
            {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
      }
    }
    
    // Not found
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Result not found' 
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Results GET API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch result' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// POST handler for saving results
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    const result = await request.json();
    
    if (!result || !result.id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid result data' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Store in KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${result.id}`;
      await env.DIAGNOSIS_KV.put(key, JSON.stringify(result), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: result.id,
            message: 'Result stored successfully',
            storage: 'kv'
          }
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // If KV is not available, return error
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Storage not available' 
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Results API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to store result' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function getCorsHeaders(requestOrigin) {
  const allowedOrigins = [
    'https://cnd2-app.pages.dev',
    'https://cnd2.cloudnativedays.jp',
    'http://localhost:3000',
  ];
  
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}