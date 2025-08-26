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
    const { html } = await context.request.json();
    
    // Prairie Card解析の簡易版
    const result = {
      success: true,
      data: {
        name: 'CloudNative Enthusiast',
        bio: 'クラウドネイティブ技術に情熱を注ぐエンジニア',
        interests: ['Kubernetes', 'Docker', 'CI/CD', 'Observability'],
        tags: ['#CloudNative', '#DevOps', '#SRE'],
      }
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to parse Prairie Card' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}