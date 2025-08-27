// Unified response utilities for Cloudflare Functions

/**
 * Standard error response format
 */
export function errorResponse(error, statusCode = 500, corsHeaders = {}) {
  const errorInfo = normalizeError(error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: errorInfo.userMessage,
        code: errorInfo.code,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Standard success response format
 */
export function successResponse(data, corsHeaders = {}) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Normalize error for consistent handling
 */
function normalizeError(error) {
  // Map common errors to user-friendly messages
  const errorMap = {
    // Network errors
    'Failed to fetch': {
      userMessage: 'リソースの取得に失敗しました。ネットワーク接続を確認してください。',
      code: 'NETWORK_ERROR',
    },
    'Network error': {
      userMessage: 'ネットワークエラーが発生しました。',
      code: 'NETWORK_ERROR',
    },
    
    // Validation errors
    'Invalid URL': {
      userMessage: '無効なURLです。正しい形式のURLを入力してください。',
      code: 'VALIDATION_ERROR',
    },
    'Invalid Prairie Card URL': {
      userMessage: '無効なPrairie Card URLです。prairie.cardsドメインのURLを使用してください。',
      code: 'INVALID_PRAIRIE_URL',
    },
    'required': {
      userMessage: '必須項目が不足しています。',
      code: 'MISSING_REQUIRED',
    },
    
    // KV errors
    'KV namespace not found': {
      userMessage: 'データストレージが利用できません。',
      code: 'STORAGE_ERROR',
    },
    
    // Parse errors
    'JSON': {
      userMessage: 'データの解析に失敗しました。',
      code: 'PARSE_ERROR',
    },
    'Prairie Card': {
      userMessage: 'Prairie Cardの解析に失敗しました。',
      code: 'PRAIRIE_PARSE_ERROR',
    },
    
    // Not found
    'not found': {
      userMessage: 'リソースが見つかりません。',
      code: 'NOT_FOUND',
    },
  };
  
  // Check if error is an Error object
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Find matching error pattern
  for (const [pattern, info] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return info;
    }
  }
  
  // Default error
  return {
    userMessage: 'エラーが発生しました。しばらく待ってから再度お試しください。',
    code: 'INTERNAL_ERROR',
  };
}

/**
 * CORS headers configuration
 */
export function getCorsHeaders(requestOrigin) {
  const allowedOrigins = [
    'https://cnd2-app.pages.dev',
    'https://cnd2.cloudnativedays.jp',
    'http://localhost:3000',
    'http://localhost:8788', // Wrangler dev
  ];
  
  // Check if origin is allowed
  const origin = allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Security headers for responses
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  };
}