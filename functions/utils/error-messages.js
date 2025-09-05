/**
 * エラーコード定義とメッセージの統一管理（Cloudflare Functions用）
 */

/**
 * エラーコード定義
 */
export const ERROR_CODES = {
  // 共通エラー (1000番台)
  INVALID_REQUEST: 'COMMON_INVALID_REQUEST',
  INTERNAL_ERROR: 'COMMON_INTERNAL_ERROR',
  NOT_FOUND: 'COMMON_NOT_FOUND',
  VALIDATION_ERROR: 'COMMON_VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'COMMON_RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'COMMON_UNAUTHORIZED',
  
  // Prairie Card関連 (2000番台)
  PRAIRIE_URL_REQUIRED: 'PRAIRIE_URL_REQUIRED',
  PRAIRIE_INVALID_URL: 'PRAIRIE_INVALID_URL',
  PRAIRIE_FETCH_FAILED: 'PRAIRIE_FETCH_FAILED',
  PRAIRIE_PARSE_FAILED: 'PRAIRIE_PARSE_FAILED',
  PRAIRIE_TIMEOUT: 'PRAIRIE_TIMEOUT',
  PRAIRIE_NOT_FOUND: 'PRAIRIE_NOT_FOUND',
  PRAIRIE_INVALID_PROTOCOL: 'PRAIRIE_INVALID_PROTOCOL',
  PRAIRIE_INVALID_HOST: 'PRAIRIE_INVALID_HOST',
  
  // 診断関連 (3000番台)
  DIAGNOSIS_PROFILES_REQUIRED: 'DIAGNOSIS_PROFILES_REQUIRED',
  DIAGNOSIS_MIN_PROFILES: 'DIAGNOSIS_MIN_PROFILES',
  DIAGNOSIS_INVALID_PROFILE: 'DIAGNOSIS_INVALID_PROFILE',
  DIAGNOSIS_GENERATION_FAILED: 'DIAGNOSIS_GENERATION_FAILED',
  DIAGNOSIS_AI_ERROR: 'DIAGNOSIS_AI_ERROR',
  DIAGNOSIS_TIMEOUT: 'DIAGNOSIS_TIMEOUT',
  
  // ストレージ関連 (4000番台)
  STORAGE_SAVE_FAILED: 'STORAGE_SAVE_FAILED',
  STORAGE_LOAD_FAILED: 'STORAGE_LOAD_FAILED',
  STORAGE_NOT_FOUND: 'STORAGE_NOT_FOUND',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_INVALID_ID: 'STORAGE_INVALID_ID',
  STORAGE_KV_UNAVAILABLE: 'STORAGE_KV_UNAVAILABLE',
  
  // 結果取得関連 (5000番台)
  RESULT_NOT_FOUND: 'RESULT_NOT_FOUND',
  RESULT_INVALID_ID: 'RESULT_INVALID_ID',
  RESULT_EXPIRED: 'RESULT_EXPIRED',
};

/**
 * エラーメッセージ定義（日本語）
 */
const ERROR_MESSAGES_JA = {
  // 共通エラー
  [ERROR_CODES.INVALID_REQUEST]: '不正なリクエストです',
  [ERROR_CODES.INTERNAL_ERROR]: 'サーバー内部エラーが発生しました',
  [ERROR_CODES.NOT_FOUND]: 'リソースが見つかりません',
  [ERROR_CODES.VALIDATION_ERROR]: '入力値が正しくありません',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'レート制限を超えました。しばらく待ってから再試行してください',
  [ERROR_CODES.UNAUTHORIZED]: '認証が必要です',
  
  // Prairie Card関連
  [ERROR_CODES.PRAIRIE_URL_REQUIRED]: 'Prairie Card URLが必要です',
  [ERROR_CODES.PRAIRIE_INVALID_URL]: '有効なPrairie Card URLを入力してください',
  [ERROR_CODES.PRAIRIE_FETCH_FAILED]: 'Prairie Cardの取得に失敗しました',
  [ERROR_CODES.PRAIRIE_PARSE_FAILED]: 'Prairie Cardの解析に失敗しました',
  [ERROR_CODES.PRAIRIE_TIMEOUT]: 'Prairie Cardの取得がタイムアウトしました',
  [ERROR_CODES.PRAIRIE_NOT_FOUND]: 'Prairie Cardが見つかりません',
  [ERROR_CODES.PRAIRIE_INVALID_PROTOCOL]: 'HTTPSプロトコルのみサポートされています',
  [ERROR_CODES.PRAIRIE_INVALID_HOST]: 'my.prairie.cardsドメインのみサポートされています',
  
  // 診断関連
  [ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED]: 'プロフィール情報が必要です',
  [ERROR_CODES.DIAGNOSIS_MIN_PROFILES]: '最低2つのプロフィールが必要です',
  [ERROR_CODES.DIAGNOSIS_INVALID_PROFILE]: 'プロフィール形式が正しくありません',
  [ERROR_CODES.DIAGNOSIS_GENERATION_FAILED]: '診断結果の生成に失敗しました',
  [ERROR_CODES.DIAGNOSIS_AI_ERROR]: 'AI診断エラーが発生しました',
  [ERROR_CODES.DIAGNOSIS_TIMEOUT]: '診断処理がタイムアウトしました',
  
  // ストレージ関連
  [ERROR_CODES.STORAGE_SAVE_FAILED]: '結果の保存に失敗しました',
  [ERROR_CODES.STORAGE_LOAD_FAILED]: '結果の読み込みに失敗しました',
  [ERROR_CODES.STORAGE_NOT_FOUND]: '保存された結果が見つかりません',
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 'ストレージ容量を超えました',
  [ERROR_CODES.STORAGE_INVALID_ID]: '無効なIDです',
  [ERROR_CODES.STORAGE_KV_UNAVAILABLE]: 'ストレージサービスが利用できません',
  
  // 結果取得関連
  [ERROR_CODES.RESULT_NOT_FOUND]: '診断結果が見つかりません',
  [ERROR_CODES.RESULT_INVALID_ID]: '無効な診断結果IDです',
  [ERROR_CODES.RESULT_EXPIRED]: '診断結果の有効期限が切れています',
};

/**
 * エラーメッセージ定義（英語）
 */
const ERROR_MESSAGES_EN = {
  // 共通エラー
  [ERROR_CODES.INVALID_REQUEST]: 'Invalid request',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error occurred',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input values',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later',
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  
  // Prairie Card関連
  [ERROR_CODES.PRAIRIE_URL_REQUIRED]: 'Prairie Card URL is required',
  [ERROR_CODES.PRAIRIE_INVALID_URL]: 'Please enter a valid Prairie Card URL',
  [ERROR_CODES.PRAIRIE_FETCH_FAILED]: 'Failed to fetch Prairie Card',
  [ERROR_CODES.PRAIRIE_PARSE_FAILED]: 'Failed to parse Prairie Card',
  [ERROR_CODES.PRAIRIE_TIMEOUT]: 'Prairie Card fetch timed out',
  [ERROR_CODES.PRAIRIE_NOT_FOUND]: 'Prairie Card not found',
  [ERROR_CODES.PRAIRIE_INVALID_PROTOCOL]: 'Only HTTPS protocol is supported',
  [ERROR_CODES.PRAIRIE_INVALID_HOST]: 'Only my.prairie.cards domain is supported',
  
  // 診断関連
  [ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED]: 'Profile information is required',
  [ERROR_CODES.DIAGNOSIS_MIN_PROFILES]: 'At least 2 profiles are required',
  [ERROR_CODES.DIAGNOSIS_INVALID_PROFILE]: 'Invalid profile format',
  [ERROR_CODES.DIAGNOSIS_GENERATION_FAILED]: 'Failed to generate diagnosis result',
  [ERROR_CODES.DIAGNOSIS_AI_ERROR]: 'AI diagnosis error occurred',
  [ERROR_CODES.DIAGNOSIS_TIMEOUT]: 'Diagnosis processing timed out',
  
  // ストレージ関連
  [ERROR_CODES.STORAGE_SAVE_FAILED]: 'Failed to save result',
  [ERROR_CODES.STORAGE_LOAD_FAILED]: 'Failed to load result',
  [ERROR_CODES.STORAGE_NOT_FOUND]: 'Saved result not found',
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded',
  [ERROR_CODES.STORAGE_INVALID_ID]: 'Invalid ID',
  [ERROR_CODES.STORAGE_KV_UNAVAILABLE]: 'Storage service unavailable',
  
  // 結果取得関連
  [ERROR_CODES.RESULT_NOT_FOUND]: 'Diagnosis result not found',
  [ERROR_CODES.RESULT_INVALID_ID]: 'Invalid diagnosis result ID',
  [ERROR_CODES.RESULT_EXPIRED]: 'Diagnosis result has expired',
};

/**
 * HTTPステータスコードのマッピング
 */
const ERROR_STATUS_CODES = {
  // 400 Bad Request
  [ERROR_CODES.INVALID_REQUEST]: 400,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.PRAIRIE_URL_REQUIRED]: 400,
  [ERROR_CODES.PRAIRIE_INVALID_URL]: 400,
  [ERROR_CODES.PRAIRIE_INVALID_PROTOCOL]: 400,
  [ERROR_CODES.PRAIRIE_INVALID_HOST]: 400,
  [ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED]: 400,
  [ERROR_CODES.DIAGNOSIS_MIN_PROFILES]: 400,
  [ERROR_CODES.DIAGNOSIS_INVALID_PROFILE]: 400,
  [ERROR_CODES.STORAGE_INVALID_ID]: 400,
  [ERROR_CODES.RESULT_INVALID_ID]: 400,
  
  // 401 Unauthorized
  [ERROR_CODES.UNAUTHORIZED]: 401,
  
  // 404 Not Found
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.PRAIRIE_NOT_FOUND]: 404,
  [ERROR_CODES.STORAGE_NOT_FOUND]: 404,
  [ERROR_CODES.RESULT_NOT_FOUND]: 404,
  
  // 408 Request Timeout
  [ERROR_CODES.PRAIRIE_TIMEOUT]: 408,
  [ERROR_CODES.DIAGNOSIS_TIMEOUT]: 408,
  
  // 410 Gone
  [ERROR_CODES.RESULT_EXPIRED]: 410,
  
  // 429 Too Many Requests
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  
  // 500 Internal Server Error
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.PRAIRIE_FETCH_FAILED]: 500,
  [ERROR_CODES.PRAIRIE_PARSE_FAILED]: 500,
  [ERROR_CODES.DIAGNOSIS_GENERATION_FAILED]: 500,
  [ERROR_CODES.DIAGNOSIS_AI_ERROR]: 500,
  [ERROR_CODES.STORAGE_SAVE_FAILED]: 500,
  [ERROR_CODES.STORAGE_LOAD_FAILED]: 500,
  
  // 503 Service Unavailable
  [ERROR_CODES.STORAGE_KV_UNAVAILABLE]: 503,
  
  // 507 Insufficient Storage
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 507,
};

/**
 * デフォルトのエラーメッセージを取得
 */
export function getErrorMessage(code, language = 'ja') {
  const messages = language === 'ja' ? ERROR_MESSAGES_JA : ERROR_MESSAGES_EN;
  return messages[code] || messages[ERROR_CODES.INTERNAL_ERROR];
}

/**
 * エラーコードからHTTPステータスコードを取得
 */
export function getErrorStatusCode(code) {
  return ERROR_STATUS_CODES[code] || 500;
}

/**
 * 統一エラーレスポンスを作成
 */
export function createErrorResponse(code, details = null, customMessage = null, language = 'ja') {
  const message = customMessage || getErrorMessage(code, language);
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
export function createSuccessResponse(data, requestId = null) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  };
}

/**
 * エラーオブジェクトからErrorCodeを推定
 */
export function inferErrorCode(error) {
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