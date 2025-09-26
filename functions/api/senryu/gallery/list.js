/**
 * Gallery List API
 * ギャラリー作品一覧取得エンドポイント
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // クエリパラメータ取得
  const sort = url.searchParams.get('sort') || 'latest'; // latest, popular, random
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  const playerCountMin = parseInt(url.searchParams.get('playerCountMin') || '0');
  const playerCountMax = parseInt(url.searchParams.get('playerCountMax') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  
  try {
    let entries = [];
    
    // KVからインデックスを取得
    if (env.SENRYU_KV) {
      const indexData = await env.SENRYU_KV.get('gallery:index');
      let index = [];
      
      if (indexData) {
        index = JSON.parse(indexData);
      }
      
      // ソート処理
      if (sort === 'popular') {
        // いいね数順でソート
        index.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (sort === 'random') {
        // ランダムソート
        index = index.sort(() => Math.random() - 0.5);
      }
      // latest の場合はデフォルトの順序（新着順）
      
      // インデックスからエントリーを取得
      const targetIndices = index.slice(offset, offset + limit);
      
      for (const item of targetIndices) {
        const entryData = await env.SENRYU_KV.get(`gallery:${item.id}`);
        if (entryData) {
          const entry = JSON.parse(entryData);
          
          // フィルタリング
          let include = true;
          
          // 日付フィルター
          if (dateFrom && new Date(entry.gameDate) < new Date(dateFrom)) {
            include = false;
          }
          if (dateTo && new Date(entry.gameDate) > new Date(dateTo)) {
            include = false;
          }
          
          // プレイヤー数フィルター
          if (entry.playerCount < playerCountMin || entry.playerCount > playerCountMax) {
            include = false;
          }
          
          if (include) {
            entries.push(entry);
          }
        }
      }
      
      // フィルターで足りない場合は追加で取得
      let additionalOffset = offset + limit;
      while (entries.length < limit && additionalOffset < index.length) {
        const additionalIndices = index.slice(additionalOffset, additionalOffset + 20);
        
        for (const item of additionalIndices) {
          if (entries.length >= limit) break;
          
          const entryData = await env.SENRYU_KV.get(`gallery:${item.id}`);
          if (entryData) {
            const entry = JSON.parse(entryData);
            
            let include = true;
            
            if (dateFrom && new Date(entry.gameDate) < new Date(dateFrom)) {
              include = false;
            }
            if (dateTo && new Date(entry.gameDate) > new Date(dateTo)) {
              include = false;
            }
            
            if (entry.playerCount < playerCountMin || entry.playerCount > playerCountMax) {
              include = false;
            }
            
            if (include) {
              entries.push(entry);
            }
          }
        }
        
        additionalOffset += 20;
      }
    }
    
    // 開発環境用のダミーデータ
    if (entries.length === 0 && process.env.NODE_ENV === 'development') {
      entries = [
        {
          id: 'dummy_1',
          senryu: {
            upper: { id: 'u001', text: 'Kubernetes', category: 'cloudnative', type: 'upper' },
            middle: { id: 'm001', text: '朝から夜まで', category: 'temporal', type: 'middle' },
            lower: { id: 'l001', text: 'ずっとエラー', category: 'result', type: 'lower' }
          },
          authorName: 'クラウド太郎',
          authorId: 'player_1',
          isAnonymous: false,
          likes: 42,
          likedBy: ['session_1', 'session_2', 'session_3'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          roomId: 'room_1',
          roomCode: 'ABC123',
          gameDate: new Date(Date.now() - 86400000).toISOString(),
          playerCount: 5
        },
        {
          id: 'dummy_2',
          senryu: {
            upper: { id: 'u002', text: 'Docker', category: 'cloudnative', type: 'upper' },
            middle: { id: 'm002', text: 'コンテナいっぱい', category: 'quantity', type: 'middle' },
            lower: { id: 'l002', text: '腹ペコだ', category: 'daily', type: 'lower' }
          },
          authorName: '詠み人知らず',
          authorId: null,
          isAnonymous: true,
          likes: 28,
          likedBy: ['session_4', 'session_5'],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          roomId: 'room_2',
          roomCode: 'DEF456',
          gameDate: new Date(Date.now() - 172800000).toISOString(),
          playerCount: 3
        }
      ];
    }
    
    return new Response(JSON.stringify({
      entries,
      total: entries.length,
      hasMore: false, // TODO: 実装時に適切に計算
      offset,
      limit
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 1分キャッシュ
      }
    });
    
  } catch (error) {
    console.error('[Gallery List Error]:', error);
    return new Response(JSON.stringify({
      error: 'ギャラリーの取得に失敗しました'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}