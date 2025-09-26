/**
 * Gallery Like API
 * いいね追加/削除エンドポイント
 */

// いいね追加
export async function onRequestPost(context) {
  const { request, env, params } = context;
  const entryId = params.id;
  
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'セッションIDが必要です'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // レート制限チェック（1分間に10いいねまで）
    const rateLimitKey = `ratelimit:like:${sessionId}`;
    if (env.SENRYU_KV) {
      const rateData = await env.SENRYU_KV.get(rateLimitKey);
      if (rateData) {
        const { count, timestamp } = JSON.parse(rateData);
        const now = Date.now();
        
        // 1分以内で10回以上の場合は拒否
        if (now - timestamp < 60000 && count >= 10) {
          return new Response(JSON.stringify({
            error: 'レート制限に達しました。しばらくお待ちください。'
          }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // 1分経過していればリセット
        if (now - timestamp >= 60000) {
          await env.SENRYU_KV.put(
            rateLimitKey,
            JSON.stringify({ count: 1, timestamp: now }),
            { expirationTtl: 60 }
          );
        } else {
          await env.SENRYU_KV.put(
            rateLimitKey,
            JSON.stringify({ count: count + 1, timestamp }),
            { expirationTtl: 60 }
          );
        }
      } else {
        await env.SENRYU_KV.put(
          rateLimitKey,
          JSON.stringify({ count: 1, timestamp: Date.now() }),
          { expirationTtl: 60 }
        );
      }
    }
    
    // ギャラリーエントリーを取得
    let entry = null;
    if (env.SENRYU_KV) {
      const entryData = await env.SENRYU_KV.get(`gallery:${entryId}`);
      if (entryData) {
        entry = JSON.parse(entryData);
      }
    }
    
    if (!entry) {
      return new Response(JSON.stringify({
        error: '作品が見つかりません'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // すでにいいね済みかチェック
    if (entry.likedBy.includes(sessionId)) {
      return new Response(JSON.stringify({
        error: 'すでにいいね済みです',
        likes: entry.likes,
        liked: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // いいねを追加
    entry.likes++;
    entry.likedBy.push(sessionId);
    
    // KVに保存
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `gallery:${entryId}`,
        JSON.stringify(entry),
        { expirationTtl: 2592000 } // 30 days
      );
      
      // インデックスも更新
      const indexData = await env.SENRYU_KV.get('gallery:index');
      if (indexData) {
        const index = JSON.parse(indexData);
        const itemIndex = index.findIndex(item => item.id === entryId);
        if (itemIndex !== -1) {
          index[itemIndex].likes = entry.likes;
          await env.SENRYU_KV.put(
            'gallery:index',
            JSON.stringify(index),
            { expirationTtl: 2592000 }
          );
        }
      }
    }
    
    return new Response(JSON.stringify({
      likes: entry.likes,
      liked: true,
      message: 'いいねしました！'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('[Gallery Like Error]:', error);
    return new Response(JSON.stringify({
      error: 'いいねの追加に失敗しました'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// いいね削除
export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const entryId = params.id;
  
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'セッションIDが必要です'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ギャラリーエントリーを取得
    let entry = null;
    if (env.SENRYU_KV) {
      const entryData = await env.SENRYU_KV.get(`gallery:${entryId}`);
      if (entryData) {
        entry = JSON.parse(entryData);
      }
    }
    
    if (!entry) {
      return new Response(JSON.stringify({
        error: '作品が見つかりません'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // いいねしているかチェック
    const likeIndex = entry.likedBy.indexOf(sessionId);
    if (likeIndex === -1) {
      return new Response(JSON.stringify({
        error: 'いいねしていません',
        likes: entry.likes,
        liked: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // いいねを削除
    entry.likes = Math.max(0, entry.likes - 1);
    entry.likedBy.splice(likeIndex, 1);
    
    // KVに保存
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `gallery:${entryId}`,
        JSON.stringify(entry),
        { expirationTtl: 2592000 } // 30 days
      );
      
      // インデックスも更新
      const indexData = await env.SENRYU_KV.get('gallery:index');
      if (indexData) {
        const index = JSON.parse(indexData);
        const itemIndex = index.findIndex(item => item.id === entryId);
        if (itemIndex !== -1) {
          index[itemIndex].likes = entry.likes;
          await env.SENRYU_KV.put(
            'gallery:index',
            JSON.stringify(index),
            { expirationTtl: 2592000 }
          );
        }
      }
    }
    
    return new Response(JSON.stringify({
      likes: entry.likes,
      liked: false,
      message: 'いいねを取り消しました'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('[Gallery Unlike Error]:', error);
    return new Response(JSON.stringify({
      error: 'いいねの削除に失敗しました'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}