// Results API for Cloudflare Functions
import { getCorsHeaders } from '../utils/response.js';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '../utils/error-messages.js';
import { kvGet, kvPut, isDevelopment } from '../utils/kv-helpers.js';

/**
 * GET handler for fetching diagnosis results
 * @param {Object} context - Cloudflare Pages function context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment variables and bindings
 * @returns {Response} The diagnosis result or error response
 */
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Get ID from query parameter
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      const errorResp = createErrorResponse(ERROR_CODES.RESULT_INVALID_ID);
      return new Response(
        JSON.stringify(errorResp),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    const key = `diagnosis:${id}`;
    let data;
    
    if (isDevelopment(env)) {
      // Development: Fetch from in-memory storage
      if (global.devDiagnosisStorage && global.devDiagnosisStorage.has(key)) {
        data = global.devDiagnosisStorage.get(key);
      }
    } else {
      // Production: Fetch from KV
      data = await kvGet(env, key);
    }
    
    if (data) {
      try {
        const result = JSON.parse(data);
        
        // データの基本的な検証（より具体的な検証）
        if (!result || typeof result !== 'object' || !result.id) {
          throw new Error('Invalid DiagnosisResult format: missing required fields');
        }
          
          const successResp = createSuccessResponse({
            result,
            cache: {
              hit: true,
              source: 'kv',
            },
          });
          return new Response(
            JSON.stringify(successResp),
            {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=7200',
                ...corsHeaders,
              },
            }
          );
      } catch (parseError) {
        console.error('Failed to parse KV data:', parseError, { 
          id, 
          dataLength: data?.length, 
          dataPreview: data?.substring(0, 50) // 機密情報露出リスクを低減
        });
        // 破損データの場合は404として扱う
        const errorResp = createErrorResponse(ERROR_CODES.RESULT_NOT_FOUND, 'Result data is corrupted');
        return new Response(
          JSON.stringify(errorResp),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    // Not found
    const notFoundResp = createErrorResponse(ERROR_CODES.RESULT_NOT_FOUND);
    return new Response(
      JSON.stringify(notFoundResp),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Results GET API error:', error);
    
    const errorResp = createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch result');
    return new Response(
      JSON.stringify(errorResp),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * POST handler for saving diagnosis results
 * @param {Object} context - Cloudflare Pages function context
 * @param {Request} context.request - The incoming request with diagnosis result
 * @param {Object} context.env - Environment variables and bindings
 * @returns {Response} Success confirmation or error response
 * 
 * @typedef {Object} DiagnosisResult
 * @property {string} id - Unique identifier for the diagnosis
 * @property {string} mode - Diagnosis mode (duo/group)
 * @property {number} compatibility - Compatibility score
 * @property {Object} [participants] - Participant profiles
 */
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    const body = await request.json();
    
    // データ構造の正規化: { id, result } または直接DiagnosisResultを受け入れる
    let diagnosisResult;
    let resultId;
    
    if (body && body.result && body.id) {
      // クライアントから { id, result } 形式で送信された場合
      diagnosisResult = body.result;
      resultId = body.id;
    } else if (body && body.id) {
      // 直接DiagnosisResultが送信された場合
      diagnosisResult = body;
      resultId = body.id;
    } else {
      const errorResp = createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid result data');
      return new Response(
        JSON.stringify(errorResp),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Store result based on environment
    if (!isDevelopment(env)) {
      // Production: Store in KV - 診断結果のみを保存（二重構造を避ける）
      const key = `diagnosis:${resultId}`;
      await kvPut(env, key, JSON.stringify(diagnosisResult), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
      });
      
      const successResp = createSuccessResponse({
        id: resultId,
        message: 'Result stored successfully',
        storage: 'kv'
      });
      return new Response(
        JSON.stringify(successResp),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } else {
      // Development: Use in-memory storage (temporary solution)
      // Note: This is for development only and will be lost on server restart
      if (!global.devDiagnosisStorage) {
        global.devDiagnosisStorage = new Map();
      }
      
      const key = `diagnosis:${resultId}`;
      global.devDiagnosisStorage.set(key, JSON.stringify(diagnosisResult));
      
      // Clean up old entries (keep only last 80 when size exceeds 100)
      if (global.devDiagnosisStorage.size > 100) {
        const keys = Array.from(global.devDiagnosisStorage.keys());
        const deleteCount = keys.length - 80; // 80件まで削減
        keys.slice(0, deleteCount).forEach(key => 
          global.devDiagnosisStorage.delete(key)
        );
      }
      
      const successResp = createSuccessResponse({
        id: resultId,
        message: 'Result stored successfully (dev mode: in-memory)',
        storage: 'memory'
      });
      return new Response(
        JSON.stringify(successResp),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error) {
    console.error('Results API error:', error);
    
    const errorResp = createErrorResponse(ERROR_CODES.STORAGE_SAVE_FAILED, 'Failed to store result');
    return new Response(
      JSON.stringify(errorResp),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

