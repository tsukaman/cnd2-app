// @ts-check
// Temporary debug endpoint to check environment variables
// IMPORTANT: Remove this file before production deployment!
// TODO: Delete this file after investigation is complete

import { getCorsHeaders, getSecurityHeaders } from '../utils/response.js';

/**
 * Debug endpoint to check environment variables (development only)
 */
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  // Always require authentication header for security
  const debugHeader = request.headers.get('X-Debug-Secret');
  if (debugHeader !== 'cnd2-debug-2025') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Log access attempt for audit
  console.log('[Debug Endpoint] Access attempt from:', request.headers.get('cf-connecting-ip') || 'unknown');
  
  // Check environment variables with error handling
  let envInfo;
  try {
    envInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: env.NODE_ENV || 'undefined',
        ENVIRONMENT: env.ENVIRONMENT || 'undefined',
        DEBUG_MODE: env.DEBUG_MODE || 'undefined',
      },
      apiKeys: {
        OPENAI_API_KEY: {
          exists: !!env.OPENAI_API_KEY,
          isValidFormat: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.startsWith('sk-') : false,
          // Remove sensitive information like length and preview for security
        },
      },
      kvNamespaces: {
        DIAGNOSIS_KV: !!env.DIAGNOSIS_KV,
        RATE_LIMIT_KV: !!env.RATE_LIMIT_KV,
      },
      allEnvKeys: Object.keys(env || {}).filter(key => 
        !/^(.*_)?(SECRET|PASSWORD|KEY|TOKEN|PRIVATE|AUTH|CREDENTIAL)(_.*)?$/i.test(key)
      ),
    };
  } catch (error) {
    console.error('[Debug Endpoint] Error collecting environment info:', error);
    return new Response(JSON.stringify({ error: 'Failed to collect environment information' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  
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