// @ts-check
// Diagnosis API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { generateId, validateId } from '../utils/id.js';
import { KV_TTL, safeParseInt, METRICS_KEYS } from '../utils/constants.js';
import { generateFortuneDiagnosis } from './diagnosis-v4-openai.js';
import { isDebugMode, getFilteredEnvKeys } from '../utils/debug-helpers.js';

/**
 * Handle POST requests to generate diagnosis
 * @param {Object} context - Cloudflare Workers context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment bindings including KV namespace
 * @returns {Promise<Response>} The response with diagnosis result or error
 */
export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  // デバッグ: 環境変数の初期状態を確認（DEBUG_MODEまたは開発環境でのみ出力）
  const debugMode = isDebugMode(env);
  if (debugMode) {
    const filteredKeys = getFilteredEnvKeys(env);
    logger.debug('[Diagnosis API] Environment Debug:', {
      envExists: !!env,
      envType: typeof env,
      openaiKeyExists: !!env?.OPENAI_API_KEY,
      availableKeys: filteredKeys.join(', ')
    });
  }
  
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
      const result = await generateFortuneDiagnosis(profiles, mode, env);
      
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
          aiPowered: result.aiPowered || false, // Use the actual aiPowered flag from result
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

// OpenAI APIを使用したAI診断エンジン（diagnosis-v4-openai.js）を使用