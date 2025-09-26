// @ts-check
/**
 * X (Twitter) Profile API for Cloudflare Functions
 * embed API + Webスクレイピングのハイブリッド実装
 */

import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { createErrorResponse, ERROR_CODES } from '../utils/error-messages.js';
import { incrementMetrics, isDevelopment } from '../utils/kv-helpers.js';
import { fetchEmbedData, fetchTweetEmbeds } from '../utils/x-embed-api.js';
import { scrapeXProfile } from '../utils/x-scraper.js';
import { transformToXProfile } from '../utils/x-data-transformer.js';

/**
 * Handle POST requests to fetch X profile data
 * @param {Object} context - Cloudflare Workers context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment bindings
 * @returns {Promise<Response>} The response with X profile data or error
 */
export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };

  return await logRequest(request, env, null, async () => {
    try {
      const data = await request.json();
      const username = data.username?.replace(/^@/, ''); // Remove @ if present

      // Validation
      if (!username) {
        logger.warn('Invalid request: missing username');
        const errorResp = createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Username is required');
        return new Response(JSON.stringify(errorResp), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Validate username format with enhanced checks
      if (!/^[A-Za-z0-9_]{1,15}$/.test(username) ||
          username.startsWith('_') ||
          username.endsWith('_') ||
          username.includes('__')) {
        logger.warn('Invalid username format', { username });
        const errorResp = createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid username format: must be 1-15 characters, alphanumeric and underscore only, cannot start/end with underscore or have consecutive underscores'
        );
        return new Response(JSON.stringify(errorResp), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Check cache first
      const cacheKey = `x-profile:${username}`;
      const cached = await env.PROFILE_KV?.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for X profile', { username });
        return new Response(cached, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        });
      }

      logger.info('Fetching X profile', { username });

      // Parallel fetch from both sources
      const [embedResult, scrapeResult] = await Promise.allSettled([
        fetchEmbedData(username),
        scrapeXProfile(username, env)
      ]);

      // Log results
      logger.info('X profile fetch results', {
        username,
        embedSuccess: embedResult.status === 'fulfilled' && !!embedResult.value,
        scrapeSuccess: scrapeResult.status === 'fulfilled' && !!scrapeResult.value
      });

      // Handle errors
      if (embedResult.status === 'rejected' && scrapeResult.status === 'rejected') {
        logger.error('Both fetch methods failed', {
          username,
          embedError: embedResult.reason?.message,
          scrapeError: scrapeResult.reason?.message
        });

        const errorResp = createErrorResponse(
          ERROR_CODES.EXTERNAL_API_ERROR,
          `Failed to fetch profile for @${username}`
        );
        return new Response(JSON.stringify(errorResp), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Transform data to XProfile format
      const xProfile = transformToXProfile(
        username,
        embedResult.status === 'fulfilled' ? embedResult.value : null,
        scrapeResult.status === 'fulfilled' ? scrapeResult.value : null
      );

      // Check if profile is protected
      if (xProfile.basic.protected) {
        logger.info('Profile is protected', { username });
        const errorResp = createErrorResponse(
          ERROR_CODES.UNAUTHORIZED,
          `@${username} is a protected account`
        );
        return new Response(JSON.stringify(errorResp), {
          status: 403,
          headers: corsHeaders
        });
      }

      // Prepare response
      const responseData = {
        success: true,
        data: xProfile,
        cache: {
          hit: false,
          source: 'fetch',
          ttl: xProfile.metadata.cacheAge
        }
      };

      // Cache the result
      if (env.PROFILE_KV) {
        await env.PROFILE_KV.put(
          cacheKey,
          JSON.stringify(responseData),
          { expirationTtl: xProfile.metadata.cacheAge }
        );
      }

      // Track success metrics (production only)
      if (!isDevelopment(env)) {
        await incrementMetrics(env, 'X_PROFILE_SUCCESS');
      }

      return new Response(JSON.stringify(responseData), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${xProfile.metadata.cacheAge}`,
          'X-Cache': 'MISS'
        }
      });

    } catch (error) {
      logger.error('X profile API error', error, {
        errorType: error.name,
        errorStack: error.stack
      });

      // Track error metrics (production only)
      if (!isDevelopment(env)) {
        await incrementMetrics(env, 'X_PROFILE_ERROR');
      }

      const errorResp = createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'An error occurred while fetching the profile'
      );

      return new Response(JSON.stringify(errorResp), {
        status: 500,
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

/**
 * Handle GET requests - return API info
 * @returns {Response} API info response
 */
export async function onRequestGet() {
  return new Response(JSON.stringify({
    name: 'X Profile API',
    version: '1.0.0',
    description: 'Fetch X (Twitter) profiles using embed API and web scraping',
    endpoints: {
      POST: {
        '/api/x-profile': 'Fetch X profile by username'
      }
    }
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}