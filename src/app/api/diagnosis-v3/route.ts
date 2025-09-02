/**
 * Diagnosis API v3 - Simplified Prairie Card HTML Analysis
 * Prairie CardのHTML全体をAIに渡して診断を行う新しいアプローチ
 */

import { NextRequest, NextResponse } from 'next/server';
import SimplifiedDiagnosisEngine from '@/lib/diagnosis-engine-v3';
import { ErrorHandler, CND2Error } from '@/lib/errors';
import { validateMultiplePrairieUrls } from '@/lib/validators/prairie-url-validator';

// Node.js runtimeを使用（OpenAI SDKのため）
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // URLのバリデーション
    if (!body.urls || !Array.isArray(body.urls) || body.urls.length !== 2) {
      throw new CND2Error('2つのPrairie Card URLが必要です', 'INVALID_INPUT');
    }
    
    const urls = body.urls as [string, string];
    
    // URLの形式チェック（強化されたHTTPS検証とドメイン検証）
    const validationResult = validateMultiplePrairieUrls(urls);
    
    if (!validationResult.allValid) {
      // 最初のエラーメッセージを取得して詳細なエラーを返す
      const errorMessage = validationResult.errors[0] || 'Prairie Card URLの検証に失敗しました';
      throw new CND2Error(errorMessage, 'INVALID_PRAIRIE_URL');
    }
    
    // 正規化されたURLを使用（オプション）
    // const normalizedUrls = validationResult.results
      .map(r => r.normalizedUrl)
      .filter((url): url is string => url !== undefined);
    
    // 診断エンジンのインスタンスを取得
    const engine = SimplifiedDiagnosisEngine.getInstance();
    
    // APIキーがない場合のチェック
    if (!engine.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'OpenAI APIキーが設定されていません',
          code: 'API_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    console.log('[API] Diagnosis v3 request:', {
      urls,
      timestamp: new Date().toISOString()
    });
    
    // 診断を実行
    const result = await engine.generateDuoDiagnosis(urls);
    
    console.log('[API] Diagnosis v3 success:', {
      id: result.id,
      type: result.type,
      score: result.score
    });
    
    // 成功レスポンス
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (_error) {
    console.error('[API] Diagnosis v3 error:', error);
    
    const handledError = ErrorHandler.mapError(error);
    ErrorHandler.logError(handledError);
    
    return NextResponse.json(
      { 
        error: handledError.message,
        code: handledError.code
      },
      { status: 500 }
    );
  }
}

// OPTIONS リクエストへの対応（CORS）
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