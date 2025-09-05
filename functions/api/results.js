// Results API for Cloudflare Functions
import { getCorsHeaders } from '../utils/response.js';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '../utils/error-messages.js';

// GET handler for query parameter format (/api/results?id=xxx)
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Get ID from query parameter
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      const errorResp = createErrorResponse(ERROR_CODES.RESULT_INVALID_ID);
      return new Response(
        JSON.stringify(errorResp),
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
          
          const successResp = createSuccessResponse({
            result,
            cache: {
              hit: true,
              source: 'kv',
            },
          });
          return new Response(
            JSON.stringify(successResp),
            {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=7200',
                ...corsHeaders,
              },
            }
          );
        } catch (parseError) {
          console.error('Failed to parse KV data:', parseError, { 
            id, 
            dataLength: data?.length, 
            dataPreview: data?.substring(0, 100) 
          });
          // 破損データの場合は404として扱う
          const errorResp = createErrorResponse(ERROR_CODES.RESULT_NOT_FOUND, 'Result data is corrupted');
          return new Response(
            JSON.stringify(errorResp),
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
    const notFoundResp = createErrorResponse(ERROR_CODES.RESULT_NOT_FOUND);
    return new Response(
      JSON.stringify(notFoundResp),
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
    
    const errorResp = createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch result');
    return new Response(
      JSON.stringify(errorResp),
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
    
    if (!result || typeof result !== 'object' || !result.id || !result.result) {
      const errorResp = createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid result data');
      return new Response(
        JSON.stringify(errorResp),
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
      
      const successResp = createSuccessResponse({
        id: result.id,
        message: 'Result stored successfully',
        storage: 'kv'
      });
      return new Response(
        JSON.stringify(successResp),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // If KV is not available, return error
    const kvErrorResp = createErrorResponse(ERROR_CODES.STORAGE_KV_UNAVAILABLE);
    return new Response(
      JSON.stringify(kvErrorResp),
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
    
    const errorResp = createErrorResponse(ERROR_CODES.STORAGE_SAVE_FAILED, 'Failed to store result');
    return new Response(
      JSON.stringify(errorResp),
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
  
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}