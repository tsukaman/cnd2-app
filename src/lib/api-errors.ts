import { NextResponse } from 'next/server';

/**
 * API Error codes
 */
export enum ApiErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_URL = 'INVALID_URL',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  FETCH_ERROR = 'FETCH_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
    
    // Set status code based on error code
    this.statusCode = getStatusCodeForErrorCode(code);
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Create a validation error
   */
  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      message,
      details
    );
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(
      ApiErrorCode.UNAUTHORIZED,
      message
    );
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(
      ApiErrorCode.FORBIDDEN,
      message
    );
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string): ApiError {
    return new ApiError(
      ApiErrorCode.NOT_FOUND,
      `${resource} not found`
    );
  }

  /**
   * Create a rate limit error
   */
  static rateLimit(retryAfter: number): ApiError {
    return new ApiError(
      ApiErrorCode.RATE_LIMIT_ERROR,
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      { retryAfter }
    );
  }

  /**
   * Create an internal server error
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      message
    );
  }

  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError(
      ApiErrorCode.SERVICE_UNAVAILABLE,
      message
    );
  }

  /**
   * Create a timeout error
   */
  static timeout(message = 'Request timeout'): ApiError {
    return new ApiError(
      ApiErrorCode.TIMEOUT_ERROR,
      message
    );
  }

  /**
   * Create an external service error
   */
  static externalService(service: string, error?: unknown): ApiError {
    const message = `External service error: ${service}`;
    return new ApiError(
      ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      { service, originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      code: this.code,
      message: this.message,
    };
    
    if (this.details !== undefined) {
      result.details = this.details;
    }
    
    return result;
  }
}

/**
 * Get status code for error code
 */
function getStatusCodeForErrorCode(code: ApiErrorCode): number {
  const statusMap: Record<ApiErrorCode, number> = {
    // Client errors (4xx)
    [ApiErrorCode.VALIDATION_ERROR]: 400,
    [ApiErrorCode.INVALID_URL]: 400,
    [ApiErrorCode.UNAUTHORIZED]: 401,
    [ApiErrorCode.FORBIDDEN]: 403,
    [ApiErrorCode.NOT_FOUND]: 404,
    [ApiErrorCode.METHOD_NOT_ALLOWED]: 405,
    [ApiErrorCode.CONFLICT]: 409,
    [ApiErrorCode.PARSE_ERROR]: 422,
    [ApiErrorCode.RATE_LIMIT_ERROR]: 429,
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    
    // Server errors (5xx)
    [ApiErrorCode.INTERNAL_ERROR]: 500,
    [ApiErrorCode.FETCH_ERROR]: 502,
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ApiErrorCode.TIMEOUT_ERROR]: 504,
    [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  };
  
  return statusMap[code] || 500;
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error
  if (error instanceof ApiError) {
    console.error('[API Error]', error.code, error.message);
  } else if (error instanceof Error) {
    console.error('[API Error]', 'INTERNAL_ERROR', error.message);
  } else if (typeof error === 'string') {
    console.error('[API Error]', 'INTERNAL_ERROR', error);
  } else {
    console.error('[API Error]', 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
  
  // Create response
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.toJSON(),
      },
      { status: error.statusCode }
    );
  } else if (error instanceof Error) {
    const apiError = new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      error.message
    );
    return NextResponse.json(
      {
        success: false,
        error: apiError.toJSON(),
      },
      { status: 500 }
    );
  } else if (typeof error === 'string') {
    const apiError = new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: apiError.toJSON(),
      },
      { status: 500 }
    );
  } else {
    const apiError = new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred'
    );
    return NextResponse.json(
      {
        success: false,
        error: apiError.toJSON(),
      },
      { status: 500 }
    );
  }
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: any
): NextResponse {
  const error = new ApiError(code, message, details);
  return NextResponse.json(
    {
      success: false,
      error: error.toJSON(),
    },
    { status: error.statusCode }
  );
}