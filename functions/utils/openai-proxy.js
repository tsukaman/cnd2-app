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
  // 方法1: Cloudflare AI Gatewayを使用（推奨）
  // Cloudflare AI Gatewayは地域制限を回避し、キャッシング、レート制限、分析も提供
  if (env?.CLOUDFLARE_ACCOUNT_ID && env?.CLOUDFLARE_GATEWAY_ID) {
    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/openai/chat/completions`;
    
    debugLogger?.log('Using Cloudflare AI Gateway:', {
      accountId: env.CLOUDFLARE_ACCOUNT_ID.substring(0, 8) + '...',
      gatewayId: env.CLOUDFLARE_GATEWAY_ID
    });
    
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