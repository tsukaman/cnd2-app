// Diagnosis API for Cloudflare Functions
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    const { profiles, mode } = await request.json();
    
    if (!profiles || !Array.isArray(profiles) || profiles.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'At least 2 profiles are required' 
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
    
    // Generate diagnosis result
    const result = await generateDiagnosis(profiles, mode, env);
    
    // Store in KV if available
    if (env.DIAGNOSIS_KV) {
      const key = `diagnosis:${result.id}`;
      await env.DIAGNOSIS_KV.put(key, JSON.stringify(result), {
        expirationTtl: 604800, // 7 days
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          result,
          aiPowered: false, // Simplified version doesn't use AI
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Diagnosis API error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to generate diagnosis' 
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

async function generateDiagnosis(profiles, mode, env) {
  // Simplified diagnosis generation
  const id = generateId();
  const compatibility = Math.floor(Math.random() * 30) + 70; // 70-100%
  
  const result = {
    id,
    mode,
    type: 'クラウドネイティブ・パートナー',
    compatibility,
    summary: `${profiles[0].basic?.name || 'User 1'}さんと${profiles[1].basic?.name || 'User 2'}さんは、クラウドネイティブ技術への情熱を共有する素晴らしいパートナーです。`,
    strengths: [
      '技術的な興味の共通点が多い',
      '学習意欲が高い組み合わせ',
      'イノベーションを推進する相性',
    ],
    opportunities: [
      '一緒にOSSプロジェクトに貢献',
      '技術ブログの共同執筆',
      'ハッカソンでのチーム参加',
    ],
    advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
    participants: profiles,
    createdAt: new Date().toISOString(),
  };
  
  return result;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}