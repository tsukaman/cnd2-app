import { NextRequest, NextResponse } from 'next/server';
// DiagnosisEngine is imported dynamically below
import { validateDiagnosisRequest } from '@/lib/validators/diagnosis';
import { ApiError } from '@/lib/api-errors';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // リクエストの検証
    const body = await request.json();
    const validatedData = validateDiagnosisRequest(body);
    
    // 診断エンジンの実行（新しいバージョンを使用）
    const { DiagnosisEngine: DiagnosisEngineV2 } = await import('@/lib/diagnosis-engine-v2');
    const engine = new DiagnosisEngineV2();
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}