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
      
      // 開発環境用のモックデータ
      if (process.env.NODE_ENV === 'development') {
        const mockProfiles: Record<string, any> = {
          'taro': {
            basic: {
              name: '田中太郎',
              bio: 'クラウドネイティブエンジニア',
              company: 'CloudTech Inc.',
              location: '東京',
              twitter: 'taro_cloud'
            },
            interests: ['Kubernetes', 'Docker', 'CI/CD', 'TypeScript', 'React'],
            hashtags: ['#CloudNative', '#DevOps'],
            links: [{ name: 'GitHub', url: 'https://github.com/taro' }]
          },
          'hanako': {
            basic: {
              name: '山田花子',
              bio: 'SREエンジニア',
              company: 'DevOps Solutions',
              location: '大阪',
              twitter: 'hanako_sre'
            },
            interests: ['Prometheus', 'Grafana', 'Terraform', 'Go', 'Python'],
            hashtags: ['#SRE', '#Monitoring'],
            links: [{ name: 'Blog', url: 'https://blog.hanako.dev' }]
          }
        };
        
        const userId = urlObj.pathname.split('/').pop();
        const mockProfile = mockProfiles[userId || ''] || mockProfiles['taro'];
        
        return NextResponse.json({
          data: mockProfile
        });
      }

      // Fetch HTML from URL with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'CND2/2.0 PrairieCardParser',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new ApiError(
            `Failed to fetch Prairie Card: ${response.status}`,
            ApiErrorCode.EXTERNAL_SERVICE_ERROR,
            502
          );
        }

        htmlContent = await response.text();
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError(
            'Prairie Card fetch timeout',
            ApiErrorCode.EXTERNAL_SERVICE_ERROR,
            504
          );
        }
        throw error;
      }
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

    return NextResponse.json({ data: profile });
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