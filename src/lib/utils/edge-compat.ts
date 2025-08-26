/**
 * Edge Runtime compatible utility functions
 * These replace Node.js specific APIs with Web API equivalents
 */

/**
 * Convert string to base64 (Edge Runtime compatible)
 * Replaces Buffer.from(str).toString('base64')
 */
export function toBase64(str: string): string {
  // Use btoa for Edge Runtime compatibility
  // btoa is available in both Edge Runtime and modern browsers
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Convert base64 to string (Edge Runtime compatible)
 * Replaces Buffer.from(base64, 'base64').toString()
 */
export function fromBase64(base64: string): string {
  // Use atob for Edge Runtime compatibility
  // atob is available in both Edge Runtime and modern browsers
  return decodeURIComponent(escape(atob(base64)));
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
  // Always use Web Crypto API for Edge Runtime compatibility
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}