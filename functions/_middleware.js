// Middleware for Cloudflare Functions
// This runs before all functions in the /functions directory

export async function onRequest(context) {
  const { request, env, next } = context;
  
  // Add security headers to all responses
  const response = await next();
  
  // Get URL path
  const url = new URL(request.url);
  const isApiRoute = url.pathname.startsWith('/api/');
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Different CSP for API vs regular pages
  if (isApiRoute) {
    // Restrictive CSP for API responses
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none';"
    );
  } else {
    // Full CSP for web pages (matching public/_headers)
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://fonts.googleapis.com; " +
      "font-src 'self' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://fonts.gstatic.com data:; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://api.openai.com https://prairie.cards https://*.prairie.cards https://api.qrserver.com; " +
      "frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
    );
    
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
  }
  
  return response;
}