/**
 * Multi-style Diagnosis API for Cloudflare Functions
 * Generates AI-powered compatibility diagnosis in multiple styles simultaneously
 */

import { errorResponse, successResponse, getCorsHeaders, getSecurityHeaders } from '../utils/response.js';
import { createLogger, logRequest } from '../utils/logger.js';
import { generateId } from '../utils/id.js';
import { generateAstrologicalDiagnosis } from './diagnosis-v4-openai.js';

// Diagnosis style configurations
const DIAGNOSIS_STYLES = ['creative', 'astrological', 'fortune', 'technical'];

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
      const { profiles, mode = 'duo', styles = DIAGNOSIS_STYLES } = body;
      
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
      
      // Validate styles
      const validStyles = styles.filter(s => DIAGNOSIS_STYLES.includes(s));
      
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
            result: generateFallbackResult(profiles, mode, style)
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
      logger.error('Multi-style diagnosis generation failed', error);
      return errorResponse(error, 500, corsHeaders);
    }
  });
}

/**
 * Generate a fallback result when diagnosis fails
 */
function generateFallbackResult(profiles, mode, style) {
  const compatibility = Math.floor(Math.random() * 15) + 85; // 85-100
  const id = generateId();
  
  const styleMessages = {
    creative: 'クリエイティブな相性を分析中...',
    astrological: '星々の配置を読み取っています...',
    fortune: '運命の糸を辿っています...',
    technical: '技術的な相性を計算中...'
  };
  
  return {
    id,
    mode,
    type: `${style}診断`,
    compatibility,
    summary: styleMessages[style] || '診断を生成中...',
    strengths: ['強い協調性', '補完的なスキル', '共通の価値観'],
    opportunities: ['新しいプロジェクトの可能性', '技術交流の機会', '成長の余地'],
    advice: '素晴らしい相性です。お互いの強みを活かして協力しましょう。',
    participants: profiles,
    createdAt: new Date().toISOString()
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