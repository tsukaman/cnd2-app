import { sanitizePlayerName, sanitizeRoomCode } from '../../../utils/sanitize.js';

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
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { roomCode, playerName, rankingPreference } = body;
    
    if (!roomCode || !playerName) {
      return new Response(JSON.stringify({
        error: '部屋コードとプレイヤー名は必須です'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // サニタイズ
    const sanitizedRoomCode = sanitizeRoomCode(roomCode);
    const sanitizedPlayerName = sanitizePlayerName(playerName);
    
    if (!sanitizedPlayerName) {
      return new Response(JSON.stringify({
        error: '有効なプレイヤー名を入力してください'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Get room ID from code
    let roomId = null;
    if (env.SENRYU_KV) {
      roomId = await env.SENRYU_KV.get(`code:${sanitizedRoomCode}`);
    }
    
    if (!roomId) {
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
    
    // Check if game has already started
    if (room.gameState !== 'waiting') {
      return new Response(JSON.stringify({
        error: 'ゲームは既に開始されています'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Check max players (10)
    if (room.players.length >= 10) {
      return new Response(JSON.stringify({
        error: '部屋が満員です（最大10人）'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Check for duplicate player name (サニタイズ後の名前で比較)
    if (room.players.some(p => p.name === sanitizedPlayerName)) {
      return new Response(JSON.stringify({
        error: 'その名前は既に使用されています'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Create new player (サニタイズ済みの名前を使用)
    const newPlayer = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: sanitizedPlayerName,
      rankingPreference: rankingPreference || { allowRanking: true, anonymousRanking: false },
      scores: [],
      totalScore: 0,
      isHost: false,
      joinedAt: new Date().toISOString(),
      senryu: null
    };
    
    // Add player to room
    room.players.push(newPlayer);
    
    // Update room in KV
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `room:${roomId}`,
        JSON.stringify(room),
        { expirationTtl: 604800 }
      );
    }
    
    return new Response(JSON.stringify({
      room,
      playerId: newPlayer.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('[Join Room Error]:', error);
    return new Response(JSON.stringify({
      error: '部屋への参加に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}