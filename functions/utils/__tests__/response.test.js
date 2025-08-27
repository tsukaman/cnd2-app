import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../response.js';

describe('Response Utilities', () => {
  describe('errorResponse', () => {
    it('should create error response with default status code', () => {
      const response = errorResponse(new Error('Test error'));
      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should create error response with custom status code', () => {
      const response = errorResponse(new Error('Not found'), 404);
      expect(response.status).toBe(404);
    });

    it('should map common errors to user-friendly messages', async () => {
      const networkError = errorResponse(new Error('Failed to fetch'));
      const body = await networkError.json();
      expect(body.error.code).toBe('NETWORK_ERROR');
      expect(body.error.message).toContain('ネットワーク');
    });

    it('should handle Prairie Card specific errors', async () => {
      const prairieError = errorResponse(new Error('Invalid Prairie Card URL'));
      const body = await prairieError.json();
      expect(body.error.code).toBe('INVALID_PRAIRIE_URL');
    });

    it('should include timestamp in error response', async () => {
      const response = errorResponse(new Error('Test'));
      const body = await response.json();
      expect(body.error.timestamp).toBeDefined();
      expect(new Date(body.error.timestamp)).toBeInstanceOf(Date);
    });

    it('should include CORS headers when provided', () => {
      const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
      const response = errorResponse(new Error('Test'), 500, corsHeaders);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('successResponse', () => {
    it('should create success response with data', async () => {
      const data = { id: '123', result: 'test' };
      const response = successResponse(data);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.timestamp).toBeDefined();
    });

    it('should include CORS headers when provided', () => {
      const corsHeaders = { 'Access-Control-Allow-Origin': 'https://example.com' };
      const response = successResponse({}, corsHeaders);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    });
  });

  describe('getCorsHeaders', () => {
    it('should return headers for allowed origins', () => {
      const headers = getCorsHeaders('https://cnd2-app.pages.dev');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://cnd2-app.pages.dev');
    });

    it('should return first allowed origin for unknown origins', () => {
      const headers = getCorsHeaders('https://unknown.com');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://cnd2-app.pages.dev');
    });

    it('should return null for undefined origin', () => {
      const headers = getCorsHeaders(undefined);
      expect(headers['Access-Control-Allow-Origin']).toBe('https://cnd2-app.pages.dev');
    });

    it('should include all necessary CORS headers', () => {
      const headers = getCorsHeaders('http://localhost:3000');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, DELETE, OPTIONS');
      expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });
  });

  describe('getSecurityHeaders', () => {
    it('should include all security headers', () => {
      const headers = getSecurityHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Content-Security-Policy']).toBeDefined();
    });

    it('should have valid CSP policy', () => {
      const headers = getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });
  });
});