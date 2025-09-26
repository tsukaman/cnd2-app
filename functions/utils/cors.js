/**
 * CORS utility for Cloudflare Workers
 */

// CORS headers for local development
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Handle OPTIONS request for CORS preflight
export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Add CORS headers to a response
export function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Create JSON response with CORS headers
export function jsonResponse(data, options = {}) {
  const { status = 200, headers: customHeaders = {} } = options;
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
      ...corsHeaders
    }
  });
}

// Create error response with CORS headers
export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, { status });
}