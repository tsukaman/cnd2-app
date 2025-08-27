// Constants for Cloudflare Functions

/**
 * Time constants in seconds
 */
export const TIME = {
  ONE_MINUTE: 60,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 24 * 60 * 60,
  SEVEN_DAYS: 7 * 24 * 60 * 60,
  THIRTY_DAYS: 30 * 24 * 60 * 60,
};

/**
 * KV TTL constants
 */
export const KV_TTL = {
  DIAGNOSIS: TIME.SEVEN_DAYS,
  METRICS: TIME.THIRTY_DAYS,
  CACHE: TIME.ONE_HOUR,
};

/**
 * Metrics keys
 */
export const METRICS_KEYS = {
  PRAIRIE_SUCCESS: 'metrics:prairie:success',
  PRAIRIE_ERROR: 'metrics:prairie:error',
  DIAGNOSIS_SUCCESS: 'metrics:diagnosis:success',
  DIAGNOSIS_ERROR: 'metrics:diagnosis:error',
  CACHE_HIT: 'metrics:cache:hit',
  CACHE_MISS: 'metrics:cache:miss',
};

/**
 * Safe parseInt with default value
 */
export function safeParseInt(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}