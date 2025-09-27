
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
/**
 * Mark presentation as started
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  const roomId = params.id;
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'Room ID is required' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    const { playerId } = await request.json();
    
    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }

    // Get current room data
    const roomKey = `senryu-room:${roomId}`;
    const room = await env.SENRYU_KV.get(roomKey, 'json');
    
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }

    // Check if the player is the current presenter
    const currentPresenter = room.players[room.currentPresenterIndex];
    if (!currentPresenter || currentPresenter.id !== playerId) {
      return new Response(JSON.stringify({ error: 'Only the current presenter can start presentation' }), {
        status: 403,
        headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
      });
    }

    // Update room with presentationStarted flag
    const updatedRoom = {
      ...room,
      presentationStarted: true,
      updatedAt: Date.now()
    };

    // Save updated room
    await env.SENRYU_KV.put(roomKey, JSON.stringify(updatedRoom), {
      expirationTtl: 86400 // 24 hours
    });

    return new Response(JSON.stringify({ 
      success: true,
      room: updatedRoom 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error starting presentation:', error);
    return new Response(JSON.stringify({ error: 'Failed to start presentation' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}