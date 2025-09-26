/**
 * WebSocket endpoint for Senryu game rooms
 * Simplified implementation without Durable Objects for testing
 */

// In-memory storage for rooms (development only)
const rooms = new Map();
const connections = new Map(); // roomId -> Set of WebSocket connections

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
  'Access-Control-Max-Age': '86400'
};

// Handle OPTIONS request
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Handle WebSocket upgrade
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const roomId = params.id;
  
  // Check for WebSocket upgrade
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    // Return room status for regular GET request
    const room = await getRoomFromKV(env, roomId);
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return new Response(JSON.stringify({ room }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  // Handle WebSocket connection
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  
  // Handle WebSocket server
  handleWebSocket(server, roomId, env);
  
  // Return the client socket
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

// Handle room creation
export async function onRequestPost(context) {
  const { request, env, params } = context;
  const roomId = params.id;
  const body = await request.json();
  
  const { action, data } = body;
  
  if (action === 'create') {
    const room = await createRoom(env, roomId, data);
    return new Response(JSON.stringify({ room }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// WebSocket handler
function handleWebSocket(ws, roomId, env) {
  // Add to connections
  if (!connections.has(roomId)) {
    connections.set(roomId, new Set());
  }
  connections.get(roomId).add(ws);
  
  let playerId = null;
  
  ws.accept();
  
  ws.addEventListener('message', async event => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Message received:', data.type, 'for room:', roomId);
      
      switch (data.type) {
        case 'join':
          playerId = data.playerId;
          // Send current room state
          let room = await getRoomFromKV(env, roomId);
          
          // Create a simple room if it doesn't exist
          if (!room) {
            // Extract room code from roomId (format: room_timestamp_CODE)
            const parts = roomId.split('_');
            const code = parts[parts.length - 1];
            
            room = {
              id: roomId,
              code: code || 'TEST',
              hostId: playerId,
              players: [{
                id: playerId,
                name: 'Player 1',
                isHost: true,
                joinedAt: new Date().toISOString()
              }],
              status: 'waiting',
              createdAt: new Date().toISOString()
            };
            
            await saveRoomToKV(env, roomId, room);
          }
          
          ws.send(JSON.stringify({
            type: 'connected',
            room,
            playerId
          }));
          
          // Notify others
          broadcast(roomId, {
            type: 'player_online',
            playerId,
            room
          }, ws);
          break;
          
        case 'leave':
          broadcast(roomId, {
            type: 'player_offline',
            playerId: data.playerId
          }, ws);
          break;
          
        case 'start_game':
          // Update room state
          const gameRoom = await getRoomFromKV(env, roomId);
          if (gameRoom) {
            gameRoom.status = 'presenting';
            gameRoom.currentPresenterIndex = 0;
            gameRoom.startedAt = new Date().toISOString();
            
            // Generate simple senryu for each player
            gameRoom.players.forEach((player, index) => {
              player.senryu = generateSenryu(index);
            });
            
            await saveRoomToKV(env, roomId, gameRoom);
            
            // Broadcast game start
            broadcast(roomId, {
              type: 'game_started',
              room: gameRoom
            });
            
            // Also send room_update
            broadcast(roomId, {
              type: 'room_update',
              room: gameRoom
            });
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          console.log('[WebSocket] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[WebSocket] Message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message || 'Invalid message'
      }));
    }
  });
  
  ws.addEventListener('close', () => {
    console.log('[WebSocket] Connection closed for room:', roomId);
    const roomConnections = connections.get(roomId);
    if (roomConnections) {
      roomConnections.delete(ws);
      if (roomConnections.size === 0) {
        connections.delete(roomId);
      }
    }
    
    // Notify others
    if (playerId) {
      broadcast(roomId, {
        type: 'player_left',
        playerId
      }, ws);
    }
  });
  
  ws.addEventListener('error', error => {
    console.error('[WebSocket] Error:', error);
  });
}

// Broadcast to all connections in a room
function broadcast(roomId, message, exclude = null) {
  const roomConnections = connections.get(roomId);
  if (roomConnections) {
    const messageStr = JSON.stringify(message);
    roomConnections.forEach(ws => {
      if (ws !== exclude && ws.readyState === 1) { // OPEN
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('[WebSocket] Broadcast error:', error);
        }
      }
    });
  }
}

// Get room from KV
async function getRoomFromKV(env, roomId) {
  if (env.SENRYU_KV) {
    const roomData = await env.SENRYU_KV.get(`room:${roomId}`);
    if (roomData) {
      return JSON.parse(roomData);
    }
  }
  
  // Fallback to in-memory
  return rooms.get(roomId);
}

// Save room to KV
async function saveRoomToKV(env, roomId, room) {
  if (env.SENRYU_KV) {
    await env.SENRYU_KV.put(
      `room:${roomId}`,
      JSON.stringify(room),
      { expirationTtl: 604800 } // 7 days
    );
  }
  
  // Also save to in-memory
  rooms.set(roomId, room);
}

// Create room
async function createRoom(env, roomId, data) {
  const { hostName, roomCode } = data;
  
  const hostPlayer = {
    id: `player_${Date.now()}`,
    name: hostName,
    isHost: true,
    joinedAt: new Date().toISOString(),
    scores: [],
    totalScore: 0,
    senryu: null
  };
  
  const room = {
    id: roomId,
    code: roomCode,
    host: hostPlayer.id,
    players: [hostPlayer],
    status: 'waiting',
    currentPresenterIndex: 0,
    createdAt: new Date().toISOString()
  };
  
  await saveRoomToKV(env, roomId, room);
  
  return room;
}

// Generate simple senryu
function generateSenryu(index) {
  const senryus = [
    {
      upper: { text: 'Kubernetes', category: 'cloudnative' },
      middle: { text: '朝から夜まで', category: 'temporal' },
      lower: { text: 'ずっとエラー', category: 'result' }
    },
    {
      upper: { text: 'Docker', category: 'cloudnative' },
      middle: { text: 'コンテナいっぱい', category: 'quantity' },
      lower: { text: '腹ペコだ', category: 'daily' }
    },
    {
      upper: { text: 'サーバーレス', category: 'cloudnative' },
      middle: { text: 'デバッグ三昧', category: 'action' },
      lower: { text: '夢に出る', category: 'daily' }
    }
  ];
  
  return senryus[index % senryus.length];
}