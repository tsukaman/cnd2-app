import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';
import { PrairieProfileExtractor } from '@/lib/prairie-profile-extractor';

/**
 * Prairie Card API endpoint
 * Fetches and parses Prairie Card HTML
 */
export const POST = withApiMiddleware(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { url, html } = body;

    if (!url && !html) {
      throw new ApiError(
        'URL or HTML content is required',
        ApiErrorCode.VALIDATION_ERROR,
        400
      );
    }

    let htmlContent = html;
    
    if (url && !html) {
      // Validate URL
      const urlObj = new URL(url);
      const allowedHosts = ['prairie.cards', 'my.prairie.cards'];
      
      if (!allowedHosts.includes(urlObj.hostname)) {
        throw new ApiError(
          'Invalid Prairie Card URL',
          ApiErrorCode.VALIDATION_ERROR,
          400
        );
      }

      // Fetch HTML from URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CND2/2.0 PrairieCardParser',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new ApiError(
          `Failed to fetch Prairie Card: ${response.status}`,
          ApiErrorCode.EXTERNAL_SERVICE_ERROR,
          502
        );
      }

      htmlContent = await response.text();
    }

    // Parse the HTML content
    const profile = PrairieProfileExtractor.extractMinimal(htmlContent);

    if (!profile) {
      throw new ApiError(
        'Failed to parse Prairie Card',
        ApiErrorCode.PARSE_ERROR,
        422
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('[Prairie API] Error:', error);
    throw new ApiError(
      'Failed to process Prairie Card',
      ApiErrorCode.INTERNAL_ERROR,
      500
    );
  }
});

// Handle OPTIONS for CORS
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