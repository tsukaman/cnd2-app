// Results API for Cloudflare Functions
export async function onRequestGet({ params, env }) {
  const { id } = params;
  const corsHeaders = getCorsHeaders();
  
  try {
    // Fetch from KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${id}`;
      const data = await env.DIAGNOSIS_KV.get(key);
      
      if (data) {
        return new Response(data, {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
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

export async function onRequestDelete({ params, env }) {
  const { id } = params;
  const corsHeaders = getCorsHeaders();
  
  try {
    // Delete from KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${id}`;
      await env.DIAGNOSIS_KV.delete(key);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Result deleted' 
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

export async function onRequestOptions() {
  const corsHeaders = getCorsHeaders();
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}