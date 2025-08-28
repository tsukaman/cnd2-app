/**
 * API Client for Diagnosis v3 (Cloudflare Functions)
 * イベント会場での共有WiFi対策として、セッションIDを含めたリクエストを送信
 */

// 開発環境では/api、本番環境ではCloudflare FunctionsのURLを使用
function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // 本番環境の場合はドメインを含める
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `/${cleanPath}`;
  }
  
  return `/${cleanPath}`;
}

/**
 * セッションIDを取得または生成
 * イベント会場での共有WiFi対策として、各ブラウザセッションを識別
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  let sessionId = sessionStorage.getItem('cnd2-session-id');
  if (!sessionId) {
    // ランダムなセッションIDを生成
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('cnd2-session-id', sessionId);
    console.log(`[Session] New session ID created: ${sessionId}`);
  }
  return sessionId;
}

/**
 * 共通のヘッダーを生成
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // セッションIDをヘッダーに追加
  const sessionId = getSessionId();
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  
  return headers;
}

export const apiClientV3 = {
  // Diagnosis v3 API
  diagnosis: {
    async generateFromUrls(urls: [string, string]) {
      const response = await fetch(getApiUrl('api/diagnosis-v3'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ urls }),
      });
      
      if (!response.ok) {
        // レート制限エラーの処理
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const error = await response.json().catch(() => ({ 
            error: 'アクセスが集中しています。しばらくお待ちください。' 
          }));
          
          const errorMessage = error.detail 
            ? `${error.error}\n${error.detail}` 
            : error.error;
            
          throw new Error(errorMessage);
        }
        
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  },
  
  // セッション管理
  session: {
    /**
     * 現在のセッションIDを取得
     */
    getId(): string {
      return getSessionId();
    },
    
    /**
     * セッションIDをリセット（新しいIDを生成）
     */
    reset(): string {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cnd2-session-id');
      }
      return getSessionId();
    },
    
    /**
     * セッション情報をログに出力（デバッグ用）
     */
    debug(): void {
      const sessionId = getSessionId();
      console.log('[Session Debug]', {
        sessionId,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// デバッグ用: 開発環境でのみセッション情報を表示
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('[API Client v3] Initialized with session ID:', getSessionId());
}