// Middleware for Cloudflare Functions
// This runs before all functions in the /functions directory

const { 
  CSP_STRINGS, 
  PERMISSIONS_POLICY, 
  SECURITY_HEADERS 
} = require('./utils/csp-constants');

export async function onRequest(context) {
  const { request, env, next } = context;
  
  // Add security headers to all responses
  const response = await next();
  
  // Get URL path
  const url = new URL(request.url);
  const isApiRoute = url.pathname.startsWith('/api/');
  
  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  // Different CSP for API vs regular pages
  if (isApiRoute) {
    // Restrictive CSP for API responses
    response.headers.set('Content-Security-Policy', CSP_STRINGS.API);
  } else {
    // Full CSP for web pages (matching public/_headers)
    response.headers.set('Content-Security-Policy', CSP_STRINGS.WEB);
    response.headers.set('Permissions-Policy', PERMISSIONS_POLICY);
  }
  
  return response;
}