/**
 * Diagnosis API v3 - Simplified Prairie Card HTML Analysis
 * Prairie CardのHTML全体をAIに渡して診断を行う新しいアプローチ
 */

import { NextRequest, NextResponse } from 'next/server';
import SimplifiedDiagnosisEngine from '@/lib/diagnosis-engine-v3';
import { ErrorHandler, CND2Error } from '@/lib/errors';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // URLのバリデーション
    if (!body.urls || !Array.isArray(body.urls) || body.urls.length !== 2) {
      throw new CND2Error('2つのPrairie Card URLが必要です', 'INVALID_INPUT');
    }
    
    const urls = body.urls as [string, string];
    
    // URLの形式チェック
    for (const url of urls) {
      try {
        const parsed = new URL(url);
        // HTTPSのみ許可
        if (parsed.protocol !== 'https:') {
          throw new CND2Error('HTTPSのURLのみ対応しています', 'INVALID_URL');
        }
        // Prairie Card ドメインのチェック
        const validHosts = ['prairie.cards', 'my.prairie.cards'];
        const isValid = validHosts.includes(parsed.hostname) || 
                       parsed.hostname.endsWith('.prairie.cards');
        if (!isValid) {
          throw new CND2Error('Prairie CardのURLを指定してください', 'INVALID_PRAIRIE_URL');
        }
      } catch (error) {
        if (error instanceof CND2Error) throw error;
        throw new CND2Error('無効なURLです', 'INVALID_URL');
      }
    }
    
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
    
  } catch (error) {
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
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}