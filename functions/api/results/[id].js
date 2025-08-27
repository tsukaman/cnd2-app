// Results API for Cloudflare Functions
export async function onRequestGet({ params, env, request }) {
  const { id } = params;
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Fetch from KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${id}`;
      const data = await env.DIAGNOSIS_KV.get(key);
      
      if (data) {
        const result = JSON.parse(data);
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              result
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
    console.error('Results API error:', error);
    
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

export async function onRequestDelete({ params, env, request }) {
  const { id } = params;
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Delete from KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${id}`;
      await env.DIAGNOSIS_KV.delete(key);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          message: 'Result deleted successfully'
        }
      }),
      {
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
        error: 'Failed to delete result' 
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
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}