/**
 * @jest-environment node
 */

import { PrairieCardParser } from '@/lib/prairie-parser';
import { ValidationError, NetworkError, ParseError } from '@/lib/errors';

// モック設定
jest.mock('@/lib/cache-manager', () => ({
  CacheManager: jest.fn().mockImplementation(() => ({
    getFromMemory: jest.fn(() => null),
    getFromBrowser: jest.fn(() => null),
    save: jest.fn(),
    clear: jest.fn(),
    getWithSquaredCache: jest.fn(() => null),
  })),
}));

jest.mock('@/lib/rate-limiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    wait: jest.fn(() => Promise.resolve()),
  })),
}));

global.fetch = jest.fn();

describe('PrairieCardParser', () => {
  let parser: PrairieCardParser;

  beforeEach(() => {
    parser = PrairieCardParser.getInstance();
    jest.clearAllMocks();
  });

  describe('parseProfile', () => {
    it('should throw ValidationError for invalid URL', async () => {
      await expect(parser.parseProfile('invalid-url')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-Prairie URL', async () => {
      await expect(parser.parseProfile('https://example.com/profile')).rejects.toThrow(ValidationError);
    });

    it('should handle 404 error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(parser.parseProfile('https://my.prairie.cards/test')).rejects.toThrow(ValidationError);
    });

    it('should handle network timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );

      await expect(parser.parseProfile('https://my.prairie.cards/test')).rejects.toThrow(NetworkError);
    });

    it('should handle empty HTML response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn(() => Promise.resolve('')),
      });

      await expect(parser.parseProfile('https://my.prairie.cards/test')).rejects.toThrow(ParseError);
    });

    it('should parse valid Prairie Card HTML', async () => {
      const mockHTML = `
        <html>
          <body>
            <h1>Test User</h1>
            <div class="title">Software Engineer</div>
            <div class="company">Tech Corp</div>
            <div class="bio">Test bio</div>
            <div class="skills">
              <span class="skill">TypeScript</span>
              <span class="skill">React</span>
            </div>
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn(() => Promise.resolve(mockHTML)),
      });

      const result = await parser.parseProfile('https://my.prairie.cards/test');
      
      expect(result).toBeDefined();
      expect(result.basic.name).toBe('Test User');
      expect(result.basic.title).toBe('Software Engineer');
      expect(result.details.skills).toContain('TypeScript');
      expect(result.details.skills).toContain('React');
    });

    it('should recover with partial data on parse error', async () => {
      const mockHTML = `
        <html>
          <body>
            <h1>Partial User</h1>
            <!-- Invalid HTML structure -->
          </body>
        </html>
      `;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn(() => Promise.resolve(mockHTML)),
      });

      const result = await parser.parseProfile('https://my.prairie.cards/test');
      
      expect(result).toBeDefined();
      expect(result.basic.name).toBe('Partial User');
      expect(result.meta.isPartialData).toBe(true);
    });

    it('should handle rate limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(parser.parseProfile('https://my.prairie.cards/test')).rejects.toThrow(NetworkError);
    });

    it('should handle server errors (500)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(parser.parseProfile('https://my.prairie.cards/test')).rejects.toThrow(NetworkError);
    });
  });

  describe('URL normalization', () => {
    it('should normalize Prairie Card URLs correctly', () => {
      const urls = [
        'https://my.prairie.cards/user',
        'http://my.prairie.cards/user',
        'my.prairie.cards/user',
        'https://my.prairie.cards/user/',
      ];

      urls.forEach(url => {
        expect(() => parser.parseProfile(url)).rejects.toBeDefined();
      });
    });
  });
});