import { NextRequest, NextResponse } from 'next/server';
import { PrairieCardParser } from '@/lib/prairie-card-parser';
import { ApiError } from '@/lib/api-errors';
import { getCorsHeaders } from '@/lib/cors';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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
    
    return NextResponse.json(
      {
        success: true,
        data: prairieData,
        timestamp: new Date().toISOString(),
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    logger.error('Prairie API error', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { 
          status: error.statusCode,
          headers: corsHeaders,
        }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to parse Prairie Card' },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}