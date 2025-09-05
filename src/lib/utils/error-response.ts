/**
 * 統一エラーレスポンス処理ユーティリティ
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  ErrorCode, 
  getErrorMessage, 
  getErrorStatusCode,
  ERROR_CODES 
} from '@/lib/constants/error-messages';

/**
 * 統一エラーレスポンス形式
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * 成功レスポンス形式
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp?: string;
  requestId?: string;
}

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  code: ErrorCode,
  details?: unknown,
  customMessage?: string,
  language: 'ja' | 'en' = 'ja'
): ErrorResponse {
  const message = customMessage || getErrorMessage(code, language);
  
  // requestIdの生成（簡易版）
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * 成功レスポンスを作成
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  };
}

/**
 * Next.js APIルート用のエラーレスポンスを作成
 */
export function createApiErrorResponse(
  code: ErrorCode,
  details?: unknown,
  customMessage?: string,
  headers?: HeadersInit,
  language: 'ja' | 'en' = 'ja'
): NextResponse {
  const errorResponse = createErrorResponse(code, details, customMessage, language);
  const statusCode = getErrorStatusCode(code);
  
  // エラーログ出力
  logger.error(`API Error [${code}]: ${errorResponse.error.message}`, {
    code,
    statusCode,
    details,
    requestId: errorResponse.error.requestId,
  });
  
  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers 
  });
}

/**
 * Next.js APIルート用の成功レスポンスを作成
 */
export function createApiSuccessResponse<T>(
  data: T,
  headers?: HeadersInit,
  requestId?: string
): NextResponse {
  const successResponse = createSuccessResponse(data, requestId);
  
  return NextResponse.json(successResponse, { 
    status: 200,
    headers 
  });
}

/**
 * エラーオブジェクトからErrorCodeを推定
 */
export function inferErrorCode(error: unknown): ErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Prairie Card関連
    if (message.includes('prairie')) {
      if (message.includes('url')) return ERROR_CODES.PRAIRIE_INVALID_URL;
      if (message.includes('timeout')) return ERROR_CODES.PRAIRIE_TIMEOUT;
      if (message.includes('fetch')) return ERROR_CODES.PRAIRIE_FETCH_FAILED;
      if (message.includes('parse')) return ERROR_CODES.PRAIRIE_PARSE_FAILED;
      return ERROR_CODES.PRAIRIE_FETCH_FAILED;
    }
    
    // 診断関連
    if (message.includes('diagnosis') || message.includes('profile')) {
      if (message.includes('required')) return ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED;
      if (message.includes('at least')) return ERROR_CODES.DIAGNOSIS_MIN_PROFILES;
      if (message.includes('ai') || message.includes('openai')) return ERROR_CODES.DIAGNOSIS_AI_ERROR;
      return ERROR_CODES.DIAGNOSIS_GENERATION_FAILED;
    }
    
    // ストレージ関連
    if (message.includes('storage') || message.includes('kv')) {
      if (message.includes('save')) return ERROR_CODES.STORAGE_SAVE_FAILED;
      if (message.includes('load')) return ERROR_CODES.STORAGE_LOAD_FAILED;
      if (message.includes('not found')) return ERROR_CODES.STORAGE_NOT_FOUND;
      if (message.includes('quota')) return ERROR_CODES.STORAGE_QUOTA_EXCEEDED;
      return ERROR_CODES.STORAGE_SAVE_FAILED;
    }
    
    // 結果関連
    if (message.includes('result')) {
      if (message.includes('not found')) return ERROR_CODES.RESULT_NOT_FOUND;
      if (message.includes('invalid')) return ERROR_CODES.RESULT_INVALID_ID;
      if (message.includes('expired')) return ERROR_CODES.RESULT_EXPIRED;
      return ERROR_CODES.RESULT_NOT_FOUND;
    }
    
    // 認証関連
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ERROR_CODES.UNAUTHORIZED;
    }
    
    // レート制限
    if (message.includes('rate') || message.includes('limit')) {
      return ERROR_CODES.RATE_LIMIT_EXCEEDED;
    }
    
    // バリデーション
    if (message.includes('invalid') || message.includes('validation')) {
      return ERROR_CODES.VALIDATION_ERROR;
    }
  }
  
  // デフォルト
  return ERROR_CODES.INTERNAL_ERROR;
}

/**
 * エラーハンドリングラッパー（try-catch用）
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorCode?: ErrorCode,
  language: 'ja' | 'en' = 'ja'
): Promise<T | ErrorResponse> {
  try {
    return await fn();
  } catch (error) {
    const code = errorCode || inferErrorCode(error);
    const details = error instanceof Error ? error.message : error;
    return createErrorResponse(code, details, undefined, language);
  }
}