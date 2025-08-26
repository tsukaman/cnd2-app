/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';

// Mock rate-limit module
jest.mock('@/lib/rate-limit');

import { withApiMiddleware, createErrorResponse } from '@/lib/api-middleware';

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
});