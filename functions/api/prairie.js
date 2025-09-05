// @ts-check
// Prairie Card API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { safeParseInt, METRICS_KEYS } from '../utils/constants.js';
import { parseFromHTML, validatePrairieCardUrl } from '../utils/prairie-parser.js';
import { createErrorResponse, ERROR_CODES } from '../utils/error-messages.js';

/**
 * Handle POST requests to scrape and parse Prairie Card data
 * Note: This is not an API but a web scraper for Prairie Card HTML pages
 * @param {Object} context - Cloudflare Workers context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment bindings
 * @returns {Promise<Response>} The response with Prairie Card data or error
 */
export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    let url, html;
    try {
      const data = await request.json();
      url = data.url;
      html = data.html;
      
      // Validation
      if (!url && !html) {
        logger.warn('Invalid request: missing URL or HTML');
        const errorResp = createErrorResponse(ERROR_CODES.PRAIRIE_URL_REQUIRED);
        return new Response(JSON.stringify(errorResp), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      // Simplified Prairie Card parsing for demo
      let prairieData;
      
      if (html) {
        // Parse from HTML
        logger.info('Parsing Prairie Card from HTML');
        prairieData = parseFromHTML(html, env);
      } else {
        // Validate URL before fetching
        if (!validatePrairieCardUrl(url)) {
          logger.warn('Invalid Prairie Card URL', { url });
          const errorResp = createErrorResponse(ERROR_CODES.PRAIRIE_INVALID_URL);
          return new Response(JSON.stringify(errorResp), {
            status: 400,
            headers: corsHeaders
          });
        }
        
        logger.info('Fetching Prairie Card', { url });
        const startFetch = Date.now();
        
        // Use AbortController for proper timeout handling and resource cleanup
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        let response;
        try {
          // Fetch and parse from URL with timeout
          response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CND2/1.0; +https://cnd2-app.pages.dev)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'ja,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
            },
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          const errorMessage = fetchError.name === 'AbortError' 
            ? 'Fetch timeout after 10s' 
            : fetchError.message;
          
          logger.error('Failed to fetch Prairie Card - Network error', fetchError, {
            url,
            error: errorMessage,
            type: fetchError.name === 'AbortError' ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
          });
          throw new Error(`Prairie Card scraping failed: ${errorMessage}. Please check if the URL is correct and accessible.`);
        } finally {
          clearTimeout(timeoutId);
        }
        
        logger.metric('prairie_fetch_duration', Date.now() - startFetch, 'ms', {
          url,
          status: response.status,
        });
        
        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'No error body');
          logger.error('Failed to fetch Prairie Card - HTTP error', null, {
            url,
            status: response.status,
            statusText: response.statusText,
            errorPreview: errorBody.substring(0, 200),
          });
          
          // Provide specific error messages based on status
          let errorMessage = `Prairie Card scraping failed (HTTP ${response.status})`;
          if (response.status === 404) {
            errorMessage = `Prairie Card not found. Please verify the URL: ${url}`;
          } else if (response.status === 403) {
            errorMessage = `Access denied to Prairie Card. The page may be private or blocked.`;
          } else if (response.status >= 500) {
            errorMessage = `Prairie Card server error (${response.status}). Please try again later.`;
          }
          
          throw new Error(errorMessage);
        }
        
        const html = await response.text();
        
        // Debug: Log first 500 chars of HTML
        logger.info('Prairie Card HTML fetched', {
          url,
          htmlLength: html.length,
          htmlPreview: html.substring(0, 500),
        });
        
        prairieData = parseFromHTML(html, env);
        
        logger.info('Prairie Card parsed successfully', {
          url,
          name: prairieData.basic?.name || 'No name found',
          hasSkills: prairieData.details?.skills?.length > 0,
          hasTags: prairieData.details?.tags?.length > 0,
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
          const metricsKey = METRICS_KEYS.PRAIRIE_SUCCESS;
          const currentCount = await env.DIAGNOSIS_KV.get(metricsKey);
          const count = safeParseInt(currentCount, 0);
          await env.DIAGNOSIS_KV.put(metricsKey, String(count + 1));
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
      logger.error('Prairie scraper error', error, {
        url: url || 'No URL',
        errorType: error.name,
        errorStack: error.stack,
      });
      
      // Track error metrics
      if (env.DIAGNOSIS_KV) {
        try {
          const metricsKey = METRICS_KEYS.PRAIRIE_ERROR;
          const currentCount = await env.DIAGNOSIS_KV.get(metricsKey);
          const count = safeParseInt(currentCount, 0);
          await env.DIAGNOSIS_KV.put(metricsKey, String(count + 1));
        } catch (e) {
          logger.debug('Failed to update error metrics', { error: e.message });
        }
      }
      
      // Determine appropriate error code based on error message
      let errorCode = ERROR_CODES.INTERNAL_ERROR;
      
      if (error.message.includes('timeout')) {
        errorCode = ERROR_CODES.PRAIRIE_TIMEOUT;
      } else if (error.message.includes('not found')) {
        errorCode = ERROR_CODES.PRAIRIE_NOT_FOUND;
      } else if (error.message.includes('Access denied')) {
        errorCode = ERROR_CODES.UNAUTHORIZED;
      } else if (error.message.includes('scraping failed')) {
        errorCode = ERROR_CODES.PRAIRIE_FETCH_FAILED;
      } else if (error.message.includes('Invalid')) {
        errorCode = ERROR_CODES.PRAIRIE_INVALID_URL;
      } else if (error.message.includes('parse')) {
        errorCode = ERROR_CODES.PRAIRIE_PARSE_FAILED;
      }
      
      const errorResp = createErrorResponse(errorCode, error.message);
      const statusCode = errorResp.error.code === ERROR_CODES.PRAIRIE_TIMEOUT ? 504 :
                        errorResp.error.code === ERROR_CODES.PRAIRIE_NOT_FOUND ? 404 :
                        errorResp.error.code === ERROR_CODES.UNAUTHORIZED ? 403 :
                        errorResp.error.code === ERROR_CODES.PRAIRIE_INVALID_URL ? 400 :
                        500;
      
      return new Response(JSON.stringify(errorResp), {
        status: statusCode,
        headers: corsHeaders
      });
    }
  });
}

/**
 * Handle OPTIONS requests for CORS preflight
 * @param {Object} context - Cloudflare Workers context
 * @param {Request} context.request - The incoming request
 * @returns {Response} CORS preflight response
 */
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}