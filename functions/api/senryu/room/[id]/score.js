
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
    const { playerId, targetPlayerId, scores } = body;
    
    if (!playerId || !targetPlayerId || !scores) {
      return new Response(JSON.stringify({
        error: '必要なパラメータが不足しています'
      }), {
        status: 400,
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
    
    // Check if game is in scoring state
    if (room.gameState !== 'scoring') {
      return new Response(JSON.stringify({
        error: '採点フェーズではありません'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Store the scores
    if (!room.submittedScores[targetPlayerId]) {
      room.submittedScores[targetPlayerId] = {};
    }
    room.submittedScores[targetPlayerId][playerId] = scores;
    
    // Check if all players have submitted scores for current presenter
    const currentPresenter = room.players[room.currentPresenterIndex];
    const otherPlayers = room.players.filter(p => p.id !== currentPresenter.id);
    const allScoresSubmitted = otherPlayers.every(player => 
      room.submittedScores[currentPresenter.id] && 
      room.submittedScores[currentPresenter.id][player.id]
    );
    
    if (allScoresSubmitted) {
      // Calculate total score for current presenter
      const presenterScores = room.submittedScores[currentPresenter.id];
      let totalScore = 0;
      let scoreCount = 0;
      
      Object.values(presenterScores).forEach(scoreSet => {
        Object.values(scoreSet).forEach(score => {
          totalScore += score;
          scoreCount++;
        });
      });
      
      // Update player's total score
      const playerIndex = room.players.findIndex(p => p.id === currentPresenter.id);
      if (playerIndex !== -1) {
        room.players[playerIndex].totalScore = totalScore;
        room.players[playerIndex].scores = presenterScores;
      }
      
      // Move to next presenter or end game
      room.currentPresenterIndex++;
      
      if (room.currentPresenterIndex >= room.players.length) {
        // All players have presented, show results
        room.gameState = 'results';
        room.endedAt = new Date().toISOString();
        
        // Calculate final results
        room.results = room.players
          .map(player => ({
            player,
            rank: 0,
            averageScore: player.totalScore / (scoreCount || 1)
          }))
          .sort((a, b) => b.player.totalScore - a.player.totalScore)
          .map((result, index) => ({
            ...result,
            rank: index + 1
          }));
          
        // ランキング自動保存を削除（ギャラリー機能に移行）
        // ユーザーがゲーム終了後に公開設定を選択する方式に変更
      } else {
        // Move to next presenter
        room.gameState = 'presenting';
        
        // Reset scores for next round
        const nextPresenter = room.players[room.currentPresenterIndex];
        room.submittedScores[nextPresenter.id] = {};
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
      room,
      allScoresSubmitted
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('[Submit Score Error]:', error);
    return new Response(JSON.stringify({
      error: '採点の送信に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}