/**
 * Debug-related constants
 */

export const DEBUG_CONSTANTS = {
  /**
   * Threshold in milliseconds to determine if an error occurred too quickly
   * (likely due to browser/policy blocking rather than user denial)
   */
  QUICK_ERROR_THRESHOLD_MS: 1000,
  
  /**
   * Timeout for camera test operations
   */
  CAMERA_TEST_TIMEOUT_MS: 5000,
  
  /**
   * Query parameter name for debug mode
   */
  DEBUG_QUERY_PARAM: 'debug',
  
  /**
   * Video loading timeout for QR scanner
   */
  VIDEO_LOADING_TIMEOUT_MS: 5000,
} as const;

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  // Always allow in development
  if (process.env.NODE_ENV === 'development') return true;
  
  // Check for debug query parameter in production
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.has(DEBUG_CONSTANTS.DEBUG_QUERY_PARAM) && 
           params.get(DEBUG_CONSTANTS.DEBUG_QUERY_PARAM) === 'true';
  }
  
  return false;
}

/**
 * Sanitize URL by masking sensitive query parameters
 */
export function sanitizeUrl(url: string): string {
  return url
    .replace(/([?&]token=)[^&]*/g, '$1***')
    .replace(/([?&]api[_-]?key=)[^&]*/gi, '$1***')
    .replace(/([?&]secret=)[^&]*/gi, '$1***')
    .replace(/([?&]password=)[^&]*/gi, '$1***');
}