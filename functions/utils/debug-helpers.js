// @ts-check

/**
 * Check if debug mode is enabled
 * @param {Object} env - Environment object
 * @returns {boolean} True if debug mode is enabled
 */
function isDebugMode(env) {
  // 本番環境では完全にDEBUG_MODEを無効化（セキュリティ強化）
  // Cloudflare Pages本番環境を検出
  const isCloudflareProduction = env?.CF_PAGES === '1' && env?.CF_PAGES_BRANCH === 'main';
  const isProductionNode = env?.NODE_ENV === 'production';
  
  if (isCloudflareProduction || isProductionNode) {
    // 本番環境では強制的にfalseを返す（DEBUG_MODE環境変数を無視）
    return false;
  }
  
  // 開発環境のみDEBUG_MODE=trueまたはNODE_ENV=developmentで有効化
  return env?.DEBUG_MODE === 'true' || env?.NODE_ENV === 'development';
}

/**
 * Check if production environment
 * @param {Object} env - Environment object
 * @returns {boolean} True if production environment
 */
function isProduction(env) {
  return env?.NODE_ENV === 'production' || env?.CF_PAGES === '1';
}

/**
 * More comprehensive sensitive patterns
 */
const SENSITIVE_PATTERNS = [
  // API Keys and Tokens
  /^.*(KEY|TOKEN|SECRET|CREDENTIAL|CERT|PRIVATE|PUBLIC_KEY).*$/i,
  /^.*(API|ACCESS|REFRESH|BEARER|JWT|SESSION|CSRF).*$/i,
  
  // Authentication
  /^.*(PASSWORD|PASSWD|PWD|PASS|PIN).*$/i,
  /^.*(AUTH|OAUTH|SAML|OIDC|SSO).*$/i,
  
  // Database/Infrastructure
  /^.*(DATABASE|DB|MONGO|MYSQL|POSTGRES|REDIS).*$/i,
  /^.*(CONNECTION|CONN|DSN|URI|URL).*$/i,
  
  // Cloud Services
  /^.*(AWS|AZURE|GCP|CLOUDFLARE|VERCEL).*$/i,
  /^.*(S3|BUCKET|STORAGE|BLOB).*$/i,
  
  // Payment/Financial
  /^.*(STRIPE|PAYMENT|CARD|BANK|ACCOUNT).*$/i,
  
  // Internal/Sensitive
  /^.*(INTERNAL|PRIVATE|SENSITIVE|CONFIDENTIAL).*$/i,
  /^.*(SALT|HASH|CIPHER|ENCRYPT).*$/i,
  
  // Specific Services
  /^.*(OPENAI|ANTHROPIC|SENTRY|DATADOG|GITHUB).*$/i
];

/**
 * Check if a key name is sensitive
 * @param {string} key - Key name to check
 * @returns {boolean} True if the key is sensitive
 */
function isSensitiveKey(key) {
  if (!key || typeof key !== 'string') return false;
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Filter sensitive keys from environment object
 * @param {Object} env - Environment object
 * @param {number} limit - Maximum number of keys to return
 * @returns {string[]} Array of filtered environment keys
 */
function getFilteredEnvKeys(env, limit = 10) {
  if (!env || typeof env !== 'object') return [];
  
  return Object.keys(env)
    .filter(k => !isSensitiveKey(k))
    .slice(0, limit);
}

/**
 * Mask sensitive value
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of characters to show
 * @returns {string} Masked value
 */
function maskSensitiveValue(value, visibleChars = 4) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= visibleChars) return '***';
  
  const prefix = value.substring(0, visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars, 20));
  return `${prefix}${masked}`;
}

/**
 * Safely format API key for logging (shows only format validation)
 * @param {string} apiKey - API key to check
 * @returns {Object} Safe information about the key
 */
function getSafeKeyInfo(apiKey) {
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
    hasWhitespace,
    // Never include actual key value
    masked: maskSensitiveValue(apiKey)
  };
}

/**
 * Create a safe debug logger that filters sensitive information
 * @param {Object} env - Environment object
 * @param {string} prefix - Log prefix
 * @returns {Object} Logger object with log, error, warn methods
 */
function createSafeDebugLogger(env, prefix = '[DEBUG]') {
  const isProd = isProduction(env);
  const debugEnabled = isDebugMode(env);
  
  const logMethod = (level, ...args) => {
    // 本番環境では DEBUG_MODE=true が明示的に必要
    if (isProd && !debugEnabled) return;
    
    // 開発環境またはデバッグモード有効時のみログ出力
    if (!debugEnabled && env?.NODE_ENV !== 'development') return;
    
    // Sanitize arguments before logging
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return sanitizeObject(arg);
      }
      if (typeof arg === 'string') {
        return sanitizeString(arg);
      }
      return arg;
    });
    
    console[level](`${prefix}`, ...sanitizedArgs);
  };
  
  return {
    log: (...args) => logMethod('log', ...args),
    error: (...args) => logMethod('error', ...args),
    warn: (...args) => logMethod('warn', ...args),
    debug: (...args) => logMethod('log', ...args)
  };
}

/**
 * Sanitize object by masking sensitive values
 * @param {Object} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, depth = 0) {
  if (depth > 5) return '[Nested Object]'; // Prevent deep recursion
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive keys entirely in production
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'object') {
      sanitized[key] = Array.isArray(value) 
        ? value.map(v => typeof v === 'object' ? sanitizeObject(v, depth + 1) : v)
        : sanitizeObject(value, depth + 1);
    } else if (typeof value === 'string' && value.length > 100) {
      // Truncate long strings that might contain sensitive data
      sanitized[key] = value.substring(0, 100) + '... [truncated]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize string by detecting and masking potential sensitive data
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;
  
  // Patterns that might indicate sensitive data in strings
  const patterns = [
    { regex: /sk-[A-Za-z0-9]{20,}/g, replacement: 'sk-[REDACTED]' },
    { regex: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/gi, replacement: 'Bearer [REDACTED]' },
    { regex: /[A-Za-z0-9+\/]{40,}={0,2}/g, replacement: '[POSSIBLE_KEY_REDACTED]' },
    { regex: /https?:\/\/[^:]+:[^@]+@/gi, replacement: 'https://[REDACTED]@' }
  ];
  
  let sanitized = str;
  for (const { regex, replacement } of patterns) {
    sanitized = sanitized.replace(regex, replacement);
  }
  
  return sanitized;
}

// CommonJS形式でエクスポート
module.exports = {
  isDebugMode,
  isProduction,
  isSensitiveKey,
  getFilteredEnvKeys,
  maskSensitiveValue,
  getSafeKeyInfo,
  createSafeDebugLogger
};