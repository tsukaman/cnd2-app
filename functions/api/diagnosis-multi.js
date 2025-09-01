/**
 * Multi-style Diagnosis API for Cloudflare Functions
 * Generates AI-powered compatibility diagnosis in multiple styles simultaneously
 */

import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { generateId } from '../utils/id.js';
import { generateAstrologicalDiagnosis } from './diagnosis-v4-openai.js';
import { sanitizer } from '../utils/sanitizer.js';

// Diagnosis style configurations
const DIAGNOSIS_STYLES = ['creative', 'astrological', 'fortune', 'technical'];
const DIAGNOSIS_STYLES_SET = new Set(DIAGNOSIS_STYLES);

// Fallback configuration
const FALLBACK_CONFIG = {
  // 開発環境でフォールバックを許可するか
  ALLOW_IN_DEVELOPMENT: false,
  
  // フォールバック時のスコア範囲（開発環境では低めに設定）
  DEVELOPMENT_SCORE: {
    MIN: 30,
    MAX: 40,
    RANGE: 10
  },
  
  // 本番環境のスコア範囲（ユーザー体験を維持）
  PRODUCTION_SCORE: {
    MIN: 85,
    MAX: 100,
    RANGE: 15
  },
  
  // フォールバック時の識別子
  ID_PREFIX: 'fallback-',
  
  // フォールバック時の警告メッセージ
  WARNING_MESSAGE: {
    DEVELOPMENT: '⚠️ フォールバック診断が動作しています。OpenAI APIキーを確認してください。',
    PRODUCTION: ''  // 本番環境では表示しない
  },
  
  // フォールバック時のメタデータ
  METADATA: {
    engine: 'fallback',
    model: 'mock',
    warning: 'This is a fallback diagnosis result'
  }
};

/**
 * Handle POST requests to generate multi-style diagnosis
 * @param {Object} context - Cloudflare Workers context
 * @param {Request} context.request - The incoming request
 * @param {Object} context.env - Environment bindings including KV namespace
 * @returns {Promise<Response>} The response with multi-style diagnosis results
 */
export async function onRequestPost({ request, env }) {
  const logger = createLogger(env);
  const origin = request.headers.get('origin');
  const corsHeaders = { ...getCorsHeaders(origin), ...getSecurityHeaders() };
  
  return await logRequest(request, env, null, async () => {
    try {
      const body = await request.json();
      let { profiles, mode = 'duo', styles = DIAGNOSIS_STYLES } = body;
      
      // Sanitize profiles to prevent XSS
      if (profiles && Array.isArray(profiles)) {
        profiles = sanitizer.sanitizeObject(profiles);
      }
      
      // Validation
      if (!profiles || !Array.isArray(profiles)) {
        logger.warn('Invalid request: profiles array is required');
        return errorResponse(
          new Error('Profiles array is required'),
          400,
          corsHeaders
        );
      }
      
      if (mode === 'duo' && profiles.length !== 2) {
        logger.warn('Invalid request: duo mode requires exactly 2 profiles', { 
          profileCount: profiles.length 
        });
        return errorResponse(
          new Error('Duo mode requires exactly 2 profiles'),
          400,
          corsHeaders
        );
      }
      
      if (mode === 'group' && (profiles.length < 3 || profiles.length > 10)) {
        logger.warn('Invalid request: group mode requires 3-10 profiles', { 
          profileCount: profiles.length 
        });
        return errorResponse(
          new Error('Group mode requires 3-10 profiles'),
          400,
          corsHeaders
        );
      }
      
      // Validate styles using Set for better performance
      const validStyles = styles.filter(s => DIAGNOSIS_STYLES_SET.has(s));
      
      if (validStyles.length === 0) {
        logger.warn('Invalid request: at least one valid style is required');
        return errorResponse(
          new Error('At least one valid style is required'),
          400,
          corsHeaders
        );
      }
      
      logger.info('Generating multi-style diagnosis', { 
        mode, 
        participantCount: profiles.length,
        styles: validStyles 
      });
      
      const startTime = Date.now();
      
      // Generate diagnosis for each style in parallel
      const diagnosisPromises = validStyles.map(async (style) => {
        try {
          let result;
          
          // Use V4 OpenAI engine for all styles
          // Different styles will be handled by the engine based on DIAGNOSIS_STYLE
          result = await generateAstrologicalDiagnosis(profiles, mode, {
            ...env,
            DIAGNOSIS_STYLE: style
          });
          
          // Ensure result has an ID
          if (!result.id) {
            result.id = generateId();
          }
          
          return { style, result };
        } catch (error) {
          logger.error(`Failed to generate ${style} diagnosis`, error);
          // Return a fallback result on error
          return {
            style,
            result: generateFallbackResult(profiles, mode, style, env)
          };
        }
      });
      
      // Execute all diagnoses in parallel
      const results = await Promise.all(diagnosisPromises);
      const processingTime = Date.now() - startTime;
      
      // Generate comparison summary
      const summary = generateComparisonSummary(results);
      
      logger.info('Multi-style diagnosis completed', {
        processingTimeMs: processingTime,
        stylesGenerated: results.length
      });
      
      return successResponse(
        {
          multiResults: results,
          summary,
          metadata: {
            stylesRequested: validStyles,
            processingTimeMs: processingTime,
            mode
          }
        },
        corsHeaders
      );
    } catch (error) {
      // Enhanced error handling with specific error types
      if (error.name === 'ValidationError' || error.message.includes('validation')) {
        logger.warn('Validation error in multi-style diagnosis', error);
        return errorResponse(error, 400, corsHeaders);
      } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        logger.error('Timeout error in multi-style diagnosis', error);
        return errorResponse(new Error('Request timeout'), 408, corsHeaders);
      } else {
        logger.error('Multi-style diagnosis generation failed', error);
        return errorResponse(new Error('Internal server error'), 500, corsHeaders);
      }
    }
  });
}

/**
 * Generate a fallback result when diagnosis fails
 */
function generateFallbackResult(profiles, mode, style, env) {
  const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
  const scoreRange = isDevelopment 
    ? FALLBACK_CONFIG.DEVELOPMENT_SCORE 
    : FALLBACK_CONFIG.PRODUCTION_SCORE;
  
  const compatibility = Math.floor(Math.random() * scoreRange.RANGE) + scoreRange.MIN;
  
  // 開発環境で警告をログ出力
  if (isDevelopment) {
    console.warn(`[${style}] ${FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT}`);
  }
  
  const styleMessages = {
    creative: 'クリエイティブな相性を分析中...',
    astrological: '星々の配置を読み取っています...',
    fortune: '運命の糸を辿っています...',
    technical: '技術的な相性を計算中...'
  };
  
  // 開発環境では型を明確にフォールバックとわかるようにする
  const typePrefix = isDevelopment ? '[FALLBACK] ' : '';
  
  return {
    id: isDevelopment ? `${FALLBACK_CONFIG.ID_PREFIX}${generateId()}` : generateId(),
    mode,
    type: typePrefix + `${style}診断`,
    compatibility,
    summary: (isDevelopment ? '[FALLBACK] ' : '') + (styleMessages[style] || '診断を生成中...'),
    strengths: ['強い協調性', '補完的なスキル', '共通の価値観'],
    opportunities: ['新しいプロジェクトの可能性', '技術交流の機会', '成長の余地'],
    advice: '素晴らしい相性です。お互いの強みを活かして協力しましょう。',
    participants: profiles,
    createdAt: new Date().toISOString(),
    ...(isDevelopment ? { metadata: FALLBACK_CONFIG.METADATA } : {}),
    ...(isDevelopment ? { warning: FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT } : {})
  };
}

/**
 * Generate a summary comparing all style results
 */
function generateComparisonSummary(results) {
  const compatibilities = results.map(r => ({
    style: r.style,
    score: r.result.compatibility || r.result.overallCompatibility || 0
  }));
  
  const bestStyle = compatibilities.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  const averageScore = Math.round(
    compatibilities.reduce((sum, c) => sum + c.score, 0) / compatibilities.length
  );
  
  return {
    bestStyle: bestStyle.style,
    bestScore: bestStyle.score,
    averageScore,
    allScores: compatibilities,
    recommendation: getRecommendation(bestStyle.style, bestStyle.score)
  };
}

/**
 * Get recommendation based on style and score
 */
function getRecommendation(style, score) {
  const recommendations = {
    creative: `クリエイティブな視点で${score}%の相性！予想外の化学反応が期待できます。`,
    astrological: `星々の配置が示す相性は${score}%！宇宙のエネルギーが二人を結びつけています。`,
    fortune: `本日の相性運は${score}点！素晴らしい結果が出ています。`,
    technical: `技術的な観点から分析した相性は${score}%。データが示す確かな相性です。`
  };
  
  return recommendations[style] || `相性度は${score}%です。`;
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