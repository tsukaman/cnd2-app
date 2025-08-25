/**
 * API専用のエラーハンドリングユーティリティ
 */

export enum ApiErrorCode {
  // 4xx Client Errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(ApiErrorCode.BAD_REQUEST, 400, message, details);
  }

  static unauthorized(message = '認証が必要です'): ApiError {
    return new ApiError(ApiErrorCode.UNAUTHORIZED, 401, message);
  }

  static forbidden(message = 'アクセスが拒否されました'): ApiError {
    return new ApiError(ApiErrorCode.FORBIDDEN, 403, message);
  }

  static notFound(resource = 'リソース'): ApiError {
    return new ApiError(ApiErrorCode.NOT_FOUND, 404, `${resource}が見つかりません`);
  }

  static methodNotAllowed(method: string): ApiError {
    return new ApiError(
      ApiErrorCode.METHOD_NOT_ALLOWED,
      405,
      `メソッド ${method} は許可されていません`
    );
  }

  static validationError(message: string, details?: unknown): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, 422, message, details);
  }

  static rateLimitExceeded(message = 'リクエスト制限を超えました'): ApiError {
    return new ApiError(ApiErrorCode.RATE_LIMIT_EXCEEDED, 429, message);
  }

  static internalServerError(message = 'サーバーエラーが発生しました'): ApiError {
    return new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 500, message);
  }

  static serviceUnavailable(message = 'サービスが利用できません'): ApiError {
    return new ApiError(ApiErrorCode.SERVICE_UNAVAILABLE, 503, message);
  }

  static externalServiceError(service: string, details?: unknown): ApiError {
    return new ApiError(
      ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      `外部サービス ${service} でエラーが発生しました`,
      details
    );
  }

  static databaseError(message = 'データベースエラーが発生しました'): ApiError {
    return new ApiError(ApiErrorCode.DATABASE_ERROR, 500, message);
  }

  static timeoutError(message = 'リクエストがタイムアウトしました'): ApiError {
    return new ApiError(ApiErrorCode.TIMEOUT_ERROR, 504, message);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * APIエラーレスポンスのフォーマット
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  error: ApiError,
  requestId?: string
): ApiErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}