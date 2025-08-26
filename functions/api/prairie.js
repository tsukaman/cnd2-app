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
    console.error('Prairie API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to parse Prairie Card' 
      }),
      {
        status: 500,
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
    name: extractText(/<h1[^>]*>([^<]+)<\/h1>/i) || 'CloudNative Enthusiast',
    bio: extractText(/<div[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/div>/i) || 'クラウドネイティブ技術に情熱を注ぐエンジニア',
    title: extractText(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
    company: extractText(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
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