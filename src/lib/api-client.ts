// API Client for Cloudflare Functions
// 環境に応じてエンドポイントを切り替え

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// ブラウザ環境かどうかを初期化時に一度だけ判定（パフォーマンス最適化）
const isBrowser = typeof window !== 'undefined';

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

export const apiClient = {
  // Prairie Card API
  prairie: {
    async fetch(url: string) {
      const response = await fetch(getApiUrl('api/prairie'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Network error' } }));
        // Handle both old format (error.error) and new format (error.error.message)
        const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Handle the new response format with success/data structure
      const result = await response.json();
      return result.data || result;
    }
  },
  
  // Diagnosis API
  diagnosis: {
    async generate(profiles: any[], mode: 'duo' | 'group' = 'duo') {
      const response = await fetch(getApiUrl('api/diagnosis'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profiles, mode }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Network error' } }));
        // Handle both old format (error.error) and new format (error.error.message)
        const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Handle the new response format with success/data structure
      const result = await response.json();
      return result.data || result;
    }
  },
  
  // Results API
  results: {
    async get(id: string) {
      const response = await fetch(getApiUrl(`api/results/${id}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Not found' } }));
        const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result.data || result;
    },
    
    async save(result: any) {
      const response = await fetch(getApiUrl('api/results'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to save' } }));
        const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      return responseData.data || responseData;
    },
    
    async delete(id: string) {
      const response = await fetch(getApiUrl(`api/results/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to delete' } }));
        const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      return responseData.data || responseData;
    }
  }
};

// デバッグ用のヘルパー
export function logApiCall(endpoint: string, method: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${endpoint}`, data);
  }
}