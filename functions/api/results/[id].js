// Results API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../../utils/response.js';
import { createLogger, logRequest } from '../../utils/logger.js';
import { validateId } from '../../utils/id.js';
import { safeParseInt, METRICS_KEYS } from '../../utils/constants.js';

export async function onRequestGet({ params, env, request }) {
  const logger = createLogger(env);
  const { id } = params;
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    try {
      logger.info('Fetching diagnosis result', { id });
      
      // Validate ID format
      if (!validateId(id)) {
        logger.warn('Invalid result ID format', { id });
        return errorResponse(
          new Error('Invalid result ID format'),
          400,
          corsHeaders
        );
      }
      
      // Fetch from KV if available
      if (env.DIAGNOSIS_KV) {
        const key = `diagnosis:${id}`;
        const startKV = Date.now();
        
        try {
          const data = await env.DIAGNOSIS_KV.get(key);
          
          logger.metric('kv_read_duration', Date.now() - startKV, 'ms', {
            key,
            operation: 'get',
            hit: !!data,
          });
          
          if (data) {
            const result = JSON.parse(data);
            
            logger.info('Result found in KV', { 
              id,
              createdAt: result.createdAt,
            });
            
            // Track cache hit metrics
            try {
              const metricsKey = METRICS_KEYS.CACHE_HIT;
              const currentCount = await env.DIAGNOSIS_KV.get(metricsKey);
              const count = safeParseInt(currentCount, 0);
              await env.DIAGNOSIS_KV.put(metricsKey, String(count + 1));
            } catch (e) {
              logger.debug('Failed to update cache hit metrics', { error: e.message });
            }
            
            return successResponse(
              {
                result,
                cache: {
                  hit: true,
                  source: 'kv',
                },
              },
              corsHeaders
            );
          }
          
          // Track cache miss metrics
          try {
            const metricsKey = METRICS_KEYS.CACHE_MISS;
            const currentCount = await env.DIAGNOSIS_KV.get(metricsKey);
            const count = safeParseInt(currentCount, 0);
            await env.DIAGNOSIS_KV.put(metricsKey, String(count + 1));
          } catch (e) {
            logger.debug('Failed to update cache miss metrics', { error: e.message });
          }
        } catch (kvError) {
          logger.error('KV read error', kvError, { id });
          // Continue to not found response
        }
      }
      
      // Not found
      logger.info('Result not found', { id });
      return errorResponse(
        new Error('Result not found'),
        404,
        corsHeaders
      );
    } catch (error) {
      logger.error('Results API error', error, { id });
      return errorResponse(error, 500, corsHeaders);
    }
  });
}

export async function onRequestPost({ params, env, request }) {
  const logger = createLogger(env);
  const { id } = params;
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    try {
      logger.info('Saving diagnosis result', { id });
      
      // Validate ID format
      if (!validateId(id)) {
        logger.warn('Invalid result ID format', { id });
        return errorResponse(
          new Error('Invalid result ID format'),
          400,
          corsHeaders
        );
      }
      
      // Parse request body
      let result;
      try {
        result = await request.json();
      } catch (parseError) {
        logger.error('Failed to parse request body', parseError);
        return errorResponse(
          new Error('Invalid JSON in request body'),
          400,
          corsHeaders
        );
      }
      
      // Ensure the result has an ID
      if (!result.id) {
        result.id = id;
      }
      
      // Save to KV if available
      if (env.DIAGNOSIS_KV) {
        const key = `diagnosis:${id}`;
        const startKV = Date.now();
        
        try {
          // Save with 7 days TTL (604800 seconds)
          const ttl = 60 * 60 * 24 * 7;
          await env.DIAGNOSIS_KV.put(
            key,
            JSON.stringify(result),
            { expirationTtl: ttl }
          );
          
          logger.metric('kv_write_duration', Date.now() - startKV, 'ms', {
            key,
            operation: 'put',
            ttl,
          });
          
          logger.info('Result saved to KV', { 
            id,
            ttl,
            size: JSON.stringify(result).length,
          });
          
          // Track save metrics
          try {
            const metricsKey = METRICS_KEYS.TOTAL_SAVES || 'metrics:total_saves';
            const currentCount = await env.DIAGNOSIS_KV.get(metricsKey);
            const count = safeParseInt(currentCount, 0);
            await env.DIAGNOSIS_KV.put(metricsKey, String(count + 1));
          } catch (e) {
            logger.debug('Failed to update save metrics', { error: e.message });
          }
          
          return successResponse(
            {
              message: 'Result saved successfully',
              id,
              storage: 'kv',
              ttl,
            },
            corsHeaders
          );
        } catch (kvError) {
          logger.error('KV write error', kvError, { id });
          return errorResponse(
            new Error('Failed to save result to storage'),
            500,
            corsHeaders
          );
        }
      }
      
      // KV not available (development mode)
      logger.info('KV not available, returning success for development', { id });
      return successResponse(
        {
          message: 'Result saved successfully (local only)',
          id,
          storage: 'local',
        },
        corsHeaders
      );
    } catch (error) {
      logger.error('Results API save error', error, { id });
      return errorResponse(error, 500, corsHeaders);
    }
  });
}

export async function onRequestDelete({ params, env, request }) {
  const logger = createLogger(env);
  const { id } = params;
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    try {
      logger.info('Deleting diagnosis result', { id });
      
      // Validate ID format
      if (!validateId(id)) {
        logger.warn('Invalid result ID format', { id });
        return errorResponse(
          new Error('Invalid result ID format'),
          400,
          corsHeaders
        );
      }
      
      // Delete from KV if available
      if (env.DIAGNOSIS_KV) {
        const key = `diagnosis:${id}`;
        const startKV = Date.now();
        
        try {
          await env.DIAGNOSIS_KV.delete(key);
          
          logger.metric('kv_delete_duration', Date.now() - startKV, 'ms', {
            key,
            operation: 'delete',
          });
          
          logger.info('Result deleted from KV', { id });
        } catch (kvError) {
          logger.error('KV delete error', kvError, { id });
          // Continue with success response anyway
        }
      }
      
      return successResponse(
        {
          message: 'Result deleted successfully',
          id,
        },
        corsHeaders
      );
    } catch (error) {
      logger.error('Results API delete error', error, { id });
      return errorResponse(error, 500, corsHeaders);
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