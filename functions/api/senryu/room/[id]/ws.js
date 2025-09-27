/**
 * WebSocket endpoint for Senryu game rooms
 * Connects to Durable Object
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    return new Response('Expected WebSocket upgrade', {
      status: 426,
      headers: corsHeaders
    });
  }
  
  // Get or create Durable Object instance for this room
  const durableObjectId = env.SENRYU_ROOM.idFromName(roomId);
  const durableObject = env.SENRYU_ROOM.get(durableObjectId);
  
  // Forward the request to the Durable Object
  const url = new URL(request.url);
  url.pathname = '/ws'; // Durable Object will handle WebSocket at /ws path
  
  return durableObject.fetch(new Request(url, request));
}