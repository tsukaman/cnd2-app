/**
 * Senryu Durable Objects Worker
 *
 * This Worker hosts the SenryuRoom Durable Object and handles WebSocket connections
 * for the multiplayer Senryu game.
 */

// Export the Durable Object class
export { SenryuRoom } from '../../functions/durable-objects/SenryuRoom.js';

/**
 * Main Worker fetch handler
 * Routes requests to the appropriate Durable Object instance
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'senryu-durable-objects',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract room ID from query parameter
    const roomId = url.searchParams.get('roomId');

    if (!roomId) {
      return new Response(JSON.stringify({
        error: 'Missing roomId parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get Durable Object instance for this room
    const id = env.SENRYU_ROOM.idFromName(roomId);
    const stub = env.SENRYU_ROOM.get(id);

    // Forward the request to the Durable Object
    return stub.fetch(request);
  }
};
