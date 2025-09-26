
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
    const { playerId, nextState } = body;
    
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
        error: 'ホストのみがゲーム状態を変更できます'
      }), {
        status: 403,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Validate state transition
    const validTransitions = {
      'distributing': ['presenting'],
      'presenting': ['scoring'],
      'scoring': ['presenting', 'results'],
      'results': ['waiting']
    };
    
    if (!validTransitions[room.gameState]?.includes(nextState)) {
      return new Response(JSON.stringify({
        error: `無効な状態遷移: ${room.gameState} -> ${nextState}`
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Update room state
    room.gameState = nextState;
    
    // Save to KV
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.put(
        `room:${roomId}`,
        JSON.stringify(room),
        { expirationTtl: 604800 }
      );
    }
    
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
    console.error('[Transition Error]:', error);
    return new Response(JSON.stringify({
      error: '状態遷移に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}