import { NextRequest, NextResponse } from 'next/server';
import { PrairieCardParser } from '@/lib/prairie-card-parser';

// Edge Runtimeを使用
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, html } = body;
    
    if (!url && !html) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either url or html must be provided',
        },
        { status: 400 }
      );
    }
    
    const parser = new PrairieCardParser();
    let prairieData;
    
    if (html) {
      // HTMLから直接解析
      prairieData = await parser.parseFromHTML(html);
    } else {
      // URLから取得して解析
      prairieData = await parser.parseFromURL(url);
    }
    
    return NextResponse.json({
      success: true,
      data: prairieData,
    });
  } catch (error) {
    console.error('[Prairie API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse Prairie Card',
        details: error instanceof Error ? error.message : 'Unknown error',
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