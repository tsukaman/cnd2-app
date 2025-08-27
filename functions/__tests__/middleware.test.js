/**
 * Cloudflare Functions Middleware Tests
 * Tests for security headers and CSP configuration
 */

describe('Cloudflare Functions Middleware', () => {
  let middleware;
  
  beforeEach(() => {
    // Clear module cache
    jest.resetModules();
    // Mock the CSP constants module
    jest.mock('../utils/csp-constants', () => ({
      CSP_STRINGS: {
        API: "default-src 'none'; frame-ancestors 'none';",
        WEB: "default-src 'self' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://fonts.googleapis.com; font-src 'self' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://cnd2-app.pages.dev https://cnd2.cloudnativedays.jp https://api.openai.com https://prairie.cards https://*.prairie.cards https://api.qrserver.com; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
      },
      PERMISSIONS_POLICY: 'camera=(), microphone=(), geolocation=(), payment=()',
      SECURITY_HEADERS: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    }));
    // Import middleware
    middleware = require('../_middleware');
  });

  describe('Security Headers', () => {
    it('should add security headers to all responses', async () => {
      const mockRequest = {
        url: 'https://example.com/some-page',
      };
      
      const mockResponse = {
        headers: new Map(),
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check security headers
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('CSP Headers', () => {
    it('should set restrictive CSP for API routes', async () => {
      const mockRequest = {
        url: 'https://example.com/api/prairie',
      };
      
      const mockResponse = {
        headers: new Map(),
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check CSP for API routes
      const csp = result.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should set full CSP for regular pages', async () => {
      const mockRequest = {
        url: 'https://example.com/duo',
      };
      
      const mockResponse = {
        headers: new Map(),
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check CSP for regular pages
      const csp = result.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'self' https://cnd2-app.pages.dev");
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("https://prairie.cards");
    });

    it('should set Permissions-Policy for regular pages', async () => {
      const mockRequest = {
        url: 'https://example.com/group',
      };
      
      const mockResponse = {
        headers: new Map(),
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check Permissions-Policy for regular pages
      const policy = result.headers.get('Permissions-Policy');
      expect(policy).toBe('camera=(), microphone=(), geolocation=(), payment=()');
    });

    it('should not set Permissions-Policy for API routes', async () => {
      const mockRequest = {
        url: 'https://example.com/api/diagnosis',
      };
      
      const mockResponse = {
        headers: new Map(),
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check no Permissions-Policy for API routes
      const policy = result.headers.get('Permissions-Policy');
      expect(policy).toBeUndefined();
    });
  });

  describe('URL Path Detection', () => {
    it('should correctly identify API routes', async () => {
      const apiPaths = [
        '/api/prairie',
        '/api/diagnosis',
        '/api/results/123',
        '/api/test',
      ];
      
      for (const path of apiPaths) {
        const mockRequest = {
          url: `https://example.com${path}`,
        };
        
        const mockResponse = {
          headers: new Map(),
        };
        
        const mockNext = jest.fn().mockResolvedValue(mockResponse);
        
        const context = {
          request: mockRequest,
          env: {},
          next: mockNext,
        };
        
        const result = await middleware.onRequest(context);
        
        // API routes should have restrictive CSP
        const csp = result.headers.get('Content-Security-Policy');
        expect(csp).toContain("default-src 'none'");
      }
    });

    it('should correctly identify regular pages', async () => {
      const pagePaths = [
        '/',
        '/duo',
        '/group',
        '/results/abc123',
        '/share',
      ];
      
      for (const path of pagePaths) {
        const mockRequest = {
          url: `https://example.com${path}`,
        };
        
        const mockResponse = {
          headers: new Map(),
        };
        
        const mockNext = jest.fn().mockResolvedValue(mockResponse);
        
        const context = {
          request: mockRequest,
          env: {},
          next: mockNext,
        };
        
        const result = await middleware.onRequest(context);
        
        // Regular pages should have full CSP
        const csp = result.headers.get('Content-Security-Policy');
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self'");
      }
    });
  });

  describe('Response Passthrough', () => {
    it('should pass through the response from next()', async () => {
      const mockRequest = {
        url: 'https://example.com/test',
      };
      
      const mockResponseBody = { data: 'test' };
      const mockResponse = {
        headers: new Map(),
        body: mockResponseBody,
        status: 200,
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check that response is passed through
      expect(result.body).toBe(mockResponseBody);
      expect(result.status).toBe(200);
    });

    it('should preserve existing headers', async () => {
      const mockRequest = {
        url: 'https://example.com/test',
      };
      
      const mockResponse = {
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['X-Custom-Header', 'test-value'],
        ]),
      };
      
      const mockNext = jest.fn().mockResolvedValue(mockResponse);
      
      const context = {
        request: mockRequest,
        env: {},
        next: mockNext,
      };
      
      const result = await middleware.onRequest(context);
      
      // Check that existing headers are preserved
      expect(result.headers.get('Content-Type')).toBe('application/json');
      expect(result.headers.get('X-Custom-Header')).toBe('test-value');
    });
  });
});