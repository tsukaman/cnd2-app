// @ts-check

/**
 * KVストレージヘルパー関数（Cloudflare Functions用）
 * 開発環境でのKVアクセスを最適化し、不要なエラーハンドリングを削減
 */

/**
 * 開発環境かどうかを判定
 * @param {Object} env - 環境変数オブジェクト
 * @returns {boolean} 開発環境の場合true
 */
function isDevelopment(env) {
  // Cloudflare Pages開発環境の検出
  // - NODE_ENV=developmentまたは
  // - CF_PAGES=1でmainブランチ以外または
  // - KVが利用不可（ローカル開発）
  return (
    env?.NODE_ENV === 'development' ||
    (env?.CF_PAGES === '1' && env?.CF_PAGES_BRANCH !== 'main') ||
    !env?.DIAGNOSIS_KV
  );
}

/**
 * KVストレージが利用可能かチェック
 * 開発環境では常にfalseを返してKVアクセスをスキップ
 * @param {Object} env - 環境変数オブジェクト
 * @returns {boolean} KVが利用可能な場合true
 */
function isKVAvailable(env) {
  // 開発環境では常にKVを使用しない
  if (isDevelopment(env)) {
    return false;
  }
  
  // 本番環境でKVが存在する場合のみtrue
  return !!env?.DIAGNOSIS_KV;
}

/**
 * KV操作のラッパー（開発環境では何もしない）
 * @param {Object} env - 環境変数オブジェクト
 * @param {Function} operation - KV操作関数
 * @param {*} fallbackValue - 開発環境での戻り値
 * @returns {Promise<*>} 操作結果またはfallback値
 */
async function withKV(env, operation, fallbackValue = null) {
  if (!isKVAvailable(env)) {
    // 開発環境ではKV操作をスキップ
    return fallbackValue;
  }
  
  try {
    return await operation(env.DIAGNOSIS_KV);
  } catch (error) {
    // 本番環境でのみエラーログを出力
    if (!isDevelopment(env)) {
      console.error('[KV] Operation failed:', error);
    }
    return fallbackValue;
  }
}

/**
 * KVから値を取得（開発環境対応）
 * @param {Object} env - 環境変数オブジェクト
 * @param {string} key - 取得するキー
 * @param {*} defaultValue - デフォルト値
 * @returns {Promise<*>} 取得した値またはデフォルト値
 */
async function kvGet(env, key, defaultValue = null) {
  return withKV(
    env,
    (kv) => kv.get(key),
    defaultValue
  );
}

/**
 * KVに値を保存（開発環境対応）
 * @param {Object} env - 環境変数オブジェクト
 * @param {string} key - 保存するキー
 * @param {string} value - 保存する値
 * @param {Object} options - KVオプション（TTL等）
 * @returns {Promise<boolean>} 保存成功の場合true
 */
async function kvPut(env, key, value, options = {}) {
  return withKV(
    env,
    (kv) => kv.put(key, value, options).then(() => true),
    false
  );
}

/**
 * KVから値を削除（開発環境対応）
 * @param {Object} env - 環境変数オブジェクト
 * @param {string} key - 削除するキー
 * @returns {Promise<boolean>} 削除成功の場合true
 */
async function kvDelete(env, key) {
  return withKV(
    env,
    (kv) => kv.delete(key).then(() => true),
    false
  );
}

/**
 * メトリクスをインクリメント（開発環境対応）
 * @param {Object} env - 環境変数オブジェクト
 * @param {string} metricsKey - メトリクスキー
 * @returns {Promise<number>} 更新後の値（開発環境では常に0）
 */
async function incrementMetrics(env, metricsKey) {
  if (!isKVAvailable(env)) {
    // 開発環境ではメトリクス更新をスキップ
    return 0;
  }
  
  try {
    const currentCount = await env.DIAGNOSIS_KV.get(metricsKey);
    const count = parseInt(currentCount || '0', 10) || 0;
    const newCount = count + 1;
    await env.DIAGNOSIS_KV.put(metricsKey, String(newCount));
    return newCount;
  } catch (error) {
    // メトリクス更新エラーは無視（クリティカルではない）
    return 0;
  }
}

// CommonJS形式でエクスポート
module.exports = {
  isDevelopment,
  isKVAvailable,
  withKV,
  kvGet,
  kvPut,
  kvDelete,
  incrementMetrics
};