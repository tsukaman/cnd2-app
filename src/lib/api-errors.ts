/**
 * API Error codes
 */
export enum ApiErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly statusCode: number,
    public readonly meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    
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
      { details }
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
   * Convert to JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      meta: this.meta,
    };
  }
}