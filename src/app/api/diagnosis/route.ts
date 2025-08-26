import { NextRequest, NextResponse } from 'next/server';
import { validateDiagnosisRequest } from '@/lib/validators/diagnosis';
import { DiagnosisEngine } from '@/lib/diagnosis-engine-v2';

// Edge Runtimeを使用
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // リクエストのバリデーション
    const validatedData = validateDiagnosisRequest(body);
    
    // 診断エンジンの実行
    const engine = new DiagnosisEngine();
    const result = await engine.diagnose(validatedData);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Diagnosis API] Error:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.message,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process diagnosis',
      },
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