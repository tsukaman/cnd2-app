import { NextRequest, NextResponse } from 'next/server';
import { PrairieCardParser } from '@/lib/prairie-parser';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URLが指定されていません' },
        { status: 400 }
      );
    }

    const parser = PrairieCardParser.getInstance();
    const profile = await parser.parseProfile(url);
    
    return NextResponse.json({
      success: true,
      profile,
      cacheStats: parser.getCacheStats(),
    });
  } catch (error) {
    console.error('[API] Prairie Card取得エラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Prairie Cardの取得に失敗しました';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// キャッシュクリアのエンドポイント
export async function DELETE(request: NextRequest) {
  try {
    const parser = PrairieCardParser.getInstance();
    parser.clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'キャッシュをクリアしました',
    });
  } catch (error) {
    console.error('[API] キャッシュクリアエラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'キャッシュのクリアに失敗しました' 
      },
      { status: 500 }
    );
  }
}