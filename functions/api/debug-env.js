// @ts-check
// Temporary debug endpoint to check environment variables
// IMPORTANT: Remove this file before production deployment!

import { getCorsHeaders, getSecurityHeaders } from '../utils/response.js';

/**
 * Debug endpoint to check environment variables (development only)
 */
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  // Only allow in development or with special header
  const debugHeader = request.headers.get('X-Debug-Secret');
  if (debugHeader !== 'cnd2-debug-2025' && env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Check environment variables
  const envInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: env.NODE_ENV || 'undefined',
      ENVIRONMENT: env.ENVIRONMENT || 'undefined',
      DEBUG_MODE: env.DEBUG_MODE || 'undefined',
    },
    apiKeys: {
      OPENAI_API_KEY: {
        exists: !!env.OPENAI_API_KEY,
        startsWithSk: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.startsWith('sk-') : false,
        length: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.length : 0,
        // Only show first 10 chars for security
        preview: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set',
      },
    },
    kvNamespaces: {
      DIAGNOSIS_KV: !!env.DIAGNOSIS_KV,
      RATE_LIMIT_KV: !!env.RATE_LIMIT_KV,
    },
    allEnvKeys: Object.keys(env || {}).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('PASSWORD') && 
      !key.includes('KEY') && 
      !key.includes('TOKEN')
    ),
  };
  
  return new Response(JSON.stringify(envInfo, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}