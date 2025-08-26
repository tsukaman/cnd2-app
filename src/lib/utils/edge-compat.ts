/**
 * Edge Runtime compatible utility functions
 * These replace Node.js specific APIs with Web API equivalents
 */

/**
 * Convert string to base64 (Edge Runtime compatible)
 * Replaces Buffer.from(str).toString('base64')
 */
export function toBase64(str: string): string {
  if (typeof window !== 'undefined' && typeof btoa === 'function') {
    // Browser/Edge environment
    return btoa(unescape(encodeURIComponent(str)));
  }
  // Node.js environment (fallback)
  return Buffer.from(str).toString('base64');
}

/**
 * Convert base64 to string (Edge Runtime compatible)
 * Replaces Buffer.from(base64, 'base64').toString()
 */
export function fromBase64(base64: string): string {
  if (typeof window !== 'undefined' && typeof atob === 'function') {
    // Browser/Edge environment
    return decodeURIComponent(escape(atob(base64)));
  }
  // Node.js environment (fallback)
  return Buffer.from(base64, 'base64').toString();
}

/**
 * Generate a secure random string (Edge Runtime compatible)
 * Uses Web Crypto API when available
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Web Crypto API (Edge Runtime)
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }
  
  // Fallback for environments without Web Crypto API
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash a string using SHA-256 (Edge Runtime compatible)
 */
export async function sha256(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Web Crypto API (Edge Runtime)
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Node.js fallback
  const nodeCrypto = await import('crypto');
  return nodeCrypto.createHash('sha256').update(str).digest('hex');
}