import { NextRequest, NextResponse } from 'next/server';
import { ResultStorage } from '@/lib/result-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storage = ResultStorage.getInstance();
    const result = storage.getResult(params.id);
    
    if (!result) {
      return NextResponse.json(
        { 
          success: false,
          error: '診断結果が見つかりません' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[API] 結果取得エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '結果の取得に失敗しました' 
      },
      { status: 500 }
    );
  }
}