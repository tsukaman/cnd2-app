// Middleware for Cloudflare Functions
// This runs before all functions in the /functions directory

export async function onRequest(context) {
  const { request, env, next } = context;
  
  // Add security headers to all responses
  const response = await next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Basic CSP for API responses
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'none'; style-src 'none';"
  );
  
  return response;
}