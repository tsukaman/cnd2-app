// Results POST API for Cloudflare Functions
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}