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
    const { playerId, cardType } = body; // cardType: 'upper' | 'middle' | 'lower'
    
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
    
    // Find player
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return new Response(JSON.stringify({
        error: 'プレイヤーが見つかりません'
      }), {
        status: 404,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Check if player has redraws remaining
    const redrawsUsed = room.redrawsUsed?.[playerId]?.[cardType] || 0;
    const redrawLimit = room.gameConfig?.redrawLimits?.[cardType] || 0;
    
    if (redrawsUsed >= redrawLimit) {
      return new Response(JSON.stringify({
        error: `${cardType === 'upper' ? '上の句' : cardType === 'middle' ? '中の句' : '下の句'}の再選出回数を超えています`
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Select new card
    let newCard;
    const cardPool = cardType === 'upper' ? UPPER_CARDS : 
                     cardType === 'middle' ? MIDDLE_CARDS : 
                     LOWER_CARDS;
    
    // Get a different card than current one
    do {
      newCard = cardPool[Math.floor(Math.random() * cardPool.length)];
    } while (newCard.id === player.senryu[cardType].id && cardPool.length > 1);
    
    // Update player's senryu
    player.senryu[cardType] = newCard;
    
    // Update distributed cards
    if (room.distributedCards && room.distributedCards[playerId]) {
      room.distributedCards[playerId][cardType] = newCard;
    }
    
    // Update redraw count
    if (!room.redrawsUsed) room.redrawsUsed = {};
    if (!room.redrawsUsed[playerId]) room.redrawsUsed[playerId] = { upper: 0, middle: 0, lower: 0 };
    room.redrawsUsed[playerId][cardType] = redrawsUsed + 1;
    
    // Save to KV
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `room:${roomId}`,
        JSON.stringify(room),
        { expirationTtl: 604800 }
      );
    }
    
    return new Response(JSON.stringify({
      room,
      newCard,
      remainingRedraws: redrawLimit - (redrawsUsed + 1)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('[Redraw Error]:', error);
    return new Response(JSON.stringify({
      error: 'カードの再選出に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}