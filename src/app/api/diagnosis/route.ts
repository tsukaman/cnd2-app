import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisEngine } from '@/lib/diagnosis-engine';
import { PrairieProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { profiles, mode } = await request.json();
    
    // バリデーション
    if (!profiles || !Array.isArray(profiles)) {
      return NextResponse.json(
        { error: 'プロフィール情報が不正です' },
        { status: 400 }
      );
    }

    if (mode === 'duo' && profiles.length !== 2) {
      return NextResponse.json(
        { error: '2人診断には2つのプロフィールが必要です' },
        { status: 400 }
      );
    }

    if (mode === 'group' && (profiles.length < 3 || profiles.length > 6)) {
      return NextResponse.json(
        { error: 'グループ診断は3-6人で実施してください' },
        { status: 400 }
      );
    }

    const engine = DiagnosisEngine.getInstance();
    
    let result;
    if (mode === 'duo') {
      result = await engine.generateDuoDiagnosis(profiles as [PrairieProfile, PrairieProfile]);
    } else {
      result = await engine.generateGroupDiagnosis(profiles);
    }
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[API] 診断エラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '診断の生成に失敗しました';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}