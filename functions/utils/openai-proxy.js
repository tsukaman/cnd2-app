// @ts-check
/**
 * OpenAI API プロキシ設定
 * 地域制限を回避するためのプロキシ経由でのAPI呼び出し
 */

/**
 * OpenRouterでのモデル名マッピング
 * OpenAIのモデル名をOpenRouter形式に変換
 */
const OPENROUTER_MODEL_MAPPING = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  'gpt-4': 'openai/gpt-4',
  'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
  'gpt-3.5-turbo-16k': 'openai/gpt-3.5-turbo-16k'
};

/**
 * OpenAIモデル名をOpenRouter形式に変換
 * @param {string} modelName - OpenAIのモデル名
 * @returns {string} OpenRouter形式のモデル名
 */
function convertToOpenRouterModel(modelName) {
  // すでにプレフィックスがある場合はそのまま返す
  if (modelName.includes('/')) {
    return modelName;
  }
  // マッピングに存在する場合は変換、なければopenai/プレフィックスを追加
  return OPENROUTER_MODEL_MAPPING[modelName] || `openai/${modelName}`;
}

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
  // リクエストボディの検証
  if (!body || !body.model) {
    throw new Error('Invalid request body: missing required fields (model)');
  }
  
  // デバッグログ（開発環境のみ）
  if (env?.DEBUG_MODE === 'true' || env?.NODE_ENV === 'development') {
    debugLogger?.log('[PROXY DEBUG] Environment check:', {
      hasAccountId: !!env?.CLOUDFLARE_ACCOUNT_ID,
      hasGatewayId: !!env?.CLOUDFLARE_GATEWAY_ID,
      hasOpenRouter: !!env?.OPENROUTER_API_KEY,
      hasProxyUrl: !!env?.OPENAI_PROXY_URL
    });
  }
  
  // 方法1: OpenRouter経由（地域制限回避の最も確実な方法）
  // OpenRouterはCloudflare AI Gatewayと互換性があり、地域制限を確実に回避できる
  if (env?.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
    // AI Gateway経由でOpenRouterを使用（キャッシング・分析のメリットあり）
    if (env?.CLOUDFLARE_ACCOUNT_ID && env?.CLOUDFLARE_GATEWAY_ID) {
      // OpenRouter用のAI Gateway URLを構築
      // 注意: OpenRouterのエンドポイントは /api/v1/chat/completions
      const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/openrouter/api/v1/chat/completions`;
      
      debugLogger?.log('Using OpenRouter via AI Gateway (region restriction bypass):', {
        accountId: env.CLOUDFLARE_ACCOUNT_ID.substring(0, 8) + '...',
        gatewayId: env.CLOUDFLARE_GATEWAY_ID,
        url: gatewayUrl.replace(env.OPENROUTER_API_KEY, '[REDACTED]')
      });
      
      // OpenRouterではモデル名にプロバイダーのプレフィックスが必要
      const openRouterBody = {
        ...body,
        model: convertToOpenRouterModel(body.model)
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
    debugLogger?.log('Using OpenRouter directly (region restriction bypass)');
    
    const openRouterBody = {
      ...body,
      model: convertToOpenRouterModel(body.model)
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
    
    debugLogger?.log('Using Cloudflare AI Gateway with OpenAI (may fail due to HKG routing):', {
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
  
  // 方法3: カスタムプロキシエンドポイントを使用
  if (env?.OPENAI_PROXY_URL) {
    // プロキシURLのHTTPS検証
    try {
      const proxyUrl = new URL(env.OPENAI_PROXY_URL);
      if (proxyUrl.protocol !== 'https:') {
        throw new Error('Custom proxy URL must use HTTPS protocol');
      }
    } catch (error) {
      throw new Error(`Invalid proxy URL: ${error.message}`);
    }
    
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
  
  // 方法4: 直接OpenAI APIを呼び出す（デフォルト）
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