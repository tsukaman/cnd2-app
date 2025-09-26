// @ts-check
// Diagnosis API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { generateId, validateId } from '../utils/id.js';
import { KV_TTL, safeParseInt, METRICS_KEYS } from '../utils/constants.js';
import { generateFortuneDiagnosis } from './diagnosis-v4-openai.js';
import { createSafeDebugLogger, getSafeKeyInfo, getFilteredEnvKeys } from '../utils/debug-helpers.js';
import { convertXProfilesToDiagnosisFormat } from '../utils/x-profile-converter.js';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '../utils/error-messages.js';
import { kvPut, isDevelopment } from '../utils/kv-helpers.js';

/**
 * Handle POST requests to generate diagnosis
 * @param {Object} context - Cloudflare Workers context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment bindings including KV namespace
 * @returns {Promise<Response>} The response with diagnosis result or error
 */
export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const debugLogger = createSafeDebugLogger(env, '[Diagnosis API]');
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  // APIキー未設定時のエラー
  if (!env?.OPENAI_API_KEY) {
    logger.error('OpenAI API key is not configured');
    
    // デバッグ情報は安全なロガーで出力
    debugLogger.error('Environment check failed:', {
      keyStatus: 'missing',
      envCount: Object.keys(env || {}).length,
      availableEnvKeys: getFilteredEnvKeys(env, 5),
      hasKVNamespace: !!env?.DIAGNOSIS_KV
    });
  } else {
    // APIキーが設定されている場合のデバッグ情報
    debugLogger.log('Environment status:', {
      keyStatus: 'configured',
      envCount: Object.keys(env || {}).length,
      hasRequiredVars: ['OPENAI_API_KEY', 'DIAGNOSIS_KV'].every(k => !!env?.[k]),
      keyInfo: getSafeKeyInfo(env.OPENAI_API_KEY)
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
        const errorResp = createErrorResponse(ERROR_CODES.DIAGNOSIS_MIN_PROFILES);
        return new Response(JSON.stringify(errorResp), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      logger.info('Generating diagnosis', { 
        mode, 
        participantCount: profiles.length 
      });
      
      // Convert XProfiles to diagnosis format
      const diagnosisProfiles = convertXProfilesToDiagnosisFormat(profiles);

      // Generate diagnosis result using V4 engine
      const result = await generateFortuneDiagnosis(diagnosisProfiles, mode, env);
      
      // Skip KV storage in development
      if (!isDevelopment(env)) {
        // Store in KV (production only)
        const key = `diagnosis:${result.id}`;
        const startKV = Date.now();
        
        try {
          const saved = await kvPut(env, key, JSON.stringify(result), {
            expirationTtl: KV_TTL.DIAGNOSIS,
          });
          
          if (saved) {
            logger.metric('kv_write_duration', Date.now() - startKV, 'ms', {
              key,
              operation: 'put',
            });
            
            logger.info('Diagnosis stored in KV', { 
              id: result.id,
              ttl: '7days' 
            });
          }
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
      const errorResp = createErrorResponse(
        ERROR_CODES.DIAGNOSIS_GENERATION_FAILED,
        error instanceof Error ? error.message : error
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

// OpenAI APIを使用したAI診断エンジン（diagnosis-v4-openai.js）を使用