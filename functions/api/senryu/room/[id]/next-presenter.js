
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
    const { playerId } = body;
    
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
    
    // Check if requester is current presenter (primary) or host (backup)
    const currentPresenter = room.players[room.currentPresenterIndex];
    const isHost = playerId === room.hostId;
    const isCurrentPresenter = currentPresenter && currentPresenter.id === playerId;
    
    if (!isHost && !isCurrentPresenter) {
      return new Response(JSON.stringify({
        error: 'ホストまたは現在のプレゼンターのみが次へ進めることができます'
      }), {
        status: 403,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Implement distributed lock to prevent race conditions
    const lockKey = `presentation-end:${roomId}:${room.currentPresenterIndex}`;
    const lockValue = `${playerId}:${Date.now()}`;
    
    try {
      // Try to acquire lock with 60 second TTL (minimum for KV storage)
      const existingLock = await env.SENRYU_KV.get(lockKey);
      if (existingLock) {
        // Lock already exists, check if it's expired (older than 60 seconds)
        const [, timestamp] = existingLock.split(':');
        if (Date.now() - parseInt(timestamp) < 60000) {
          console.log(`[Lock] Presentation end already in progress by another client`);
          return new Response(JSON.stringify({
            error: 'プレゼン終了処理が既に実行中です'
          }), {
            status: 409, // Conflict
            headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
          });
        }
      }
      
      // Acquire lock (minimum TTL is 60 seconds for KV storage)
      await env.SENRYU_KV.put(lockKey, lockValue, { expirationTtl: 60 });
      console.log(`[Lock] Acquired presentation end lock for room ${roomId} by ${playerId}`);
    } catch (error) {
      console.error('[Lock] Failed to acquire lock:', error);
      // Continue without lock (best effort)
    }
    
    // Transition from presenting to scoring
    if (room.gameState === 'presenting') {
      room.gameState = 'scoring';
      
      // Reset presentationStarted flag for next presenter
      room.presentationStarted = false;
      
      // Initialize score tracking for current presenter
      const currentPresenter = room.players[room.currentPresenterIndex];
      if (!room.submittedScores) {
        room.submittedScores = {};
      }
      if (currentPresenter && !room.submittedScores[currentPresenter.id]) {
        room.submittedScores[currentPresenter.id] = {};
      }
    }
    
    // Save room state
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
    console.error('[Next Presenter Error]:', error);
    return new Response(JSON.stringify({
      error: '次のプレゼンターへの移行に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}