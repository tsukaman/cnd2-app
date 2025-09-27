import { UPPER_CARDS, MIDDLE_CARDS, LOWER_CARDS } from '../../../../utils/senryu-cards.js';

// CORS headers for local development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

// Handle OPTIONS request for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const roomId = params.id;
  
  try {
    const body = await request.json();
    const { playerId, gameConfig = {} } = body;
    
    // Default game configuration
    const defaultConfig = {
      presentationTimeLimit: 60,  // 60秒のプレゼン時間
      numberOfSets: 1,            // 1セット
      redrawLimits: {
        upper: 1,   // 上の句の再選出回数
        middle: 1,  // 中の句の再選出回数
        lower: 1    // 下の句の再選出回数
      }
    };
    
    // Merge with provided config
    const finalConfig = {
      ...defaultConfig,
      ...gameConfig,
      redrawLimits: {
        ...defaultConfig.redrawLimits,
        ...(gameConfig.redrawLimits || {})
      }
    };
    
    // Get room data
    let room = null;
    if (env.SENRYU_KV) {
      const roomData = await env.SENRYU_KV.get(`room:${roomId}`);
      if (roomData) {
        room = JSON.parse(roomData);
      }
    }
    
    if (!room) {
      return new Response(JSON.stringify({
        error: '部屋が見つかりません'
      }), {
        status: 404,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Check if requester is host
    if (playerId !== room.hostId) {
      return new Response(JSON.stringify({
        error: 'ホストのみがゲームを開始できます'
      }), {
        status: 403,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Check minimum players (2)
    if (room.players.length < 2) {
      return new Response(JSON.stringify({
        error: '最低2人以上必要です'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Distribute cards to each player
    const distributedCards = {};
    room.players.forEach(player => {
      distributedCards[player.id] = {
        upper: UPPER_CARDS[Math.floor(Math.random() * UPPER_CARDS.length)],
        middle: MIDDLE_CARDS[Math.floor(Math.random() * MIDDLE_CARDS.length)],
        lower: LOWER_CARDS[Math.floor(Math.random() * LOWER_CARDS.length)]
      };
      // Also store in player object
      player.senryu = distributedCards[player.id];
    });
    
    // Update room state
    room.gameState = 'distributing';
    room.startedAt = new Date().toISOString();
    room.distributedCards = distributedCards;
    room.currentPresenterIndex = 0;
    room.submittedScores = {};
    room.gameConfig = finalConfig;  // Store game configuration
    room.currentSet = 1;  // Track current set
    room.redrawsUsed = {};  // Track redraws used by each player
    
    // Initialize submitted scores structure and redraw tracking
    room.players.forEach(player => {
      room.submittedScores[player.id] = {};
      room.redrawsUsed[player.id] = {
        upper: 0,
        middle: 0,
        lower: 0
      };
    });
    
    // Save to KV
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `room:${roomId}`,
        JSON.stringify(room),
        { expirationTtl: 604800 }
      );
    }
    
    // Note: Client will handle transition to 'presenting' after distribution animation
    
    return new Response(JSON.stringify({
      room
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('[Start Game Error]:', error);
    return new Response(JSON.stringify({
      error: 'ゲームの開始に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}