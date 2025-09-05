import { NextResponse } from 'next/server';
import { 
  ErrorCode,
  ERROR_CODES,
  getErrorMessage,
  getErrorStatusCode
} from '@/lib/constants/error-messages';

/**
 * API Error codes (後方互換性のため維持、新規コードではERROR_CODESを使用)
 * @deprecated Use ERROR_CODES from '@/lib/constants/error-messages' instead
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
 * 旧ApiErrorCodeを新ErrorCodeにマッピング
 */
const ERROR_CODE_MAPPING: Record<ApiErrorCode, ErrorCode> = {
  [ApiErrorCode.VALIDATION_ERROR]: ERROR_CODES.VALIDATION_ERROR,
  [ApiErrorCode.INVALID_URL]: ERROR_CODES.PRAIRIE_INVALID_URL,
  [ApiErrorCode.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
  [ApiErrorCode.FORBIDDEN]: ERROR_CODES.UNAUTHORIZED,
  [ApiErrorCode.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [ApiErrorCode.METHOD_NOT_ALLOWED]: ERROR_CODES.INVALID_REQUEST,
  [ApiErrorCode.CONFLICT]: ERROR_CODES.INVALID_REQUEST,
  [ApiErrorCode.RATE_LIMIT_ERROR]: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  [ApiErrorCode.INTERNAL_ERROR]: ERROR_CODES.INTERNAL_ERROR,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: ERROR_CODES.STORAGE_KV_UNAVAILABLE,
  [ApiErrorCode.TIMEOUT_ERROR]: ERROR_CODES.DIAGNOSIS_TIMEOUT,
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: ERROR_CODES.INTERNAL_ERROR,
  [ApiErrorCode.FETCH_ERROR]: ERROR_CODES.PRAIRIE_FETCH_FAILED,
  [ApiErrorCode.PARSE_ERROR]: ERROR_CODES.PRAIRIE_PARSE_FAILED,
};

/**
 * Custom API Error class (統一エラーシステムとの統合版)
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly errorCode: ErrorCode; // 新しいエラーコード
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ApiErrorCode | ErrorCode,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    
    // 新旧エラーコードの処理
    if (typeof code === 'string' && code in ApiErrorCode) {
      // 旧形式のApiErrorCode
      this.code = code as ApiErrorCode;
      this.errorCode = ERROR_CODE_MAPPING[code as ApiErrorCode];
    } else {
      // 新形式のErrorCode
      this.errorCode = code as ErrorCode;
      // 旧コードへの逆マッピング（後方互換性）
      const legacyCode = Object.entries(ERROR_CODE_MAPPING)
        .find(([_, v]) => v === code)?.[0] as ApiErrorCode;
      this.code = legacyCode || ApiErrorCode.INTERNAL_ERROR;
    }
    
    this.details = details;
    
    // Use provided status code or get from error code
    // Special case: FORBIDDEN should return 403 even though it maps to UNAUTHORIZED
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    } else if (this.code === ApiErrorCode.FORBIDDEN) {
      this.statusCode = 403;
    } else {
      this.statusCode = getErrorStatusCode(this.errorCode);
    }
    
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
      message,
      ApiErrorCode.VALIDATION_ERROR,
      400,
      details
    );
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(
      message,
      ApiErrorCode.UNAUTHORIZED,
      401
    );
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(
      message,
      ApiErrorCode.FORBIDDEN,
      403
    );
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string): ApiError {
    return new ApiError(
      `${resource} not found`,
      ApiErrorCode.NOT_FOUND,
      404
    );
  }

  /**
   * Create a rate limit error
   */
  static rateLimit(retryAfter: number): ApiError {
    return new ApiError(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      ApiErrorCode.RATE_LIMIT_ERROR,
      429,
      { retryAfter }
    );
  }

  /**
   * Create an internal server error
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(
      message,
      ApiErrorCode.INTERNAL_ERROR,
      500
    );
  }

  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError(
      message,
      ApiErrorCode.SERVICE_UNAVAILABLE,
      503
    );
  }

  /**
   * Create a timeout error
   */
  static timeout(message = 'Request timeout'): ApiError {
    return new ApiError(
      message,
      ApiErrorCode.TIMEOUT_ERROR,
      504
    );
  }

  /**
   * Create an external service error
   */
  static externalService(service: string, error?: unknown): ApiError {
    const message = `External service error: ${service}`;
    return new ApiError(
      message,
      ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      { service, originalError: error instanceof Error ? error.message : String(error) }
    );
  }

  /**
   * Convert to JSON-serializable object (新統一形式)
   */
  toJSON(): Record<string, unknown> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      code: this.errorCode, // 新形式のエラーコード
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      requestId,
      // 後方互換性のため旧コードも含める
      legacyCode: this.code,
    };
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
      error.message,
      ApiErrorCode.INTERNAL_ERROR,
      500
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
      error,
      ApiErrorCode.INTERNAL_ERROR,
      500
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
      'An unexpected error occurred',
      ApiErrorCode.INTERNAL_ERROR,
      500
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
 * @deprecated Use createApiErrorResponse from '@/lib/utils/error-response' instead
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): NextResponse {
  const error = new ApiError(message, code, undefined, details);
  return NextResponse.json(
    {
      success: false,
      error: error.toJSON(),
    },
    { status: error.statusCode }
  );
}

// Re-export unified error utilities for convenience
export { 
  createApiErrorResponse,
  createApiSuccessResponse,
  inferErrorCode as inferErrorCodeFromError
} from '@/lib/utils/error-response';