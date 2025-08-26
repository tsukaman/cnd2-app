import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from './api-errors';
import { getApiConfig } from './env';
import { checkRateLimit, addRateLimitHeaders } from './rate-limit';

/**
 * API middleware wrapper that provides common functionality:
 * - Request/response logging
 * - Error handling
 * - Request ID generation
 * - Rate limiting
 * - CORS headers
 */
export function withApiMiddleware<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Check rate limit
      await checkRateLimit(request);

      // Log request
      console.log('[API Request]', {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      });

      // Call the handler
      const response = await handler(request);

      // Add request ID and rate limit headers to response
      response.headers.set('X-Request-ID', requestId);
      addRateLimitHeaders(response, request);

      // Log response
      const duration = Date.now() - startTime;
      console.log('[API Response]', {
        requestId,
        status: response.status,
        duration: `${duration}ms`,
      });

      return response;
    } catch (error) {
      // Log error with structured format
      console.error('[API Error]', {
        requestId,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof ApiError ? error.code : 'UNKNOWN',
        path: request.nextUrl.pathname,
        method: request.method,
      });

      const errorResponse = createErrorResponse(error, requestId);
      
      // Add rate limit headers even on error responses
      try {
        addRateLimitHeaders(errorResponse, request);
      } catch {
        // Ignore errors adding rate limit headers
      }
      
      return errorResponse;
    }
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse {
  const apiConfig = getApiConfig();
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorCode = ApiErrorCode.INTERNAL_ERROR;
  let errorMeta: Record<string, unknown> = {};

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorMessage = error.message;
    errorCode = error.code;
    errorMeta = error.meta || {};
  } else if (error instanceof Error) {
    // Keep generic message for security
    errorMessage = 'Internal server error';
  }

  const response = NextResponse.json(
    {
      success: false,
      error: errorMessage,
      code: errorCode,
      requestId,
      ...errorMeta,
    },
    { status: statusCode }
  );

  // Add Retry-After header for rate limit errors
  if (error instanceof ApiError && error.code === ApiErrorCode.RATE_LIMIT_ERROR) {
    const retryAfter = errorMeta.retryAfter as number;
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }
  }

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }

  return response;
}

/**
 * Validate request body against a schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(
        `Invalid request body: ${error.message}`,
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
    }
    throw new ApiError(
      'Invalid request body',
      ApiErrorCode.VALIDATION_ERROR,
      400
    );
  }
}

/**
 * Helper to create success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: { statusCode?: number; headers?: Record<string, string> }
): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      data,
    },
    { status: meta?.statusCode || 200 }
  );

  if (meta?.headers) {
    Object.entries(meta.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}