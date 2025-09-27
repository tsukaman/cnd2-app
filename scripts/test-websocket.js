#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests the WebSocket implementation for the Senryu game
 */

const WebSocket = require('ws');

// 環境変数による設定外部化（セキュリティ改善）
const WS_BASE = process.env.WS_TEST_URL || 'ws://localhost:8788';
const ROOM_ID = process.env.TEST_ROOM_ID || 'room_1758904576974_7SF7HT';
const PLAYER_ID = 'player_test_' + Date.now();

console.log('🚀 Starting WebSocket Connection Test');
console.log('================================');
console.log(`Server: ${WS_BASE}`);
console.log(`Room ID: ${ROOM_ID}`);
console.log(`Player ID: ${PLAYER_ID}`);
console.log('');

// Create WebSocket connection
const ws = new WebSocket(`${WS_BASE}/api/senryu/ws-room/${ROOM_ID}`);

// Connection opened
ws.on('open', () => {
  console.log('✅ WebSocket connection established');
  
  // Send join message
  const joinMessage = {
    type: 'join',
    playerId: PLAYER_ID
  };
  
  console.log('📤 Sending join message:', joinMessage);
  ws.send(JSON.stringify(joinMessage));
  
  // Send ping after 2 seconds
  setTimeout(() => {
    const pingMessage = { type: 'ping' };
    console.log('📤 Sending ping message:', pingMessage);
    ws.send(JSON.stringify(pingMessage));
  }, 2000);
  
  // Start game after 4 seconds (if we're the host)
  setTimeout(() => {
    const startMessage = {
      type: 'start_game',
      playerId: PLAYER_ID,
      config: {
        presentationTimeLimit: 60,
        numberOfSets: 3
      }
    };
    console.log('📤 Sending start_game message:', startMessage);
    ws.send(JSON.stringify(startMessage));
  }, 4000);
});

// Listen for messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received message:', message.type);
    console.log('   Data:', JSON.stringify(message, null, 2));
    
    // Handle specific message types
    switch(message.type) {
      case 'connected':
        console.log('   ✓ Successfully joined room');
        break;
      case 'pong':
        console.log('   ✓ Ping/Pong mechanism working');
        break;
      case 'game_started':
        console.log('   ✓ Game started successfully');
        break;
      case 'room_update':
        console.log('   ✓ Room state updated');
        break;
      case 'error':
        console.error('   ❌ Error:', message.message);
        break;
    }
  } catch (error) {
    console.error('❌ Failed to parse message:', error);
  }
});

// Connection closed
ws.on('close', (code, reason) => {
  console.log(`\n🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
  process.exit(0);
});

// Connection error
ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

// Clean exit after 10 seconds
setTimeout(() => {
  console.log('\n✅ Test completed successfully');
  ws.close(1000, 'Test completed');
}, 10000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted, closing connection...');
  ws.close(1000, 'User interrupted');
  process.exit(0);
});