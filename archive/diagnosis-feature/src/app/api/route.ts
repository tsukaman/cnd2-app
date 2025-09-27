import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiError } from '@/lib/api-errors';
import { ERROR_CODES } from '@/lib/constants/error-messages';
import { AstrologicalDiagnosisEngineV4 } from '@/lib/diagnosis-engine-v4-openai';
import { getCorsHeaders } from '@/lib/cors';
import { convertProfilesToFullFormat } from '@/lib/utils/profile-converter';

/**
 * Diagnosis API endpoint
 * Generates AI-powered compatibility diagnosis
 */
export const POST = withApiMiddleware(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { profiles, mode = 'duo' } = body;

    if (!profiles || !Array.isArray(profiles)) {
      throw new ApiError(
        'Profiles array is required',
        ERROR_CODES.DIAGNOSIS_PROFILES_REQUIRED,
        400
      );
    }

    if (mode === 'duo' && profiles.length !== 2) {
      throw new ApiError(
        'Duo mode requires exactly 2 profiles',
        ERROR_CODES.DIAGNOSIS_MIN_PROFILES,
        400
      );
    }

    if (mode === 'group' && (profiles.length < 3 || profiles.length > 10)) {
      throw new ApiError(
        'Group mode requires 3-10 profiles',
        ERROR_CODES.DIAGNOSIS_MIN_PROFILES,
        400
      );
    }

    // Convert profiles to PrairieProfile format using common utility
    const prairieProfiles = convertProfilesToFullFormat(profiles);

    // Generate diagnosis using the OpenAI v4 engine
    const engine = AstrologicalDiagnosisEngineV4.getInstance();
    const result = await engine.generateDuoDiagnosis(
      prairieProfiles[0],
      prairieProfiles[1]
    );

    return NextResponse.json(result);
  } catch (_error) {
    if (_error instanceof ApiError) {
      throw _error;
    }
    
    console.error('[Diagnosis API] Error:', _error);
    throw new ApiError(
      'Failed to generate diagnosis',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders as HeadersInit,
  });
}