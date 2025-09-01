/**
 * HTML Sanitizer for Cloudflare Functions
 * Provides XSS protection by sanitizing user input
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param {string} dirty - The untrusted HTML string
 * @returns {string} - The sanitized HTML string
 */
export function sanitizeHTML(dirty) {
  if (typeof dirty !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers
  clean = clean.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\bon\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  clean = clean.replace(/javascript:/gi, '');
  
  // Remove data: protocol for potentially dangerous types
  clean = clean.replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))/gi, '');
  
  // Remove dangerous HTML tags
  const dangerousTags = ['iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    clean = clean.replace(regex, '');
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*>`, 'gi'), '');
  });
  
  // Escape remaining HTML entities
  clean = clean
    .replace(/&(?!(amp|lt|gt|quot|#39|#x27|#x2F);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return clean;
}

/**
 * Sanitize an object recursively
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - The sanitized object
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeHTML(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

export const sanitizer = {
  sanitizeHTML,
  sanitizeObject
};