import { NextRequest, NextResponse } from 'next/server';
import { validateDiagnosisRequest } from '@/lib/validators/diagnosis';
import { ApiError } from '@/lib/api-errors';
import { getCorsHeaders } from '@/lib/cors';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // リクエストの検証
    const body = await request.json();
    const validatedData = validateDiagnosisRequest(body);
    
    // 診断エンジンの実行（動的インポート）
    const { DiagnosisEngine } = await import('@/lib/diagnosis-engine-v2');
    const engine = new DiagnosisEngine();
    const result = await engine.diagnose(validatedData);
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Diagnosis API error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}