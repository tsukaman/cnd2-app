// Prairie Card API for Cloudflare Functions
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    const { url, html } = await request.json();
    
    if (!url && !html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL or HTML content is required' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Simplified Prairie Card parsing for demo
    // In production, use the full parser from lib/prairie-card-parser
    let prairieData;
    
    if (html) {
      // Parse from HTML
      prairieData = parseFromHTML(html);
    } else {
      // Validate URL before fetching
      if (!validatePrairieCardUrl(url)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid Prairie Card URL' 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
      
      // Fetch and parse from URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CND2/1.0',
          'Accept': 'text/html',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Prairie Card: ${response.status}`);
      }
      
      const html = await response.text();
      prairieData = parseFromHTML(html);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: prairieData,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    // Log detailed error for debugging (not exposed to client)
    console.error('Prairie API error:', {
      message: error.message,
      stack: error.stack,
      url: url,
      timestamp: new Date().toISOString()
    });
    
    // Return user-friendly error message
    let errorMessage = 'Prairie Cardの解析に失敗しました';
    let statusCode = 500;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Prairie Cardの取得に失敗しました。URLを確認してください。';
      statusCode = 502; // Bad Gateway
    } else if (error.message.includes('Invalid URL')) {
      errorMessage = '無効なURLです。正しいPrairie Card URLを入力してください。';
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// URL validation function for security
function validatePrairieCardUrl(url) {
  try {
    const parsed = new URL(url);
    // Only allow prairie.cards domains
    const validHosts = ['prairie.cards', 'my.prairie.cards'];
    return validHosts.includes(parsed.hostname) || 
           parsed.hostname.endsWith('.prairie.cards');
  } catch {
    return false;
  }
}

// HTML sanitization function for security
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCorsHeaders(requestOrigin) {
  const allowedOrigins = [
    'https://cnd2-app.pages.dev',
    'https://cnd2.cloudnativedays.jp',
    'http://localhost:3000',
  ];
  
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function parseFromHTML(html) {
  // Simplified Prairie Card parsing
  const extractText = (pattern) => {
    const match = html.match(pattern);
    return match ? match[1].trim() : '';
  };
  
  const extractArray = (pattern) => {
    const matches = html.matchAll(pattern);
    return Array.from(matches).map(m => m[1].trim());
  };
  
  return {
    name: escapeHtml(extractText(/<h1[^>]*>([^<]+)<\/h1>/i)) || 'CloudNative Enthusiast',
    bio: escapeHtml(extractText(/<div[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/div>/i)) || 'クラウドネイティブ技術に情熱を注ぐエンジニア',
    title: escapeHtml(extractText(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i)) || '',
    company: escapeHtml(extractText(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i)) || '',
    interests: ['Kubernetes', 'Docker', 'CI/CD', 'Observability'],
    skills: extractArray(/<span[^>]*class="[^"]*skill[^"]*"[^>]*>([^<]+)<\/span>/gi),
    tags: ['#CloudNative', '#DevOps', '#SRE'],
    twitter: extractSocialUrl(html, 'twitter.com') || extractSocialUrl(html, 'x.com'),
    github: extractSocialUrl(html, 'github.com'),
    linkedin: extractSocialUrl(html, 'linkedin.com'),
  };
}

function extractSocialUrl(html, domain) {
  const pattern = new RegExp(`https?://(?:www\\.)?${domain.replace('.', '\\.')}[^"'\\s>]+`, 'i');
  const match = html.match(pattern);
  return match ? match[0] : undefined;
}