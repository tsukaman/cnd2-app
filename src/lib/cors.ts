/**
 * CORS設定ユーティリティ
 * 複数オリジンサポートと環境別設定
 */

/**
 * 許可されたオリジンを取得
 */
export function getAllowedOrigins(): string[] {
  const defaultOrigins = ['https://cnd2-app.pages.dev'];
  
  // 環境変数から追加のオリジンを取得（カンマ区切り）
  const additionalOrigins = process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;
  
  if (additionalOrigins) {
    const origins = additionalOrigins.split(',').map(o => o.trim()).filter(Boolean);
    return [...defaultOrigins, ...origins];
  }
  
  // 開発環境では localhost を追加
  if (process.env.NODE_ENV === 'development') {
    return [
      ...defaultOrigins,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ];
  }
  
  return defaultOrigins;
}

/**
 * リクエストのオリジンが許可されているか確認
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * CORSヘッダーを取得
 */
export function getCorsHeaders(requestOrigin: string | null): HeadersInit {
  const allowedOrigins = getAllowedOrigins();
  
  // リクエストオリジンが許可リストにある場合はそれを使用
  // そうでない場合はデフォルトオリジンを使用
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24時間
  };
}

/**
 * Next.js Response用のCORSヘッダーを設定
 */
export function setCorsHeaders(response: Response, requestOrigin: string | null): Response {
  const headers = getCorsHeaders(requestOrigin);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });
  
  return response;
}