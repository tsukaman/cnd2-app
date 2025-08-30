// @ts-check
// Prairie Card API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { safeParseInt, METRICS_KEYS } from '../utils/constants.js';
import { parseFromHTML, validatePrairieCardUrl } from '../utils/prairie-parser.js';

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
        prairieData = parseFromHTML(html, env);
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
      logger.error('Prairie API error', error);
      
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