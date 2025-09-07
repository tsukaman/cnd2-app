/**
 * Content Security Policy (CSP) Constants
 * Centralized CSP configuration for consistency and maintainability
 */

// Allowed domains for various CSP directives
const ALLOWED_DOMAINS = {
  SELF: "'self'",
  CND2_APP: 'https://cnd2-app.pages.dev',
  CND2_PROD: 'https://cnd2.cloudnativedays.jp',
  CDN_JSDELIVR: 'https://cdn.jsdelivr.net',
  GOOGLE_FONTS: 'https://fonts.googleapis.com',
  GOOGLE_FONTS_STATIC: 'https://fonts.gstatic.com',
  OPENAI_API: 'https://api.openai.com',
  PRAIRIE_CARDS: 'https://prairie.cards',
  PRAIRIE_CARDS_WILDCARD: 'https://*.prairie.cards',
  QR_SERVER: 'https://api.qrserver.com',
};

// CSP directive values
const CSP_VALUES = {
  NONE: "'none'",
  SELF: "'self'",
  UNSAFE_INLINE: "'unsafe-inline'",
  UNSAFE_EVAL: "'unsafe-eval'",
  DATA: 'data:',
  BLOB: 'blob:',
  HTTPS: 'https:',
};

// CSP for API routes (restrictive)
const API_CSP = {
  'default-src': [CSP_VALUES.NONE],
  'frame-ancestors': [CSP_VALUES.NONE],
};

// CSP for web pages (full functionality)
const WEB_CSP = {
  'default-src': [
    CSP_VALUES.SELF,
    ALLOWED_DOMAINS.CND2_APP,
    ALLOWED_DOMAINS.CND2_PROD,
  ],
  'script-src': [
    CSP_VALUES.SELF,
    CSP_VALUES.UNSAFE_INLINE,
    CSP_VALUES.UNSAFE_EVAL,
    ALLOWED_DOMAINS.CND2_APP,
    ALLOWED_DOMAINS.CND2_PROD,
    ALLOWED_DOMAINS.CDN_JSDELIVR,
  ],
  'style-src': [
    CSP_VALUES.SELF,
    CSP_VALUES.UNSAFE_INLINE,
    ALLOWED_DOMAINS.CND2_APP,
    ALLOWED_DOMAINS.CND2_PROD,
    ALLOWED_DOMAINS.GOOGLE_FONTS,
  ],
  'font-src': [
    CSP_VALUES.SELF,
    ALLOWED_DOMAINS.CND2_APP,
    ALLOWED_DOMAINS.CND2_PROD,
    ALLOWED_DOMAINS.GOOGLE_FONTS_STATIC,
    CSP_VALUES.DATA,
  ],
  'img-src': [
    CSP_VALUES.SELF,
    CSP_VALUES.DATA,
    CSP_VALUES.HTTPS,
    CSP_VALUES.BLOB,
  ],
  'connect-src': [
    CSP_VALUES.SELF,
    ALLOWED_DOMAINS.CND2_APP,
    ALLOWED_DOMAINS.CND2_PROD,
    ALLOWED_DOMAINS.OPENAI_API,
    ALLOWED_DOMAINS.PRAIRIE_CARDS,
    ALLOWED_DOMAINS.PRAIRIE_CARDS_WILDCARD,
    ALLOWED_DOMAINS.QR_SERVER,
  ],
  'frame-src': [CSP_VALUES.SELF],
  'object-src': [CSP_VALUES.NONE],
  'base-uri': [CSP_VALUES.SELF],
  'form-action': [CSP_VALUES.SELF],
  'frame-ancestors': [CSP_VALUES.NONE],
  'upgrade-insecure-requests': [],
};

/**
 * Convert CSP object to string format
 * @param {Object} cspConfig - CSP configuration object
 * @returns {string} - Formatted CSP string
 */
function formatCSP(cspConfig) {
  return Object.entries(cspConfig)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive; // For directives without values like upgrade-insecure-requests
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ')
    .concat(';');
}

// Pre-formatted CSP strings for direct use
const CSP_STRINGS = {
  API: formatCSP(API_CSP),
  WEB: formatCSP(WEB_CSP),
};

// Permissions Policy for web pages
const PERMISSIONS_POLICY = 'camera=(self), microphone=(), geolocation=(), payment=()';

// Security headers that apply to all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

module.exports = {
  ALLOWED_DOMAINS,
  CSP_VALUES,
  API_CSP,
  WEB_CSP,
  CSP_STRINGS,
  PERMISSIONS_POLICY,
  SECURITY_HEADERS,
  formatCSP,
};