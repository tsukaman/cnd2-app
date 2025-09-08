import { sanitizePlayerName } from '../../../utils/sanitize.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { hostName, rankingPreference } = body;
    
    if (!hostName || hostName.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'ホスト名は必須です'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // サニタイズ
    const sanitizedHostName = sanitizePlayerName(hostName);
    
    if (!sanitizedHostName) {
      return new Response(JSON.stringify({
        error: '有効なホスト名を入力してください'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate room code (6 characters)
    const roomCode = generateRoomCode();
    const roomId = `room_${Date.now()}_${roomCode}`;
    
    // Create host player (サニタイズ済みの名前を使用)
    const hostPlayer = {
      id: `player_${Date.now()}`,
      name: sanitizedHostName,
      rankingPreference: rankingPreference || { allowRanking: true, anonymousRanking: false },
      scores: [],
      totalScore: 0,
      isHost: true,
      joinedAt: new Date().toISOString(),
      senryu: null
    };
    
    // Create room
    const room = {
      id: roomId,
      code: roomCode,
      hostId: hostPlayer.id,
      players: [hostPlayer],
      gameState: 'waiting',
      currentPresenterIndex: -1,
      presentationTimeLimit: 60,
      scoringTimeLimit: 30,
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      distributedCards: {},
      submittedScores: {},
      results: null
    };
    
    // Store in KV (7 days TTL)
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `room:${roomId}`,
        JSON.stringify(room),
        { expirationTtl: 604800 }
      );
      
      // Also store room code mapping for easy lookup
      await env.SENRYU_KV.put(
        `code:${roomCode}`,
        roomId,
        { expirationTtl: 604800 }
      );
    }
    
    return new Response(JSON.stringify({
      room,
      playerId: hostPlayer.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('[Create Room Error]:', error);
    return new Response(JSON.stringify({
      error: '部屋の作成に失敗しました'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}