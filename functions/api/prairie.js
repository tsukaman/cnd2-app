// Prairie Card API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';

export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    try {
      const { url, html } = await request.json();
      
      // Validation
      if (!url && !html) {
        logger.warn('Invalid request: missing URL or HTML');
        return errorResponse(
          new Error('URL or HTML content is required'),
          400,
          corsHeaders
        );
      }
      
      // Simplified Prairie Card parsing for demo
      let prairieData;
      
      if (html) {
        // Parse from HTML
        logger.info('Parsing Prairie Card from HTML');
        prairieData = parseFromHTML(html);
      } else {
        // Validate URL before fetching
        if (!validatePrairieCardUrl(url)) {
          logger.warn('Invalid Prairie Card URL', { url });
          return errorResponse(
            new Error('Invalid Prairie Card URL'),
            400,
            corsHeaders
          );
        }
        
        logger.info('Fetching Prairie Card', { url });
        const startFetch = Date.now();
        
        // Fetch and parse from URL
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'CND2/1.0',
            'Accept': 'text/html',
          },
        });
        
        logger.metric('prairie_fetch_duration', Date.now() - startFetch, 'ms', {
          url,
          status: response.status,
        });
        
        if (!response.ok) {
          logger.error('Failed to fetch Prairie Card', null, {
            url,
            status: response.status,
          });
          throw new Error(`Failed to fetch Prairie Card: ${response.status}`);
        }
        
        const html = await response.text();
        prairieData = parseFromHTML(html);
        
        logger.info('Prairie Card parsed successfully', {
          url,
          name: prairieData.name,
        });
      }
      
      // Cache hit tracking
      const cacheStatus = {
        hit: false,
        source: 'fetch',
      };
      
      // Track success metrics
      if (env.DIAGNOSIS_KV) {
        try {
          const metricsKey = 'metrics:prairie:success';
          const currentCount = await env.DIAGNOSIS_KV.get(metricsKey) || '0';
          await env.DIAGNOSIS_KV.put(metricsKey, String(parseInt(currentCount) + 1));
        } catch (e) {
          logger.debug('Failed to update metrics', { error: e.message });
        }
      }
      
      return successResponse(
        {
          ...prairieData,
          cache: cacheStatus,
        },
        corsHeaders
      );
    } catch (error) {
      logger.error('Prairie API error', error);
      
      // Track error metrics
      if (env.DIAGNOSIS_KV) {
        try {
          const metricsKey = 'metrics:prairie:error';
          const currentCount = await env.DIAGNOSIS_KV.get(metricsKey) || '0';
          await env.DIAGNOSIS_KV.put(metricsKey, String(parseInt(currentCount) + 1));
        } catch (e) {
          logger.debug('Failed to update error metrics', { error: e.message });
        }
      }
      
      // Determine appropriate status code
      let statusCode = 500;
      if (error.message.includes('Failed to fetch')) {
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('Invalid')) {
        statusCode = 400; // Bad Request
      }
      
      return errorResponse(error, statusCode, corsHeaders);
    }
  });
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// URL validation function for security
function validatePrairieCardUrl(url) {
  try {
    const parsed = new URL(url);
    // Only allow prairie.cards domains
    const validHosts = ['prairie.cards', 'my.prairie.cards'];
    return validHosts.includes(parsed.hostname) || 
           parsed.hostname.endsWith('.prairie.cards');
  } catch {
    return false;
  }
}

// HTML sanitization function for security
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseFromHTML(html) {
  // Simplified Prairie Card parsing
  const extractText = (pattern) => {
    const match = html.match(pattern);
    return match ? match[1].trim() : '';
  };
  
  const extractArray = (pattern) => {
    const matches = html.matchAll(pattern);
    return Array.from(matches).map(m => m[1].trim());
  };
  
  // Transform to match PrairieProfile type structure
  return {
    basic: {
      name: escapeHtml(extractText(/<h1[^>]*>([^<]+)<\/h1>/i)) || 'CloudNative Enthusiast',
      bio: escapeHtml(extractText(/<div[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/div>/i)) || 'クラウドネイティブ技術に情熱を注ぐエンジニア',
      title: escapeHtml(extractText(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i)) || '',
      company: escapeHtml(extractText(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i)) || '',
    },
    details: {
      interests: ['Kubernetes', 'Docker', 'CI/CD', 'Observability'],
      skills: extractArray(/<span[^>]*class="[^"]*skill[^"]*"[^>]*>([^<]+)<\/span>/gi),
      tags: ['#CloudNative', '#DevOps', '#SRE'],
      certifications: [],
      communities: [],
    },
    social: {
      twitter: extractSocialUrl(html, 'twitter.com') || extractSocialUrl(html, 'x.com'),
      github: extractSocialUrl(html, 'github.com'),
      linkedin: extractSocialUrl(html, 'linkedin.com'),
    },
    custom: {},
    meta: {},
  };
}

function extractSocialUrl(html, domain) {
  const pattern = new RegExp(`https?://(?:www\\.)?${domain.replace('.', '\\.')}[^"'\\s>]+`, 'i');
  const match = html.match(pattern);
  return match ? match[0] : undefined;
}