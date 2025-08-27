/**
 * CSP（Content Security Policy）ヘッダーのテスト
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

describe('CSP Headers Configuration', () => {
  let headersContent: string;

  beforeAll(() => {
    const headersPath = path.join(process.cwd(), 'public', '_headers');
    headersContent = fs.readFileSync(headersPath, 'utf-8');
  });

  describe('Root path (/*) headers', () => {
    let rootHeaders: string;

    beforeAll(() => {
      const rootMatch = headersContent.match(/\/\*([\s\S]*?)(?=\n\/|$)/);
      rootHeaders = rootMatch ? rootMatch[1] : '';
    });

    it('should have Content-Security-Policy header', () => {
      expect(rootHeaders).toContain('Content-Security-Policy:');
    });

    it('should allow Cloudflare Pages production domain', () => {
      expect(rootHeaders).toContain('https://cnd2-app.pages.dev');
    });

    it('should allow custom domain', () => {
      expect(rootHeaders).toContain('https://cnd2.cloudnativedays.jp');
    });

    it('should NOT use wildcard domains for security', () => {
      expect(rootHeaders).not.toContain('https://*.pages.dev');
    });

    describe('CSP directives', () => {
      let cspHeader: string;

      beforeAll(() => {
        const cspMatch = rootHeaders.match(/Content-Security-Policy:([\s\S]*?)(?=\n\w+:|$)/);
        cspHeader = cspMatch ? cspMatch[1].trim() : '';
      });

      it('should have default-src directive with specific domains', () => {
        expect(cspHeader).toContain("default-src 'self' https://cnd2-app.pages.dev");
      });

      it('should have script-src directive with unsafe-inline for Next.js', () => {
        expect(cspHeader).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
        expect(cspHeader).toContain('https://cnd2-app.pages.dev');
        expect(cspHeader).toContain('https://cdn.jsdelivr.net');
      });

      it('should have style-src directive with unsafe-inline for styling', () => {
        expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
        expect(cspHeader).toContain('https://cnd2-app.pages.dev');
        expect(cspHeader).toContain('https://fonts.googleapis.com');
      });

      it('should have font-src directive for web fonts', () => {
        expect(cspHeader).toContain("font-src 'self'");
        expect(cspHeader).toContain('https://fonts.gstatic.com');
        expect(cspHeader).toContain('data:');
      });

      it('should have connect-src directive for API calls', () => {
        expect(cspHeader).toContain("connect-src 'self'");
        expect(cspHeader).toContain('https://api.openai.com');
        expect(cspHeader).toContain('https://prairie.cards');
        expect(cspHeader).toContain('https://*.prairie.cards');
        expect(cspHeader).toContain('https://api.qrserver.com');
      });

      it('should have restrictive frame-ancestors', () => {
        expect(cspHeader).toContain("frame-ancestors 'none'");
      });

      it('should have restrictive object-src', () => {
        expect(cspHeader).toContain("object-src 'none'");
      });

      it('should enforce HTTPS with upgrade-insecure-requests', () => {
        expect(cspHeader).toContain('upgrade-insecure-requests');
      });
    });

    describe('Security headers', () => {
      it('should have X-Frame-Options header', () => {
        expect(rootHeaders).toContain('X-Frame-Options: DENY');
      });

      it('should have X-Content-Type-Options header', () => {
        expect(rootHeaders).toContain('X-Content-Type-Options: nosniff');
      });

      it('should have X-XSS-Protection header', () => {
        expect(rootHeaders).toContain('X-XSS-Protection: 1; mode=block');
      });

      it('should have Referrer-Policy header', () => {
        expect(rootHeaders).toContain('Referrer-Policy: strict-origin-when-cross-origin');
      });

      it('should have Permissions-Policy header', () => {
        expect(rootHeaders).toContain('Permissions-Policy:');
        expect(rootHeaders).toContain('camera=()');
        expect(rootHeaders).toContain('microphone=()');
        expect(rootHeaders).toContain('geolocation=()');
      });
    });
  });

  describe('API path (/api/*) headers', () => {
    let apiHeaders: string;

    beforeAll(() => {
      const apiMatch = headersContent.match(/\/api\/\*([\s\S]*?)(?=\n\/|$)/);
      apiHeaders = apiMatch ? apiMatch[1] : '';
    });

    it('should have restrictive CSP for API endpoints', () => {
      expect(apiHeaders).toContain("Content-Security-Policy: default-src 'none'");
    });

    it('should have X-Frame-Options for API endpoints', () => {
      expect(apiHeaders).toContain('X-Frame-Options: DENY');
    });
  });

  describe('Static assets caching', () => {
    it('should have long-term cache for Next.js static files', () => {
      expect(headersContent).toContain('/_next/static/*');
      expect(headersContent).toContain('Cache-Control: public, max-age=31536000, immutable');
    });

    it('should have cache headers for images', () => {
      expect(headersContent).toContain('/images/*');
      expect(headersContent).toContain('Cache-Control: public, max-age=31536000');
    });

    it('should have cache headers for favicon', () => {
      expect(headersContent).toContain('/favicon.ico');
      expect(headersContent).toContain('Cache-Control: public, max-age=86400');
    });
  });
});

// Cloudflare Functions CSP consistency test
describe('Cloudflare Functions CSP Consistency', () => {
  it('should have consistent CSP between _headers and response.js', () => {
    const responsePath = path.join(process.cwd(), 'functions', 'utils', 'response.js');
    const responseContent = fs.readFileSync(responsePath, 'utf-8');
    
    // Check that response.js includes the same domains
    expect(responseContent).toContain('https://cnd2-app.pages.dev');
    expect(responseContent).toContain('https://cnd2.cloudnativedays.jp');
    
    // Ensure no wildcards are used
    expect(responseContent).not.toContain('https://*.pages.dev');
  });
});