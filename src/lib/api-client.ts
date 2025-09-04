// API Client for Cloudflare Functions
// 環境に応じてエンドポイントを切り替え

import { logger } from './logger';
import { PrairieProfile, DiagnosisResult } from '@/types';
import { withRetry, isRetryableError } from './utils/retry';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// ブラウザ環境かどうかを初期化時に一度だけ判定（パフォーマンス最適化）
const isBrowser = typeof window !== 'undefined';

// API Error Response types
interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: string;
  } | string;
  success?: boolean;
}

// 開発環境では/api、本番環境ではCloudflare FunctionsのURLを使用
function getApiUrl(path: string): string {
  // pathの正規化を統一処理
  // 例: "/api/prairie" -> "api/prairie", "api/prairie" -> "api/prairie"
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // API_BASE_URLが未設定の場合、現在のオリジンを使用（相対パス）
  if (!API_BASE_URL) {
    // ブラウザ環境では相対パスを使用
    // 例: "api/prairie" -> "/api/prairie"
    if (isBrowser) {
      return `/${cleanPath}`;
    }
    // Note: Next.jsの静的エクスポートではこのコードは実行されませんが、
    // 将来的にSSRを導入した場合のセーフティネットとして残しています
    throw new Error('API_BASE_URL is not configured for server-side rendering');
  }
  
  // 環境変数が設定されている場合は絶対URLを構築
  // 末尾スラッシュを削除して二重スラッシュを防ぐ
  // 例: "https://cnd2-app.pages.dev/" -> "https://cnd2-app.pages.dev"
  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
  // 例: "https://cnd2-app.pages.dev" + "/" + "api/prairie"
  return `${cleanBaseUrl}/${cleanPath}`;
}

// 共通のエラーハンドリング関数
async function handleApiError(response: Response, defaultMessage: string = 'Network error'): Promise<void> {
  let errorData: ApiErrorResponse;
  let rawResponse: string = '';
  
  try {
    // レスポンスのテキストを取得して詳細を確認
    rawResponse = await response.text();
    errorData = JSON.parse(rawResponse);
  } catch (parseError) {
    logger.error('[API Client] Failed to parse error response:', {
      status: response.status,
      rawResponse: rawResponse.substring(0, 500), // 最初の500文字のみログ出力
      parseError: parseError
    });
    errorData = { error: { message: defaultMessage } };
  }
  
  // Handle both old format (error.error) and new format (error.error.message)
  const errorMessage = typeof errorData.error === 'object' 
    ? errorData.error?.message 
    : errorData.error || `HTTP error! status: ${response.status}`;
  
  const finalMessage = errorMessage || defaultMessage;
  
  // Log the error for debugging with more details
  logger.error('[API Client] Request failed:', {
    status: response.status,
    message: finalMessage,
    url: response.url,
    errorData: errorData // 全体のエラーデータをログ出力
  });
    
  throw new Error(finalMessage);
}

// 共通のレスポンス処理関数
async function handleApiResponse<T = unknown>(response: Response): Promise<T> {
  const result = await response.json();
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[API Client] Response received:', {
      url: response.url,
      status: response.status,
      hasData: 'data' in result
    });
  }
  
  // Handle the new response format with success/data structure
  return result.data || result;
}

export const apiClient = {
  // Prairie Card API
  prairie: {
    async fetch(url: string, options?: { enableRetry?: boolean; onRetry?: (attempt: number, error: Error) => void }) {
      const { enableRetry = true, onRetry } = options || {};
      
      const fetchFn = async () => {
        const response = await fetch(getApiUrl('api/prairie'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        
        if (!response.ok) {
          // Check if it's a retryable error
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            const error = new Error(`Prairie Card APIが一時的に利用できません (${response.status})`);
            if (enableRetry && isRetryableError(error)) {
              throw error; // Will be caught by withRetry
            }
          }
          await handleApiError(response, 'Prairie Card の取得に失敗しました');
        }
        
        return handleApiResponse(response);
      };
      
      if (enableRetry) {
        return withRetry(fetchFn, {
          maxAttempts: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            logger.info(`[Prairie API] Retry attempt ${attempt}/3:`, error.message);
            if (onRetry) {
              onRetry(attempt, error);
            }
          }
        });
      }
      
      return fetchFn();
    }
  },
  
  // Diagnosis API
  diagnosis: {
    async generate(profiles: PrairieProfile[], mode: 'duo' | 'group' = 'duo') {
      const response = await fetch(getApiUrl('api/diagnosis'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profiles, mode }),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to generate diagnosis');
      }
      
      return handleApiResponse(response);
    }
  },
  
  // Results API
  results: {
    async get(id: string) {
      // クエリパラメータ形式に変更（PR #142の修正に対応）
      const response = await fetch(getApiUrl(`api/results?id=${id}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Not found');
      }
      
      return handleApiResponse(response);
    },
    
    async save(result: DiagnosisResult) {
      const response = await fetch(getApiUrl('api/results'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to save');
      }
      
      return handleApiResponse(response);
    },
    
    async delete(id: string) {
      // DELETEメソッドもクエリパラメータ形式に統一
      const response = await fetch(getApiUrl(`api/results?id=${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        await handleApiError(response, 'Failed to delete');
      }
      
      return handleApiResponse(response);
    }
  }
};

// デバッグ用のヘルパー
export function logApiCall(endpoint: string, method: string, data?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${endpoint}`, data);
  }
}