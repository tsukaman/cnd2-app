// @ts-check
// Diagnosis API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { generateId, validateId } from '../utils/id.js';
import { KV_TTL, safeParseInt, METRICS_KEYS } from '../utils/constants.js';
import { generateAstrologicalDiagnosis } from './diagnosis-v4.js';

export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    try {
      const { profiles, mode } = await request.json();
      
      // Validation
      if (!profiles || !Array.isArray(profiles) || profiles.length < 2) {
        logger.warn('Invalid request: insufficient profiles', { 
          profileCount: profiles?.length || 0 
        });
        return errorResponse(
          new Error('At least 2 profiles are required'),
          400,
          corsHeaders
        );
      }
      
      logger.info('Generating diagnosis', { 
        mode, 
        participantCount: profiles.length 
      });
      
      // Generate diagnosis result using V4 engine
      const result = await generateAstrologicalDiagnosis(profiles, mode, env);
      
      // Store in KV if available
      if (env.DIAGNOSIS_KV) {
        const key = `diagnosis:${result.id}`;
        const startKV = Date.now();
        
        try {
          await env.DIAGNOSIS_KV.put(key, JSON.stringify(result), {
            expirationTtl: KV_TTL.DIAGNOSIS,
          });
          
          logger.metric('kv_write_duration', Date.now() - startKV, 'ms', {
            key,
            operation: 'put',
          });
          
          logger.info('Diagnosis stored in KV', { 
            id: result.id,
            ttl: '7days' 
          });
        } catch (kvError) {
          // Log but don't fail the request
          logger.error('Failed to store in KV', kvError, { id: result.id });
        }
      }
      
      return successResponse(
        {
          result,
          aiPowered: false, // Simplified version doesn't use AI
          cached: false,
        },
        corsHeaders
      );
    } catch (error) {
      logger.error('Diagnosis generation failed', error);
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

// 古いgenerateDiagnosis関数は削除され、diagnosis-v4.jsのgenerateAstrologicalDiagnosisに置き換えられました