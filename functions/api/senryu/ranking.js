
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
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  try {
    const rankings = [];
    
    // Get all ranking entries from KV
    if (env.SENRYU_KV) {
      const listResult = await env.SENRYU_KV.list({
        prefix: 'ranking:',
        limit: 1000 // Get max entries
      });
      
      // Fetch all ranking data
      for (const key of listResult.keys) {
        const data = await env.SENRYU_KV.get(key.name);
        if (data) {
          const entry = JSON.parse(data);
          rankings.push(entry);
        }
      }
    }
    
    // Filter by category (player count)
    let filtered = rankings;
    if (category !== 'all') {
      const [min, max] = category.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filtered = rankings.filter(entry => 
          entry.playerCount >= min && entry.playerCount <= max
        );
      }
    }
    
    // Sort by score with player count weighting
    filtered.sort((a, b) => {
      // Weight score by player count (logarithmic scale)
      const scoreA = a.scores.average + Math.log10(a.playerCount) * 10;
      const scoreB = b.scores.average + Math.log10(b.playerCount) * 10;
      return scoreB - scoreA;
    });
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    
    // Anonymize if needed
    const results = paginated.map(entry => {
      if (entry.anonymousRanking) {
        return {
          ...entry,
          playerName: '詠み人知らず',
          playerId: null
        };
      }
      return entry;
    });
    
    return new Response(JSON.stringify({
      rankings: results,
      total: filtered.length,
      offset,
      limit
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('[Get Rankings Error]:', error);
    return new Response(JSON.stringify({
      error: 'ランキングの取得に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Admin function to delete inappropriate entries
export async function onRequestDelete(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { rankingId, adminKey } = body;
    
    // Simple admin authentication
    const expectedAdminKey = env.SENRYU_ADMIN_KEY || 'cndw2025-admin-key';
    if (adminKey !== expectedAdminKey) {
      return new Response(JSON.stringify({
        error: '管理者権限が必要です'
      }), {
        status: 403,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    if (!rankingId) {
      return new Response(JSON.stringify({
        error: 'ランキングIDが必要です'
      }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }
    
    // Delete from KV
    if (env.SENRYU_KV) {
      await env.SENRYU_KV.delete(`ranking:${rankingId}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ランキングエントリーを削除しました'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('[Delete Ranking Error]:', error);
    return new Response(JSON.stringify({
      error: 'ランキングの削除に失敗しました'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}