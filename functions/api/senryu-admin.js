/**
 * 川柳管理API
 * Cloudflare KVを使用したCRUD操作
 */

// 認証チェック
function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  // 環境変数から認証トークンを取得（NEXT_PUBLIC_を使用しない）
  const expectedToken = env.ADMIN_AUTH_TOKEN || env.SENRYU_ADMIN_TOKEN;

  // 開発環境のみのフォールバック
  const isDevelopment = !env.ADMIN_AUTH_TOKEN && !env.SENRYU_ADMIN_TOKEN;
  if (isDevelopment && process.env.NODE_ENV !== 'production') {
    // 開発環境のみ、環境変数が設定されていない場合の警告
    console.warn('Warning: Using development auth token. Set ADMIN_AUTH_TOKEN in production.');
    return authHeader === 'Bearer dev-token-only';
  }

  if (!expectedToken) {
    console.error('ADMIN_AUTH_TOKEN is not configured');
    return false;
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return false;
  }
  return true;
}

// CORSヘッダーを環境に応じて設定
function getCorsHeaders(env) {
  // 許可するオリジンを環境変数から取得、または本番/開発環境で切り替え
  const allowedOrigin = env.ALLOWED_ORIGIN ||
    (process.env.NODE_ENV === 'production'
      ? 'https://cnd2.cloudnativedays.jp'
      : 'http://localhost:3000');

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);
  const corsHeaders = getCorsHeaders(env);

  // CORS対応
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 認証チェック（envを渡す）
  if (!checkAuth(request, env)) {
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
      return handleMockRequests(request, path, corsHeaders);
    }

    // リクエストメソッドに応じた処理
    switch (request.method) {
      case 'GET':
        return handleGet(KV, path, corsHeaders);
      case 'POST':
        return handlePost(KV, request, path, corsHeaders);
      case 'PUT':
        return handlePut(KV, request, path, corsHeaders);
      case 'DELETE':
        return handleDelete(KV, path, corsHeaders);
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
async function handleGet(KV, path, corsHeaders) {
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
async function handlePost(KV, request, path, corsHeaders) {
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
async function handlePut(KV, request, path, corsHeaders) {
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
    // まず全タイプから該当する句を検索（より確実な方法）
    let existing = null;
    let type = null;

    // 各タイプから検索
    for (const t of ['upper', 'middle', 'lower']) {
      const phrase = await KV.get(`phrase:${t}:${id}`, 'json');
      if (phrase) {
        existing = phrase;
        type = t;
        break;
      }
    }

    // フォールバック: IDプレフィックスから推測
    if (!existing && !type) {
      type = id.startsWith('u') ? 'upper' :
             id.startsWith('m') ? 'middle' :
             id.startsWith('l') ? 'lower' : null;

      if (type) {
        existing = await KV.get(`phrase:${type}:${id}`, 'json');
      }
    }

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
async function handleDelete(KV, path, corsHeaders) {
  const [, , resource, id] = path;

  if (resource === 'posts' && id) {
    await KV.delete(`post:${id}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (resource === 'phrases' && id) {
    // 全タイプから該当する句を検索して削除
    let deleted = false;

    for (const type of ['upper', 'middle', 'lower']) {
      const key = `phrase:${type}:${id}`;
      const existing = await KV.get(key, 'json');
      if (existing) {
        await KV.delete(key);
        deleted = true;
        break;
      }
    }

    // 見つからなかった場合もフォールバック試行
    if (!deleted) {
      const type = id.startsWith('u') ? 'upper' :
                   id.startsWith('m') ? 'middle' :
                   id.startsWith('l') ? 'lower' : null;
      if (type) {
        await KV.delete(`phrase:${type}:${id}`);
      }
    }

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
function handleMockRequests(request, path, corsHeaders) {
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