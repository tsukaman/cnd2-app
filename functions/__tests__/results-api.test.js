// Results API Test
describe('Results GET API', () => {
  let env;
  let request;
  let corsHeaders;

  beforeEach(() => {
    // Mock environment
    env = {
      DIAGNOSIS_KV: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      },
    };

    // Mock CORS headers
    corsHeaders = {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  });

  describe('GET /api/results', () => {
    test('should return result from KV storage with valid ID', async () => {
      const mockResult = {
        id: 'test123',
        score: 85,
        type: 'Cloud Native Expert',
        participants: [
          { basic: { name: 'User1' } },
          { basic: { name: 'User2' } },
        ],
      };

      const mockUrl = new URL('http://localhost/api/results?id=test123');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      env.DIAGNOSIS_KV.get.mockResolvedValue(JSON.stringify(mockResult));

      // Import the actual function
      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(env.DIAGNOSIS_KV.get).toHaveBeenCalledWith('diagnosis:test123');
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.result).toEqual(mockResult);
      expect(responseData.cache.hit).toBe(true);
      expect(responseData.cache.source).toBe('kv');
    });

    test('should handle missing ID parameter', async () => {
      const mockUrl = new URL('http://localhost/api/results');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Missing result ID');
    });

    test('should handle malformed JSON in KV', async () => {
      const mockUrl = new URL('http://localhost/api/results?id=test123');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      // Return invalid JSON
      env.DIAGNOSIS_KV.get.mockResolvedValue('{ invalid json }');

      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Result data is corrupted');
    });

    test('should return 404 for non-existent results', async () => {
      const mockUrl = new URL('http://localhost/api/results?id=nonexistent');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      env.DIAGNOSIS_KV.get.mockResolvedValue(null);

      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(env.DIAGNOSIS_KV.get).toHaveBeenCalledWith('diagnosis:nonexistent');
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Result not found');
    });

    test('should apply proper CORS headers', async () => {
      const mockUrl = new URL('http://localhost/api/results?id=test123');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('https://cnd2-app.pages.dev'),
        },
      };

      env.DIAGNOSIS_KV.get.mockResolvedValue(JSON.stringify({ id: 'test123' }));

      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://cnd2-app.pages.dev');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('should apply cache headers for successful responses', async () => {
      const mockUrl = new URL('http://localhost/api/results?id=test123');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      env.DIAGNOSIS_KV.get.mockResolvedValue(JSON.stringify({ id: 'test123' }));

      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=7200');
    });

    test('should handle invalid result object format', async () => {
      const mockUrl = new URL('http://localhost/api/results?id=test123');
      request = {
        url: mockUrl.toString(),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      // Return valid JSON but not an object
      env.DIAGNOSIS_KV.get.mockResolvedValue('"string value"');

      const { onRequestGet } = require('../api/results.js');
      const response = await onRequestGet({ request, env });

      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Result data is corrupted');
    });
  });

  describe('OPTIONS /api/results', () => {
    test('should handle preflight requests', async () => {
      request = {
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000'),
        },
      };

      const { onRequestOptions } = require('../api/results.js');
      const response = await onRequestOptions({ request });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });
});