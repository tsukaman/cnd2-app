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
    const body = await context.request.json();
    
    // 簡易的な診断ロジック（OpenAI APIは後で実装）
    const result = {
      success: true,
      result: {
        type: body.mode === 'duo' ? 'ペアプログラマー型' : 'チームリーダー型',
        description: 'CloudNative技術に強い関心を持つエンジニア',
        compatibility: 85,
        tips: ['技術的な話題で盛り上がれそう', 'ハンズオンに一緒に参加してみましょう'],
      }
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}