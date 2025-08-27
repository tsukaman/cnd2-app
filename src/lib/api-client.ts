// API Client for Cloudflare Functions
// 環境に応じてエンドポイントを切り替え

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 開発環境では/api、本番環境ではCloudflare FunctionsのURLを使用
function getApiUrl(path: string): string {
  // API_BASE_URLが未設定の場合、現在のオリジンを使用（相対パス）
  if (!API_BASE_URL) {
    // ブラウザ環境では相対パスを使用
    if (typeof window !== 'undefined') {
      // pathが/で始まる場合は削除
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `/${cleanPath}`;
    }
    // サーバーサイドではエラー（ただし静的エクスポートなので実際には呼ばれない）
    throw new Error('API_BASE_URL is not configured for server-side rendering');
  }
  
  // pathが/で始まる場合は削除
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Cloudflare Functionsのパス構成に合わせる
  // /api/* -> /api/*
  return `${API_BASE_URL}/${cleanPath}`;
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
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
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
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
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
        const error = await response.json().catch(() => ({ error: 'Not found' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
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
        const error = await response.json().catch(() => ({ error: 'Failed to save' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    
    async delete(id: string) {
      const response = await fetch(getApiUrl(`api/results/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  }
};

// デバッグ用のヘルパー
export function logApiCall(endpoint: string, method: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${endpoint}`, data);
  }
}