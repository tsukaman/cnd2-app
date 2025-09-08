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
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if requester is host or current presenter
    const currentPresenter = room.players[room.currentPresenterIndex];
    const isHost = playerId === room.hostId;
    const isCurrentPresenter = currentPresenter && currentPresenter.id === playerId;
    
    if (!isHost && !isCurrentPresenter) {
      return new Response(JSON.stringify({
        error: 'ホストまたは現在のプレゼンターのみが次へ進めることができます'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Transition from presenting to scoring
    if (room.gameState === 'presenting') {
      room.gameState = 'scoring';
      
      // Reset presentationStarted flag for next presenter
      room.presentationStarted = false;
      
      // Initialize score tracking for current presenter
      const currentPresenter = room.players[room.currentPresenterIndex];
      if (!room.submittedScores[currentPresenter.id]) {
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
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('[Next Presenter Error]:', error);
    return new Response(JSON.stringify({
      error: '次のプレゼンターへの移行に失敗しました'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}