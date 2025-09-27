#!/usr/bin/env node

/**
 * Comprehensive Game Flow Test for WebSocket Senryu Game
 * Tests the complete game flow from room creation to game completion
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8788/api/senryu';
const WS_BASE = 'ws://localhost:8788';

class GameFlowTester {
  constructor() {
    this.roomId = null;
    this.roomCode = null;
    this.players = [];
    this.connections = [];
  }

  async runTest() {
    console.log('🎮 Starting Comprehensive Game Flow Test');
    console.log('=====================================\n');

    try {
      // Step 1: Create a room
      await this.createRoom();
      
      // Step 2: Connect host player via WebSocket
      await this.connectHost();
      
      // Step 3: Connect additional players
      await this.connectPlayers(2);
      
      // Step 4: Start the game
      await this.startGame();
      
      // Step 5: Simulate presentation flow
      await this.simulatePresentation();
      
      // Step 6: Submit scores
      await this.submitScores();
      
      // Step 7: Complete the game
      await this.completeGame();
      
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  async createRoom() {
    console.log('📦 Step 1: Creating room...');
    
    const response = await fetch(`${API_BASE}/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName: 'テストホスト',
        roomCode: 'TEST' + Math.random().toString(36).substr(2, 4).toUpperCase()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.status}`);
    }

    const data = await response.json();
    this.roomId = data.room.id;
    this.roomCode = data.room.code;
    
    console.log(`   ✓ Room created: ${this.roomCode} (${this.roomId})`);
  }

  connectHost() {
    return new Promise((resolve, reject) => {
      console.log('\n👑 Step 2: Connecting host...');
      
      const hostPlayer = {
        id: 'host_' + Date.now(),
        name: 'ホストプレイヤー',
        ws: null
      };
      
      const ws = new WebSocket(`${WS_BASE}/api/senryu/ws-room/${this.roomId}`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'join',
          playerId: hostPlayer.id,
          playerName: hostPlayer.name
        }));
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'connected') {
          console.log(`   ✓ Host connected: ${hostPlayer.name}`);
          hostPlayer.ws = ws;
          this.players.push(hostPlayer);
          this.connections.push(ws);
          resolve();
        }
        
        if (msg.type === 'error') {
          reject(new Error(msg.message));
        }
      });

      ws.on('error', reject);
    });
  }

  async connectPlayers(count) {
    console.log(`\n👥 Step 3: Connecting ${count} additional players...`);
    
    for (let i = 0; i < count; i++) {
      await this.connectPlayer(i + 1);
      await this.delay(500); // Small delay between connections
    }
  }

  connectPlayer(index) {
    return new Promise((resolve, reject) => {
      const player = {
        id: `player_${index}_${Date.now()}`,
        name: `プレイヤー${index}`,
        ws: null
      };
      
      const ws = new WebSocket(`${WS_BASE}/api/senryu/ws-room/${this.roomId}`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'join',
          playerId: player.id,
          playerName: player.name
        }));
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'connected' || msg.type === 'player_joined') {
          console.log(`   ✓ Player ${index} connected: ${player.name}`);
          player.ws = ws;
          this.players.push(player);
          this.connections.push(ws);
          resolve();
        }
        
        if (msg.type === 'error') {
          reject(new Error(msg.message));
        }
      });

      ws.on('error', reject);
    });
  }

  startGame() {
    return new Promise((resolve, reject) => {
      console.log('\n🎯 Step 4: Starting game...');
      
      const host = this.players[0];
      
      // Listen for game started event
      host.ws.once('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'game_started') {
          console.log('   ✓ Game started successfully');
          console.log(`   ✓ Status changed to: ${msg.room.status}`);
          resolve();
        }
      });

      // Send start game command
      host.ws.send(JSON.stringify({
        type: 'start_game',
        playerId: host.id,
        config: {
          presentationTimeLimit: 60,
          numberOfSets: 3
        }
      }));
    });
  }

  async simulatePresentation() {
    console.log('\n🎤 Step 5: Simulating presentation...');
    
    // Start presentation
    await this.sendHostCommand('start_presentation', {});
    console.log('   ✓ Presentation started');
    
    await this.delay(1000);
    
    // Move to next presenter
    await this.sendHostCommand('next_presenter', {});
    console.log('   ✓ Moved to next presenter');
    
    await this.delay(1000);
  }

  async submitScores() {
    console.log('\n📝 Step 6: Submitting scores...');
    
    // Each player submits scores for others
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const scores = {};
      
      // Generate random scores for other players
      for (let j = 0; j < this.players.length; j++) {
        if (i !== j) {
          scores[this.players[j].id] = {
            creativity: Math.floor(Math.random() * 10) + 1,
            humor: Math.floor(Math.random() * 10) + 1,
            technique: Math.floor(Math.random() * 10) + 1
          };
        }
      }
      
      player.ws.send(JSON.stringify({
        type: 'submit_score',
        playerId: player.id,
        scores: scores
      }));
      
      console.log(`   ✓ Player ${i + 1} submitted scores`);
      await this.delay(500);
    }
  }

  async completeGame() {
    console.log('\n🏁 Step 7: Completing game...');
    
    await this.sendHostCommand('end_game', {});
    console.log('   ✓ Game ended');
    
    // Check for results
    return new Promise((resolve) => {
      this.players[0].ws.once('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'game_completed' || (msg.type === 'room_update' && msg.room.status === 'finished')) {
          console.log('   ✓ Game completed successfully');
          if (msg.room.results && msg.room.results.winner) {
            console.log(`   🏆 Winner: ${msg.room.results.winner.name}`);
          }
          resolve();
        }
      });
    });
  }

  sendHostCommand(type, data) {
    return new Promise((resolve) => {
      const host = this.players[0];
      host.ws.send(JSON.stringify({
        type: type,
        playerId: host.id,
        ...data
      }));
      
      setTimeout(resolve, 500);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    for (const ws of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Test completed');
      }
    }
  }
}

// Run the test
const tester = new GameFlowTester();
tester.runTest().catch(console.error);