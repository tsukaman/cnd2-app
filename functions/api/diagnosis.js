// @ts-check
// Diagnosis API for Cloudflare Functions
import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { generateId, validateId } from '../utils/id.js';
import { KV_TTL, safeParseInt, METRICS_KEYS } from '../utils/constants.js';
import { generateFortuneDiagnosis } from './diagnosis-v4-openai.js';
import { isDebugMode, getFilteredEnvKeys, getSafeKeyInfo } from '../utils/debug-helpers.js';
import { convertProfilesToFullFormat } from '../utils/profile-converter.js';

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
  
  // デバッグモードの判定
  const debugMode = isDebugMode(env);
  
  // APIキー未設定時のエラーと詳細デバッグ
  if (!env?.OPENAI_API_KEY) {
    console.error('[Diagnosis API] OpenAI API key is not configured');
    
    // APIキー未設定時でもデバッグモードなら環境情報を出力
    if (debugMode) {
      const filteredKeys = getFilteredEnvKeys(env);
      console.error('[Diagnosis API] === DEBUG MODE (No API Key) ===');
      console.error('[Diagnosis API] Environment debug:', {
        keyStatus: 'missing',
        envCount: Object.keys(env || {}).length,
        availableEnvKeys: filteredKeys.slice(0, 5).join(', '),
        hasKVNamespace: !!env?.DIAGNOSIS_KV
      });
    }
  } else if (debugMode) {
    // APIキーが設定されている場合のデバッグ情報（セキュリティを考慮）
    console.error('[Diagnosis API] === DEBUG MODE ===');
    console.error('[Diagnosis API] Environment status:', {
      keyStatus: 'configured',
      envCount: Object.keys(env || {}).length,
      hasRequiredVars: ['OPENAI_API_KEY', 'DIAGNOSIS_KV'].every(k => !!env?.[k])
    });
    
    // 詳細な検証は開発環境のloggerでのみ（本番では出力されない）
    if (logger.debug) {
      const keyInfo = getSafeKeyInfo(env.OPENAI_API_KEY);
      logger.debug('[Diagnosis API] Key validation:', {
        format: keyInfo.format,
        hasWhitespace: keyInfo.hasWhitespace
      });
    }
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
      
      // Convert profiles to PrairieProfile format
      const prairieProfiles = convertProfilesToFullFormat(profiles);
      
      // Generate diagnosis result using V4 engine
      const result = await generateFortuneDiagnosis(prairieProfiles, mode, env);
      
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
      // より詳細なエラーメッセージを返す
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate diagnosis';
      return errorResponse(new Error(errorMessage), 500, corsHeaders);
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