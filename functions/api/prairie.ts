// @ts-ignore - JS module without types
import { parseFromHTML, validatePrairieCardUrl } from '../utils/prairie-parser.js';

export async function onRequest(context: any) {
  // Handle CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { url, html } = await context.request.json();
    
    // Validation
    if (!url && !html) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'URL or HTML content is required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    let prairieData;
    let htmlContent = html;
    
    if (url && !html) {
      // Validate URL before fetching
      if (!validatePrairieCardUrl(url)) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Invalid Prairie Card URL' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      
      // Fetch Prairie Card HTML from URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CND2/2.0 PrairieCardParser',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Prairie Card: ${response.status}`);
      }
      
      htmlContent = await response.text();
    }
    
    // Parse the HTML content
    prairieData = parseFromHTML(htmlContent) as any;
    
    // Add source URL to metadata if provided
    if (url && prairieData?.meta) {
      prairieData.meta.sourceUrl = url;
    }
    
    const result = {
      success: true,
      data: prairieData
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[Prairie API] Error:', error);
    
    // プロダクション環境では汎用的なエラーメッセージを返す
    // Cloudflare Workers環境では NODE_ENV が期待通りに動作しない可能性があるため、
    // より安全にエラーメッセージを汎用化
    const errorMessage = 'Failed to parse Prairie Card';
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}