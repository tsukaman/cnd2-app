/**
 * Gallery Publish API
 * ギャラリーへの作品公開エンドポイント
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { roomId, playerId, preference } = body;
    
    // バリデーション
    if (!roomId || !playerId || !preference) {
      return new Response(JSON.stringify({
        error: '必要なパラメータが不足しています'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 公開しない場合は早期リターン
    if (!preference.shareToGallery) {
      return new Response(JSON.stringify({
        success: true,
        message: '公開をスキップしました'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ルームデータを取得
    let room = null;
    if (env.SENRYU_KV) {
      const roomData = await env.SENRYU_KV.get(`room:${roomId}`);
      if (roomData) {
        room = JSON.parse(roomData);
      }
    }
    
    if (!room) {
      return new Response(JSON.stringify({
        error: 'ルームが見つかりません'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // プレイヤーデータを検索
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return new Response(JSON.stringify({
        error: 'プレイヤーが見つかりません'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 川柳データが存在するか確認
    if (!player.senryu) {
      return new Response(JSON.stringify({
        error: '川柳データが見つかりません'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ギャラリーエントリーを作成
    // crypto.randomUUID()で衝突を回避
    const entryId = `gallery_${crypto.randomUUID()}`;
    const isAnonymous = preference.displayName === 'anonymous';
    
    const galleryEntry = {
      id: entryId,
      senryu: player.senryu,
      authorName: isAnonymous ? '詠み人知らず' : player.name,
      authorId: isAnonymous ? null : player.id,
      isAnonymous,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      roomId: room.id,
      roomCode: room.code,
      gameDate: room.startedAt || room.createdAt,
      playerCount: room.players.length
    };
    
    // KVに保存（30日間保持）
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `gallery:${entryId}`,
        JSON.stringify(galleryEntry),
        { expirationTtl: 2592000 } // 30 days
      );
      
      // インデックスも更新（最新順取得用）
      const indexKey = 'gallery:index';
      let index = [];
      const indexData = await env.SENRYU_KV.get(indexKey);
      if (indexData) {
        index = JSON.parse(indexData);
      }
      
      // 新しいエントリーを先頭に追加
      index.unshift({
        id: entryId,
        createdAt: galleryEntry.createdAt,
        likes: 0
      });
      
      // 最大1000件まで保持
      if (index.length > 1000) {
        index = index.slice(0, 1000);
      }
      
      await env.SENRYU_KV.put(
        indexKey,
        JSON.stringify(index),
        { expirationTtl: 2592000 }
      );
    }
    
    return new Response(JSON.stringify({
      success: true,
      entryId,
      message: isAnonymous ? 
        '作品を匿名でギャラリーに公開しました' : 
        '作品をギャラリーに公開しました'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('[Gallery Publish Error]:', error);
    return new Response(JSON.stringify({
      error: 'ギャラリーへの公開に失敗しました'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}