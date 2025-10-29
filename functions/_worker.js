/**
 * Cloudflare Pages Advanced Mode Worker
 * Exports Durable Objects for the application
 */

// Import the Durable Object class
export { SenryuRoom } from './durable-objects/SenryuRoom.js';

/**
 * Default export to handle requests
 * This allows the Pages Functions to continue working normally
 */
export default {
  async fetch(request, env, ctx) {
    // Pass through to Pages Functions
    return env.ASSETS.fetch(request);
  }
};
