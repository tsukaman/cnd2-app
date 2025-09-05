// @ts-check
/**
 * OpenAI API プロキシ設定
 * 地域制限を回避するためのプロキシ経由でのAPI呼び出し
 */

/**
 * OpenAI APIをプロキシ経由で呼び出す
 * @param {Object} params - パラメータ
 * @param {string} params.apiKey - OpenAI APIキー
 * @param {Object} params.body - リクエストボディ
 * @param {Object} params.env - 環境変数
 * @param {Object} params.debugLogger - デバッグロガー
 * @returns {Promise<Response>} APIレスポンス
 */
export async function callOpenAIWithProxy({ apiKey, body, env, debugLogger }) {
  // 環境変数のデバッグ（一時的）
  console.log('[PROXY DEBUG] Environment check:', {
    hasAccountId: !!env?.CLOUDFLARE_ACCOUNT_ID,
    hasGatewayId: !!env?.CLOUDFLARE_GATEWAY_ID,
    hasOpenRouter: !!env?.OPENROUTER_API_KEY,
    hasProxyUrl: !!env?.OPENAI_PROXY_URL,
    envKeys: env ? Object.keys(env).filter(k => k.includes('CLOUDFLARE') || k.includes('OPENAI') || k.includes('OPENROUTER')) : []
  });
  
  // 方法1: OpenRouter経由（地域制限回避の推奨方法）
  // OpenRouterはCloudflare AI Gatewayと互換性があり、地域制限を回避できる
  if (env?.OPENROUTER_API_KEY) {
    // AI Gateway経由でOpenRouterを使用
    if (env?.CLOUDFLARE_ACCOUNT_ID && env?.CLOUDFLARE_GATEWAY_ID) {
      const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/openrouter`;
      
      console.log('[PROXY] Using OpenRouter via AI Gateway (region restriction bypass)');
      debugLogger?.log('Using OpenRouter via AI Gateway');
      
      // OpenRouterではモデル名にプロバイダーのプレフィックスが必要
      const openRouterBody = {
        ...body,
        model: body.model === 'gpt-4o-mini' ? 'openai/gpt-4o-mini' : body.model
      };
      
      return fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cnd2-app.pages.dev',
          'X-Title': 'CND² Diagnosis'
        },
        body: JSON.stringify(openRouterBody)
      });
    }
    
    // AI Gatewayなしで直接OpenRouterを使用
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    console.log('[PROXY] Using OpenRouter directly (region restriction bypass)');
    
    const openRouterBody = {
      ...body,
      model: body.model === 'gpt-4o-mini' ? 'openai/gpt-4o-mini' : body.model
    };
    
    return fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cnd2-app.pages.dev',
        'X-Title': 'CND² Diagnosis'
      },
      body: JSON.stringify(openRouterBody)
    });
  }
  
  // 方法2: Cloudflare AI Gateway（OpenAI直接 - 地域制限の影響あり）
  // 注意：HKGデータセンター経由の場合、403エラーが発生する可能性があります
  if (env?.CLOUDFLARE_ACCOUNT_ID && env?.CLOUDFLARE_GATEWAY_ID) {
    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/openai/chat/completions`;
    
    console.log('[PROXY] Using Cloudflare AI Gateway with OpenAI (may fail due to HKG routing)');
    debugLogger?.log('Using Cloudflare AI Gateway with OpenAI');
    
    return fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
  
  // 方法2: カスタムプロキシエンドポイントを使用
  if (env?.OPENAI_PROXY_URL) {
    console.log('[PROXY] Using custom proxy:', env.OPENAI_PROXY_URL); // 強制ログ
    debugLogger?.log('Using custom proxy:', {
      proxyUrl: env.OPENAI_PROXY_URL
    });
    
    return fetch(env.OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Original-Endpoint': 'https://api.openai.com/v1/chat/completions'
      },
      body: JSON.stringify(body)
    });
  }
  
  // 方法3: 直接OpenAI APIを呼び出す（デフォルト）
  console.log('[PROXY] Using direct OpenAI API (may fail due to region restrictions)'); // 強制ログ
  debugLogger?.log('Using direct OpenAI API (may fail due to region restrictions)');
  
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/**
 * 地域制限エラーかどうかを判定
 * @param {Response} response - APIレスポンス
 * @param {Object} error - エラーオブジェクト
 * @returns {boolean} 地域制限エラーの場合true
 */
export function isRegionRestrictionError(response, error) {
  if (response?.status === 403) {
    return true;
  }
  
  const errorMessage = error?.error?.message || error?.message || '';
  return errorMessage.toLowerCase().includes('country') || 
         errorMessage.toLowerCase().includes('region') || 
         errorMessage.toLowerCase().includes('territory');
}