// @ts-check

/**
 * Check if debug mode is enabled
 * @param {Object} env - Environment object
 * @returns {boolean} True if debug mode is enabled
 */
export function isDebugMode(env) {
  return env?.DEBUG_MODE === 'true' || env?.NODE_ENV === 'development';
}

/**
 * Filter sensitive keys from environment object
 * @param {Object} env - Environment object
 * @param {number} limit - Maximum number of keys to return
 * @returns {string[]} Array of filtered environment keys
 */
export function getFilteredEnvKeys(env, limit = 10) {
  if (!env || typeof env !== 'object') return [];
  
  // More comprehensive filtering for sensitive keys
  const sensitivePatterns = /(SECRET|PASSWORD|KEY|TOKEN|AUTH|PRIVATE|CREDENTIAL)/i;
  
  return Object.keys(env)
    .filter(k => !sensitivePatterns.test(k))
    .slice(0, limit);
}

/**
 * Safely format API key for logging (shows only format validation)
 * @param {string} apiKey - API key to check
 * @returns {Object} Safe information about the key
 */
export function getSafeKeyInfo(apiKey) {
  if (!apiKey) {
    return { exists: false, format: 'missing' };
  }
  
  const isValid = typeof apiKey === 'string' && apiKey.trim().length > 20;
  const startsWithSk = apiKey.startsWith('sk-');
  const hasWhitespace = apiKey !== apiKey.trim();
  
  return {
    exists: true,
    format: isValid ? 'valid' : 'invalid',
    length: apiKey.length,
    startsWithSk,
    hasWhitespace
  };
}