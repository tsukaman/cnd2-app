import { NextRequest, NextResponse } from 'next/server';
import { PrairieCardParser } from '@/lib/prairie-card-parser';
import { ApiError } from '@/lib/api-errors';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { url, html } = await request.json();
    
    if (!url && !html) {
      throw ApiError.validation('URL or HTML content is required');
    }
    
    const parser = new PrairieCardParser();
    let prairieData;
    
    if (html) {
      // HTMLから直接パース
      prairieData = await parser.parseFromHTML(html);
    } else {
      // URLから取得してパース
      prairieData = await parser.parseFromURL(url);
    }
    
    return NextResponse.json({
      success: true,
      data: prairieData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Prairie API error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to parse Prairie Card' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://cnd2-app.pages.dev';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}