import { ApiError, ApiErrorCode, handleApiError, createErrorResponse } from '../api-errors';
import { NextResponse } from 'next/server';

describe('ApiError', () => {
  it('ApiErrorインスタンスを正しく作成する', () => {
    const error = new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid input',
      { field: 'email' }
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('各エラーコードに正しいステータスコードを設定する', () => {
    const testCases = [
      { code: ApiErrorCode.VALIDATION_ERROR, expectedStatus: 400 },
      { code: ApiErrorCode.INVALID_URL, expectedStatus: 400 },
      { code: ApiErrorCode.FETCH_ERROR, expectedStatus: 502 },
      { code: ApiErrorCode.PARSE_ERROR, expectedStatus: 422 },
      { code: ApiErrorCode.UNAUTHORIZED, expectedStatus: 401 },
      { code: ApiErrorCode.FORBIDDEN, expectedStatus: 403 },
      { code: ApiErrorCode.NOT_FOUND, expectedStatus: 404 },
      { code: ApiErrorCode.RATE_LIMIT_EXCEEDED, expectedStatus: 429 },
      { code: ApiErrorCode.INTERNAL_ERROR, expectedStatus: 500 },
      { code: ApiErrorCode.SERVICE_UNAVAILABLE, expectedStatus: 503 },
    ];

    testCases.forEach(({ code, expectedStatus }) => {
      const error = new ApiError(code, 'Test message');
      expect(error.statusCode).toBe(expectedStatus);
    });
  });

  it('JSON形式で正しくシリアライズする', () => {
    const error = new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid input',
      { field: 'email', required: true }
    );

    const json = error.toJSON();

    expect(json).toEqual({
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Invalid input',
      details: { field: 'email', required: true },
    });
  });

  it('詳細情報なしでもシリアライズできる', () => {
    const error = new ApiError(ApiErrorCode.INTERNAL_ERROR, 'Server error');
    const json = error.toJSON();

    expect(json).toEqual({
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Server error',
    });
  });
});

describe('handleApiError', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('ApiErrorインスタンスを正しく処理する', () => {
    const apiError = new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid email format'
    );

    const response = handleApiError(apiError);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      'VALIDATION_ERROR',
      'Invalid email format'
    );
  });

  it('一般的なErrorを内部エラーとして処理する', () => {
    const error = new Error('Something went wrong');
    const response = handleApiError(error);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      'INTERNAL_ERROR',
      'Something went wrong'
    );
  });

  it('文字列エラーを処理する', () => {
    const response = handleApiError('String error message');

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      'INTERNAL_ERROR',
      'String error message'
    );
  });

  it('未知のエラー型を処理する', () => {
    const response = handleApiError({ custom: 'error' });

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      'INTERNAL_ERROR',
      'An unexpected error occurred'
    );
  });

  it('nullやundefinedを処理する', () => {
    const responseNull = handleApiError(null);
    const responseUndefined = handleApiError(undefined);

    expect(responseNull).toBeInstanceOf(NextResponse);
    expect(responseNull.status).toBe(500);
    expect(responseUndefined).toBeInstanceOf(NextResponse);
    expect(responseUndefined.status).toBe(500);
  });

  it('ネットワークエラーを適切に処理する', () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'TypeError';
    
    const response = handleApiError(networkError);
    
    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      'INTERNAL_ERROR',
      'fetch failed'
    );
  });
});

describe('createErrorResponse', () => {
  it('エラーレスポンスを正しく作成する', () => {
    const response = createErrorResponse(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid input',
      { field: 'email' }
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
  });

  it('詳細情報なしでもレスポンスを作成できる', () => {
    const response = createErrorResponse(
      ApiErrorCode.NOT_FOUND,
      'Resource not found'
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(404);
  });

  it('カスタムステータスコードを使用できる', () => {
    const error = new ApiError(ApiErrorCode.INTERNAL_ERROR, 'Server error');
    const response = createErrorResponse(
      error.code,
      error.message,
      error.details
    );

    expect(response.status).toBe(500);
  });
});

describe('Error Chaining', () => {
  it('エラーの連鎖を適切に処理する', () => {
    const originalError = new Error('Database connection failed');
    const apiError = new ApiError(
      ApiErrorCode.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable',
      { originalError: originalError.message }
    );

    expect(apiError.details).toEqual({
      originalError: 'Database connection failed',
    });
  });

  it('複数のエラー詳細を含められる', () => {
    const error = new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Multiple validation errors',
      {
        errors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' },
        ],
      }
    );

    expect(error.details?.errors).toHaveLength(2);
  });
});