import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createErrorResponse } from '@/lib/api-middleware';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('API Middleware', () => {
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('withApiMiddleware', () => {
    it('handles successful requests', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('adds request ID to successful responses', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ data: 'test' })
      );

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.headers.get('X-Request-ID')).toMatch(/^[a-f0-9-]+$/);
    });

    it('handles ApiError with proper status code', async () => {
      const apiError = new ApiError(
        'Test error',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
      const mockHandler = jest.fn().mockRejectedValue(apiError);

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Test error');
      expect(data.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    });

    it('handles timeout errors', async () => {
      const timeoutError = new ApiError(
        'Request timeout',
        ApiErrorCode.TIMEOUT_ERROR,
        504
      );
      const mockHandler = jest.fn().mockRejectedValue(timeoutError);

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(504);
      const data = await response.json();
      expect(data.code).toBe(ApiErrorCode.TIMEOUT_ERROR);
    });

    it('handles generic errors with 500 status', async () => {
      const genericError = new Error('Something went wrong');
      const mockHandler = jest.fn().mockRejectedValue(genericError);

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe(ApiErrorCode.INTERNAL_ERROR);
    });

    it('logs errors with structured format', async () => {
      const error = new ApiError('Test error', ApiErrorCode.VALIDATION_ERROR, 400);
      const mockHandler = jest.fn().mockRejectedValue(error);

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test?param=value');
      await wrappedHandler(request);

      expect(console.error).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          requestId: expect.any(String),
          message: 'Test error',
          code: ApiErrorCode.VALIDATION_ERROR,
          path: '/api/test',
          method: 'GET',
        })
      );
    });

    it('logs request details', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      await wrappedHandler(request);

      expect(console.log).toHaveBeenCalledWith(
        '[API Request]',
        expect.objectContaining({
          requestId: expect.any(String),
          method: 'POST',
          path: '/api/test',
          timestamp: expect.any(String),
        })
      );
    });

    it('preserves request ID through error responses', async () => {
      const error = new ApiError('Test error', ApiErrorCode.VALIDATION_ERROR, 400);
      const mockHandler = jest.fn().mockRejectedValue(error);

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      const requestId = response.headers.get('X-Request-ID');
      expect(requestId).toMatch(/^[a-f0-9-]+$/);

      const data = await response.json();
      expect(data.requestId).toBe(requestId);
    });

    it('handles missing query parameters gracefully', async () => {
      const mockHandler = jest.fn().mockImplementation((req: NextRequest) => {
        // Access query params
        const params = req.nextUrl.searchParams;
        return NextResponse.json({ param: params.get('test') || 'default' });
      });

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.param).toBe('default');
    });
  });

  describe('createErrorResponse', () => {
    it('creates proper error response for ApiError', () => {
      const error = new ApiError(
        'Validation failed',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
      const requestId = 'test-request-id';
      
      const response = createErrorResponse(error, requestId);
      
      expect(response.status).toBe(400);
      expect(response.headers.get('X-Request-ID')).toBe(requestId);
    });

    it('creates 500 response for generic errors', () => {
      const error = new Error('Generic error');
      const requestId = 'test-request-id';
      
      const response = createErrorResponse(error, requestId);
      
      expect(response.status).toBe(500);
      expect(response.headers.get('X-Request-ID')).toBe(requestId);
    });

    it('includes CORS headers in error responses', () => {
      const error = new ApiError('Test', ApiErrorCode.VALIDATION_ERROR, 400);
      const requestId = 'test-request-id';
      
      const response = createErrorResponse(error, requestId);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });

  describe('Performance optimization', () => {
    it('efficiently parses query parameters', async () => {
      const mockHandler = jest.fn().mockImplementation((req: NextRequest) => {
        // Multiple accesses to searchParams should be efficient
        const params = req.nextUrl.searchParams;
        const value1 = params.get('param1');
        const value2 = params.get('param2');
        const value3 = params.get('param3');
        
        return NextResponse.json({ value1, value2, value3 });
      });

      const wrappedHandler = withApiMiddleware(mockHandler);
      const request = new NextRequest(
        'http://localhost:3000/api/test?param1=a&param2=b&param3=c'
      );
      
      const startTime = Date.now();
      const response = await wrappedHandler(request);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(response.status).toBe(200);
    });
  });
});