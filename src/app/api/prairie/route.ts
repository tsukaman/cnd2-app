import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';
import { PrairieProfileExtractor } from '@/lib/prairie-profile-extractor';
import { PrairieProfile } from '@/types';
import { getCorsHeaders } from '@/lib/cors';
import { validatePrairieCardUrl } from '@/lib/validators/prairie-url-validator';
import { sanitizer } from '@/lib/sanitizer';

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
      // Enhanced URL validation using dedicated validator
      const validationResult = validatePrairieCardUrl(url);
      if (!validationResult.isValid) {
        throw new ApiError(
          validationResult.error || 'Invalid Prairie Card URL',
          ApiErrorCode.VALIDATION_ERROR,
          400
        );
      }
      
      // Use the normalized and sanitized URL
      const sanitizedUrl = sanitizer.sanitizeURL(validationResult.normalizedUrl || url);
      if (!sanitizedUrl) {
        throw new ApiError(
          'URL contains potentially dangerous content',
          ApiErrorCode.VALIDATION_ERROR,
          400
        );
      }
      
      const urlObj = new URL(sanitizedUrl);
      
      // 開発環境用のモックデータ
      if (process.env.NODE_ENV === 'development') {
        const mockProfiles: Record<string, PrairieProfile> = {
          'taro': {
            basic: {
              name: '田中太郎',
              title: 'クラウドネイティブエンジニア',
              company: 'CloudTech Inc.',
              bio: '東京在住のエンジニア'
            },
            details: {
              tags: ['#CloudNative', '#DevOps'],
              skills: ['Kubernetes', 'Docker', 'CI/CD'],
              interests: ['TypeScript', 'React'],
              certifications: [],
              communities: []
            },
            social: {
              twitter: 'taro_cloud',
              github: 'taro'
            },
            custom: {},
            meta: {
              isPartialData: false
            }
          },
          'hanako': {
            basic: {
              name: '山田花子',
              title: 'SREエンジニア',
              company: 'DevOps Solutions',
              bio: '大阪在住のSREエンジニア'
            },
            details: {
              tags: ['#SRE', '#Monitoring'],
              skills: ['Prometheus', 'Grafana', 'Terraform'],
              interests: ['Go', 'Python'],
              certifications: [],
              communities: []
            },
            social: {
              twitter: 'hanako_sre',
              website: 'https://blog.hanako.dev'
            },
            custom: {},
            meta: {
              isPartialData: false
            }
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
        const response = await fetch(sanitizedUrl, {
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
      } catch (_error) {
        clearTimeout(timeoutId);
        
        if (_error instanceof Error && _error.name === 'AbortError') {
          throw new ApiError(
            'Prairie Card fetch timeout',
            ApiErrorCode.EXTERNAL_SERVICE_ERROR,
            504
          );
        }
        throw _error;
      }
    }

    // Parse the HTML content
    const minimalProfile = PrairieProfileExtractor.extractMinimal(htmlContent);

    if (!minimalProfile) {
      throw new ApiError(
        'Failed to parse Prairie Card',
        ApiErrorCode.PARSE_ERROR,
        422
      );
    }

    // Convert MinimalProfile to PrairieProfile
    const profile: PrairieProfile = {
      basic: {
        name: minimalProfile.name,
        title: minimalProfile.title || '',
        company: minimalProfile.company || '',
        bio: minimalProfile.bio || ''
      },
      details: {
        tags: [],
        skills: minimalProfile.skills,
        interests: minimalProfile.interests,
        certifications: [],
        communities: [],
        motto: minimalProfile.motto
      },
      social: {},
      custom: {},
      meta: {
        isPartialData: true
      }
    };

    return NextResponse.json({ data: profile });
  } catch (_error) {
    if (_error instanceof ApiError) {
      throw _error;
    }
    
    console.error('[Prairie API] Error:', _error);
    throw new ApiError(
      'Failed to process Prairie Card',
      ApiErrorCode.INTERNAL_ERROR,
      500
    );
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders as HeadersInit,
  });
}