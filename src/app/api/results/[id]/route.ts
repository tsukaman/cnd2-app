import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisResult } from '@/types';
import { logger } from '@/lib/logger';

// レート制限の設定
const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1分間
  MAX_REQUESTS: 30  // 結果取得は診断より緩い制限
};

/**
 * 診断結果取得API
 * KVストレージから診断結果を取得して返す
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '結果IDが指定されていません' },
        { status: 400 }
      );
    }

    // Cloudflare KVから結果を取得（本番環境）
    if (process.env.NODE_ENV === 'production' && global.DIAGNOSIS_KV) {
      try {
        // レート制限チェック（Cloudflare環境のみ）
        const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitKey = `rate:results:${clientIP}`;
        
        // 現在のリクエスト数を取得
        const currentRequests = await global.DIAGNOSIS_KV.get(rateLimitKey);
        const requestCount = currentRequests ? parseInt(currentRequests, 10) : 0;
        
        if (requestCount >= RATE_LIMIT.MAX_REQUESTS) {
          logger.warn(`[Results API] Rate limit exceeded for IP ${clientIP}`);
          return NextResponse.json(
            { 
              success: false, 
              error: 'リクエスト数が制限を超えています。少し時間をおいてから再度お試しください。' 
            },
            { status: 429 }
          );
        }
        
        // リクエスト数を増加（TTL付き）
        await global.DIAGNOSIS_KV.put(
          rateLimitKey,
          String(requestCount + 1),
          { expirationTtl: Math.floor(RATE_LIMIT.WINDOW_MS / 1000) }
        );
        
        const result = await global.DIAGNOSIS_KV.get(id, 'json') as DiagnosisResult | null;
        
        if (!result) {
          return NextResponse.json(
            { success: false, error: '診断結果が見つかりません' },
            { status: 404 }
          );
        }

        logger.info(`[Results API] Retrieved result ${id} from KV`);
        
        // キャッシュヘッダーを設定（1時間のブラウザキャッシュ、2時間のCDNキャッシュ）
        const response = NextResponse.json({
          success: true,
          data: { result }
        });
        response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
        
        return response;
      } catch (kvError) {
        logger.error('[Results API] KV storage error:', kvError);
        throw kvError;
      }
    }

    // 開発環境用のモック結果
    if (process.env.NODE_ENV === 'development') {
      const mockResult: DiagnosisResult = {
        id,
        mode: 'duo',
        type: 'クラウドネイティブ達人',
        compatibility: 92,
        summary: '開発環境のモック診断結果です。素晴らしい相性で、クラウドネイティブの道を共に歩むパートナーとなるでしょう。',
        strengths: [
          'コンテナ技術への深い理解',
          'マイクロサービス設計の経験',
          'DevOps文化への共感'
        ],
        opportunities: [
          'セキュリティ分野の知識強化',
          'オブザーバビリティツールの活用',
          'チーム間コミュニケーション'
        ],
        advice: 'お互いの強みを活かしながら、クラウドネイティブの最前線で活躍してください。',
        participants: [],
        createdAt: new Date().toISOString(),
        aiPowered: true,
        fortuneScore: 88,
        fortuneGrade: 'daikichi' as const,
        fortuneMessage: '今日はコンテナが順調に起動する日',
        luckyColor: 'Kubernetes Blue',
        luckyItem: 'Helmチャート',
        luckyAction: 'kubectl apply -f happiness.yaml'
      };

      return NextResponse.json({
        success: true,
        data: { result: mockResult }
      });
    }

    // KVが利用できない場合
    return NextResponse.json(
      { success: false, error: '診断結果の取得機能は本番環境でのみ利用可能です' },
      { status: 503 }
    );

  } catch (error) {
    logger.error('[Results API] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '診断結果の取得中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

// Edge Runtimeで実行
export const runtime = 'edge';