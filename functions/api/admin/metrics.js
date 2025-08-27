// Admin Metrics API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../../utils/response.js';
import { createLogger } from '../../utils/logger.js';
import { METRICS_KEYS, safeParseInt } from '../../utils/constants.js';

export async function onRequestGet({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  try {
    logger.info('Fetching metrics data');
    
    // Check if KV is available
    if (!env.DIAGNOSIS_KV) {
      logger.warn('KV namespace not available for metrics');
      return errorResponse(
        new Error('Metrics storage not available'),
        503,
        corsHeaders
      );
    }
    
    // Fetch all metrics from KV
    const startTime = Date.now();
    const metricsData = {};
    const fetchErrors = [];
    
    // Fetch all metric keys in parallel
    const metricPromises = Object.entries(METRICS_KEYS).map(async ([key, kvKey]) => {
      try {
        const value = await env.DIAGNOSIS_KV.get(kvKey);
        metricsData[key] = safeParseInt(value, 0);
      } catch (error) {
        logger.debug(`Failed to fetch metric ${kvKey}`, { error: error.message });
        metricsData[key] = 0;
        fetchErrors.push({ key: kvKey, error: error.message });
      }
    });
    
    await Promise.all(metricPromises);
    
    // Log warning if there were partial failures
    if (fetchErrors.length > 0) {
      logger.warn('Some metrics failed to fetch', { 
        failedCount: fetchErrors.length, 
        totalCount: Object.keys(METRICS_KEYS).length,
        errors: fetchErrors 
      });
    }
    
    logger.metric('metrics_fetch_duration', Date.now() - startTime, 'ms', {
      keys: Object.keys(METRICS_KEYS).length,
    });
    
    // Calculate success rates
    const prairie = {
      success: metricsData.PRAIRIE_SUCCESS || 0,
      error: metricsData.PRAIRIE_ERROR || 0,
      successRate: 0,
    };
    
    const diagnosis = {
      success: metricsData.DIAGNOSIS_SUCCESS || 0,
      error: metricsData.DIAGNOSIS_ERROR || 0,
      successRate: 0,
    };
    
    const cache = {
      hit: metricsData.CACHE_HIT || 0,
      miss: metricsData.CACHE_MISS || 0,
      hitRate: 0,
    };
    
    // Calculate rates safely
    const prairieTotal = prairie.success + prairie.error;
    if (prairieTotal > 0) {
      prairie.successRate = prairie.success / prairieTotal;
    }
    
    const diagnosisTotal = diagnosis.success + diagnosis.error;
    if (diagnosisTotal > 0) {
      diagnosis.successRate = diagnosis.success / diagnosisTotal;
    }
    
    const cacheTotal = cache.hit + cache.miss;
    if (cacheTotal > 0) {
      cache.hitRate = cache.hit / cacheTotal;
    }
    
    const metrics = {
      prairie,
      diagnosis,
      cache,
      timestamp: new Date().toISOString(),
    };
    
    // Add warning if there were fetch errors
    if (fetchErrors.length > 0) {
      metrics.warning = `Partial data: ${fetchErrors.length} metrics could not be retrieved`;
    }
    
    logger.info('Metrics retrieved successfully', {
      prairieTotal,
      diagnosisTotal,
      cacheTotal,
      partialFailures: fetchErrors.length,
    });
    
    return successResponse(metrics, corsHeaders);
  } catch (error) {
    logger.error('Failed to fetch metrics', error);
    return errorResponse(error, 500, corsHeaders);
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Reset metrics endpoint (for admin use only)
export async function onRequestDelete({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  try {
    // Simple auth check (in production, use proper authentication)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
      logger.warn('Unauthorized metrics reset attempt');
      return errorResponse(
        new Error('Unauthorized'),
        401,
        corsHeaders
      );
    }
    
    logger.info('Resetting metrics data');
    
    if (!env.DIAGNOSIS_KV) {
      return errorResponse(
        new Error('Metrics storage not available'),
        503,
        corsHeaders
      );
    }
    
    // Reset all metrics to 0
    const resetPromises = Object.values(METRICS_KEYS).map(async (kvKey) => {
      try {
        await env.DIAGNOSIS_KV.put(kvKey, '0');
      } catch (error) {
        logger.debug(`Failed to reset metric ${kvKey}`, { error: error.message });
      }
    });
    
    await Promise.all(resetPromises);
    
    logger.info('Metrics reset successfully');
    
    return successResponse(
      {
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString(),
      },
      corsHeaders
    );
  } catch (error) {
    logger.error('Failed to reset metrics', error);
    return errorResponse(error, 500, corsHeaders);
  }
}