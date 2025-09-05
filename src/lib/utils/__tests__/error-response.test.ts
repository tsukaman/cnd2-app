import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  createApiErrorResponse,
  createApiSuccessResponse,
  inferErrorCode,
  withErrorHandling,
  ErrorResponse,
  SuccessResponse,
} from '../error-response';
import { ERROR_CODES, ErrorCode } from '@/lib/constants/error-messages';

describe('Error Response Utilities', () => {
  describe('createErrorResponse', () => {
    it('エラーレスポンスを正しく作成する', () => {
      const response = createErrorResponse(ERROR_CODES.INVALID_REQUEST);
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ERROR_CODES.INVALID_REQUEST);
      expect(response.error.message).toBe('不正なリクエストです');
      expect(response.error.timestamp).toBeDefined();
      expect(response.error.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('カスタムメッセージを受け付ける', () => {
      const response = createErrorResponse(
        ERROR_CODES.INVALID_REQUEST,
        undefined,
        'Custom error message'
      );
      
      expect(response.error.message).toBe('Custom error message');
    });

    it('詳細情報を含める', () => {
      const details = { field: 'email', required: true };
      const response = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        details
      );
      
      expect(response.error.details).toEqual(details);
    });

    it('英語メッセージを返す', () => {
      const response = createErrorResponse(
        ERROR_CODES.INVALID_REQUEST,
        undefined,
        undefined,
        'en'
      );
      
      expect(response.error.message).toBe('Invalid request');
    });
  });

  describe('createSuccessResponse', () => {
    it('成功レスポンスを正しく作成する', () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
      expect(response.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('カスタムrequestIdを受け付ける', () => {
      const data = { test: true };
      const customId = 'custom_request_id';
      const response = createSuccessResponse(data, customId);
      
      expect(response.requestId).toBe(customId);
    });
  });

  describe('createApiErrorResponse', () => {
    it('NextResponseを正しく作成する', () => {
      const response = createApiErrorResponse(ERROR_CODES.NOT_FOUND);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
    });

    it('カスタムヘッダーを含める', () => {
      const headers = { 'X-Custom-Header': 'value' };
      const response = createApiErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        undefined,
        undefined,
        headers
      );
      
      expect(response.headers.get('X-Custom-Header')).toBe('value');
    });
  });

  describe('createApiSuccessResponse', () => {
    it('成功NextResponseを正しく作成する', () => {
      const data = { success: true };
      const response = createApiSuccessResponse(data);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('inferErrorCode', () => {
    it('Prairie Card関連エラーを推測する', () => {
      expect(inferErrorCode(new Error('Prairie Card URL is invalid')))
        .toBe(ERROR_CODES.PRAIRIE_INVALID_URL);
      
      expect(inferErrorCode(new Error('Prairie fetch timeout')))
        .toBe(ERROR_CODES.PRAIRIE_TIMEOUT);
      
      expect(inferErrorCode(new Error('Failed to fetch Prairie Card')))
        .toBe(ERROR_CODES.PRAIRIE_FETCH_FAILED);
      
      expect(inferErrorCode(new Error('Cannot parse Prairie Card')))
        .toBe(ERROR_CODES.PRAIRIE_PARSE_FAILED);
    });

    it('診断関連エラーを推測する', () => {
      expect(inferErrorCode(new Error('Diagnosis profiles required')))
        .toBe(ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED);
      
      expect(inferErrorCode(new Error('At least 2 profiles needed')))
        .toBe(ERROR_CODES.DIAGNOSIS_MIN_PROFILES);
      
      expect(inferErrorCode(new Error('AI diagnosis error')))
        .toBe(ERROR_CODES.DIAGNOSIS_AI_ERROR);
    });

    it('ストレージ関連エラーを推測する', () => {
      expect(inferErrorCode(new Error('Failed to save to storage')))
        .toBe(ERROR_CODES.STORAGE_SAVE_FAILED);
      
      expect(inferErrorCode(new Error('Cannot load from KV storage')))
        .toBe(ERROR_CODES.STORAGE_LOAD_FAILED);
      
      expect(inferErrorCode(new Error('Storage not found')))
        .toBe(ERROR_CODES.STORAGE_NOT_FOUND);
      
      expect(inferErrorCode(new Error('Storage quota exceeded')))
        .toBe(ERROR_CODES.STORAGE_QUOTA_EXCEEDED);
    });

    it('結果関連エラーを推測する', () => {
      expect(inferErrorCode(new Error('Result not found')))
        .toBe(ERROR_CODES.RESULT_NOT_FOUND);
      
      expect(inferErrorCode(new Error('Invalid result ID')))
        .toBe(ERROR_CODES.RESULT_INVALID_ID);
      
      expect(inferErrorCode(new Error('Result has expired')))
        .toBe(ERROR_CODES.RESULT_EXPIRED);
    });

    it('認証関連エラーを推測する', () => {
      expect(inferErrorCode(new Error('User is unauthorized')))
        .toBe(ERROR_CODES.UNAUTHORIZED);
      
      expect(inferErrorCode(new Error('Auth token invalid')))
        .toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('レート制限エラーを推測する', () => {
      expect(inferErrorCode(new Error('Rate limit exceeded')))
        .toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
      
      expect(inferErrorCode(new Error('Too many requests, limit reached')))
        .toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    });

    it('バリデーションエラーを推測する', () => {
      expect(inferErrorCode(new Error('Invalid input data')))
        .toBe(ERROR_CODES.VALIDATION_ERROR);
      
      expect(inferErrorCode(new Error('Validation failed')))
        .toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('デフォルトで内部エラーを返す', () => {
      expect(inferErrorCode(new Error('Something went wrong')))
        .toBe(ERROR_CODES.INTERNAL_ERROR);
      
      expect(inferErrorCode('String error'))
        .toBe(ERROR_CODES.INTERNAL_ERROR);
      
      expect(inferErrorCode(null))
        .toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });

  describe('withErrorHandling', () => {
    it('成功した関数の結果を返す', async () => {
      const result = await withErrorHandling(async () => {
        return { data: 'success' };
      });
      
      expect(result).toEqual({ data: 'success' });
    });

    it('エラー時にErrorResponseを返す', async () => {
      const result = await withErrorHandling(async () => {
        throw new Error('Test error');
      }) as ErrorResponse;
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.error.details).toBe('Test error');
    });

    it('カスタムエラーコードを使用する', async () => {
      const result = await withErrorHandling(
        async () => {
          throw new Error('Not found');
        },
        ERROR_CODES.NOT_FOUND
      ) as ErrorResponse;
      
      expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('英語エラーメッセージを返す', async () => {
      const result = await withErrorHandling(
        async () => {
          throw new Error('Test');
        },
        ERROR_CODES.INVALID_REQUEST,
        'en'
      ) as ErrorResponse;
      
      expect(result.error.message).toBe('Invalid request');
    });
  });

  describe('Request ID Generation', () => {
    it('一意なrequestIdを生成する', () => {
      const responses = Array.from({ length: 100 }, () => 
        createErrorResponse(ERROR_CODES.INTERNAL_ERROR)
      );
      
      const requestIds = responses.map(r => r.error.requestId);
      const uniqueIds = new Set(requestIds);
      
      expect(uniqueIds.size).toBe(100);
    });

    it('requestIdが正しい形式である', () => {
      const response = createErrorResponse(ERROR_CODES.INTERNAL_ERROR);
      const requestId = response.error.requestId;
      
      expect(requestId).toMatch(/^req_\d{13}_[a-z0-9]{9}$/);
      
      // タイムスタンプ部分が妥当な範囲
      const timestamp = parseInt(requestId!.split('_')[1]);
      const now = Date.now();
      expect(timestamp).toBeGreaterThan(now - 1000);
      expect(timestamp).toBeLessThanOrEqual(now);
    });
  });
});