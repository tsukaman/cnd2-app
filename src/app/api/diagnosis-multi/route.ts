import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';
import { unifiedDiagnosisEngine, type DiagnosisStyle } from '@/lib/diagnosis-engine-unified';
import { PrairieProfile } from '@/types';
import { sanitizer } from '@/lib/sanitizer';

/**
 * Multi-style Diagnosis API endpoint
 * Generates AI-powered compatibility diagnosis in multiple styles simultaneously
 */
export const POST = withApiMiddleware(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { profiles, mode = 'duo', styles = ['creative', 'astrological', 'fortune', 'technical'] } = body;

    if (!profiles || !Array.isArray(profiles)) {
      throw new ApiError(
        'Profiles array is required',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
    }

    if (mode === 'duo' && profiles.length !== 2) {
      throw new ApiError(
        'Duo mode requires exactly 2 profiles',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
    }

    if (mode === 'group' && (profiles.length < 3 || profiles.length > 10)) {
      throw new ApiError(
        'Group mode requires 3-10 profiles',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Validate styles
    const validStyles: DiagnosisStyle[] = ['astrological', 'fortune', 'technical', 'creative'];
    const requestedStyles = styles.filter((s: string) => validStyles.includes(s as DiagnosisStyle)) as DiagnosisStyle[];
    
    if (requestedStyles.length === 0) {
      throw new ApiError(
        'At least one valid style is required',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Convert profiles to PrairieProfile format if needed with sanitization
    const prairieProfiles: PrairieProfile[] = profiles.map(p => {
      if (p.basic) {
        // Sanitize existing profile data
        return {
          ...p,
          basic: {
            ...p.basic,
            name: sanitizer.sanitizeHTML(p.basic.name || ''),
            title: sanitizer.sanitizeHTML(p.basic.title || ''),
            company: sanitizer.sanitizeHTML(p.basic.company || ''),
            bio: sanitizer.sanitizeHTML(p.basic.bio || '')
          }
        };
      }
      
      // Convert from minimal format with sanitization
      return {
        basic: {
          name: sanitizer.sanitizeHTML(p.name || '名称未設定'),
          title: sanitizer.sanitizeHTML(p.title || ''),
          company: sanitizer.sanitizeHTML(p.company || ''),
          bio: sanitizer.sanitizeHTML(p.bio || '')
        },
        details: {
          skills: (p.skills || []).map((s: string) => sanitizer.sanitizeHTML(s)),
          interests: (p.interests || []).map((i: string) => sanitizer.sanitizeHTML(i)),
          achievements: []
        },
        social: {},
        meta: {
          sourceUrl: p.sourceUrl || '',
          extractedAt: new Date().toISOString()
        }
      };
    });

    // Generate diagnosis in parallel for all requested styles
    const diagnosisPromises = requestedStyles.map((style: DiagnosisStyle) => {
      const diagnosisOptions = {
        style,
        model: 'gpt-4o-mini' as const,
        enableFortuneTelling: style === 'fortune'
      };

      if (mode === 'duo') {
        return unifiedDiagnosisEngine.generateDuoDiagnosis(
          prairieProfiles[0],
          prairieProfiles[1],
          diagnosisOptions
        ).then(result => ({ style, result }));
      } else {
        return unifiedDiagnosisEngine.generateGroupDiagnosis(
          prairieProfiles,
          diagnosisOptions
        ).then(result => ({ style, result }));
      }
    });

    // Execute all diagnoses in parallel
    const startTime = Date.now();
    const results = await Promise.all(diagnosisPromises);
    const processingTime = Date.now() - startTime;

    // Generate comparison summary
    const summary = generateComparisonSummary(results);

    return NextResponse.json({
      multiResults: results,
      summary,
      metadata: {
        stylesRequested: requestedStyles,
        processingTimeMs: processingTime,
        mode
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('[Multi-Diagnosis API] Error:', error);
    throw new ApiError(
      'Failed to generate multi-style diagnosis',
      ApiErrorCode.INTERNAL_ERROR,
      500
    );
  }
});

// Generate a summary comparing all style results
function generateComparisonSummary(results: Array<{ style: DiagnosisStyle; result: any }>) {
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

function getRecommendation(style: DiagnosisStyle, score: number): string {
  const recommendations: Record<DiagnosisStyle, string> = {
    creative: `クリエイティブな視点で${score}%の相性！予想外の化学反応が期待できます。`,
    astrological: `星々の配置が示す相性は${score}%！宇宙のエネルギーが二人を結びつけています。`,
    fortune: `本日の相性運は${score}点！素晴らしい結果が出ています。`,
    technical: `技術的な観点から分析した相性は${score}%。データが示す確かな相性です。`
  };

  return recommendations[style] || `相性度は${score}%です。`;
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
        ? '*' 
        : 'https://cnd2.cloudnativedays.jp',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}