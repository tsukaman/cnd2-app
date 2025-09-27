/**
 * 川柳管理API
 * Cloudflare KVを使用したCRUD操作
 */

// 認証チェック
function checkAuth(request) {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = 'Bearer cndw2025-admin-token'; // 本番環境では環境変数を使用

  if (!authHeader || authHeader !== expectedToken) {
    return false;
  }
  return true;
}

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);

  // CORS対応
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 認証チェック
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // KVストレージが利用可能かチェック
    const KV = env.SENRYU_KV || env.KV;

    // 開発環境用のモックデータ
    if (!KV) {
      console.log('KV not available, using mock data');
      return handleMockRequests(request, path);
    }

    // リクエストメソッドに応じた処理
    switch (request.method) {
      case 'GET':
        return handleGet(KV, path);
      case 'POST':
        return handlePost(KV, request, path);
      case 'PUT':
        return handlePut(KV, request, path);
      case 'DELETE':
        return handleDelete(KV, path);
      default:
        return new Response('Method not allowed', {
          status: 405,
          headers: corsHeaders
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// GET処理
async function handleGet(KV, path) {
  const [, , resource, id] = path;

  if (resource === 'posts') {
    if (id) {
      // 個別の投稿取得
      const post = await KV.get(`post:${id}`, 'json');
      return new Response(JSON.stringify(post || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // 全投稿取得
      const list = await KV.list({ prefix: 'post:' });
      const posts = await Promise.all(
        list.keys.map(key => KV.get(key.name, 'json'))
      );
      return new Response(JSON.stringify(posts.filter(Boolean)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  if (resource === 'phrases') {
    const type = id; // upper, middle, lower
    if (type && ['upper', 'middle', 'lower'].includes(type)) {
      // 特定タイプの句取得
      const list = await KV.list({ prefix: `phrase:${type}:` });
      const phrases = await Promise.all(
        list.keys.map(key => KV.get(key.name, 'json'))
      );
      return new Response(JSON.stringify(phrases.filter(Boolean)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // 全句取得
      const types = ['upper', 'middle', 'lower'];
      const allPhrases = {};

      for (const type of types) {
        const list = await KV.list({ prefix: `phrase:${type}:` });
        const phrases = await Promise.all(
          list.keys.map(key => KV.get(key.name, 'json'))
        );
        allPhrases[type] = phrases.filter(Boolean);
      }

      return new Response(JSON.stringify(allPhrases), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Not Found', {
    status: 404,
    headers: corsHeaders
  });
}

// POST処理（新規作成）
async function handlePost(KV, request, path) {
  const [, , resource] = path;
  const data = await request.json();

  if (resource === 'posts') {
    const id = `p${Date.now()}`;
    const post = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    await KV.put(`post:${id}`, JSON.stringify(post));

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (resource === 'phrases') {
    const { text, type, category } = data;
    if (!type || !['upper', 'middle', 'lower'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid phrase type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = `${type[0]}${Date.now()}`;
    const phrase = {
      id,
      text,
      type,
      category: category || 'daily',
      createdAt: new Date().toISOString()
    };
    await KV.put(`phrase:${type}:${id}`, JSON.stringify(phrase));

    return new Response(JSON.stringify(phrase), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', {
    status: 404,
    headers: corsHeaders
  });
}

// PUT処理（更新）
async function handlePut(KV, request, path) {
  const [, , resource, id] = path;
  const data = await request.json();

  if (resource === 'posts' && id) {
    const existing = await KV.get(`post:${id}`, 'json');
    if (!existing) {
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders
      });
    }

    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await KV.put(`post:${id}`, JSON.stringify(updated));

    return new Response(JSON.stringify(updated), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (resource === 'phrases' && id) {
    // idからタイプを推測
    const type = id.startsWith('u') ? 'upper' : id.startsWith('m') ? 'middle' : 'lower';
    const existing = await KV.get(`phrase:${type}:${id}`, 'json');

    if (!existing) {
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders
      });
    }

    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await KV.put(`phrase:${type}:${id}`, JSON.stringify(updated));

    return new Response(JSON.stringify(updated), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', {
    status: 404,
    headers: corsHeaders
  });
}

// DELETE処理
async function handleDelete(KV, path) {
  const [, , resource, id] = path;

  if (resource === 'posts' && id) {
    await KV.delete(`post:${id}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (resource === 'phrases' && id) {
    // idからタイプを推測
    const type = id.startsWith('u') ? 'upper' : id.startsWith('m') ? 'middle' : 'lower';
    await KV.delete(`phrase:${type}:${id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', {
    status: 404,
    headers: corsHeaders
  });
}

// 開発環境用モック処理
function handleMockRequests(request, path) {
  // モックデータ
  const mockData = {
    posts: [
      {
        id: 'p1',
        upper: 'コンテナが',
        middle: 'エラーを吐きながら',
        lower: 'コーヒータイム',
        author: '開発者A',
        likes: 42,
        createdAt: new Date().toISOString()
      }
    ],
    phrases: {
      upper: [
        { id: 'u1', text: 'コンテナが', type: 'upper', category: 'tech', createdAt: new Date().toISOString() },
        { id: 'u2', text: 'ポッド落ちて', type: 'upper', category: 'tech', createdAt: new Date().toISOString() }
      ],
      middle: [
        { id: 'm1', text: 'エラーを吐きながら', type: 'middle', category: 'tech', createdAt: new Date().toISOString() },
        { id: 'm2', text: 'ログを見つめて', type: 'middle', category: 'tech', createdAt: new Date().toISOString() }
      ],
      lower: [
        { id: 'l1', text: 'コーヒータイム', type: 'lower', category: 'daily', createdAt: new Date().toISOString() },
        { id: 'l2', text: '成功だ', type: 'lower', category: 'tech', createdAt: new Date().toISOString() }
      ]
    }
  };

  const [, , resource] = path;

  if (request.method === 'GET') {
    if (resource === 'posts') {
      return new Response(JSON.stringify(mockData.posts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (resource === 'phrases') {
      return new Response(JSON.stringify(mockData.phrases), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // 他のメソッドもモックレスポンスを返す
  return new Response(JSON.stringify({ success: true, mock: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}