/**
 * Senryu Room Durable Object
 * WebSocket connections and game state management
 */

export class SenryuRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // WebSocket connections
    this.room = null; // Room data
    
    // Initialize room from state if exists
    this.state.blockConcurrencyWhile(async () => {
      const storedRoom = await this.state.storage.get('room');
      if (storedRoom) {
        this.room = storedRoom;
      }
    });
  }

  // Handle HTTP requests (WebSocket upgrade)
  async fetch(request) {
    const url = new URL(request.url);
    
    // WebSocket upgrade request
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }
    
    // REST API endpoints for room management
    const method = request.method;
    const path = url.pathname;
    
    if (method === 'POST' && path === '/create') {
      return this.handleCreateRoom(request);
    } else if (method === 'GET' && path === '/status') {
      return this.handleGetStatus();
    } else if (method === 'POST' && path === '/join') {
      return this.handleJoinRoom(request);
    } else if (method === 'POST' && path === '/start') {
      return this.handleStartGame(request);
    } else if (method === 'POST' && path === '/score') {
      return this.handleSubmitScore(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  // WebSocket handler
  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // Accept WebSocket connection
    this.state.acceptWebSocket(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // WebSocket message handler
  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          await this.handlePlayerJoin(ws, data);
          break;
        case 'leave':
          await this.handlePlayerLeave(ws, data);
          break;
        case 'start_game':
          await this.handleStartGameWS(ws, data);
          break;
        case 'submit_score':
          await this.handleSubmitScoreWS(ws, data);
          break;
        case 'start_presentation':
          await this.handleStartPresentation(ws, data);
          break;
        case 'next_presenter':
          await this.handleNextPresenter(ws, data);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  }

  // WebSocket close handler
  async webSocketClose(ws, code, reason, wasClean) {
    const sessionId = this.getSessionId(ws);
    if (sessionId) {
      this.sessions.delete(sessionId);
      await this.broadcast({
        type: 'player_left',
        playerId: sessionId,
        room: this.room
      }, sessionId);
    }
  }

  // Create room
  async handleCreateRoom(request) {
    const body = await request.json();
    const { hostName, roomCode, roomId } = body;
    
    const hostPlayer = {
      id: `player_${Date.now()}`,
      name: hostName,
      isHost: true,
      joinedAt: new Date().toISOString(),
      scores: [],
      totalScore: 0,
      senryu: null
    };
    
    this.room = {
      id: roomId,
      code: roomCode,
      host: hostPlayer.id,
      players: [hostPlayer],
      gameState: 'waiting',
      currentPresenterIndex: 0,
      currentSet: 0,
      totalSets: 3,
      presentationTimeLimit: 60,
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      distributedCards: {},
      submittedScores: {},
      results: null
    };
    
    // Save to state storage
    await this.state.storage.put('room', this.room);
    
    return new Response(JSON.stringify({
      room: this.room,
      playerId: hostPlayer.id
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Join room
  async handleJoinRoom(request) {
    const body = await request.json();
    const { playerName } = body;
    
    if (!this.room) {
      return new Response(JSON.stringify({
        error: 'Room not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (this.room.gameState !== 'waiting') {
      return new Response(JSON.stringify({
        error: 'Game already started'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const player = {
      id: `player_${Date.now()}`,
      name: playerName,
      isHost: false,
      joinedAt: new Date().toISOString(),
      scores: [],
      totalScore: 0,
      senryu: null
    };
    
    this.room.players.push(player);
    
    // Save and broadcast
    await this.state.storage.put('room', this.room);
    await this.broadcast({
      type: 'player_joined',
      player,
      room: this.room
    });
    
    return new Response(JSON.stringify({
      room: this.room,
      playerId: player.id
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Get room status
  async handleGetStatus() {
    if (!this.room) {
      return new Response(JSON.stringify({
        error: 'Room not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({
      room: this.room
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Player joins via WebSocket
  async handlePlayerJoin(ws, data) {
    const { playerId } = data;
    
    // Store WebSocket connection
    this.sessions.set(playerId, ws);
    
    // Send current room state
    ws.send(JSON.stringify({
      type: 'connected',
      room: this.room,
      playerId
    }));
    
    // Notify others
    await this.broadcast({
      type: 'player_online',
      playerId,
      room: this.room
    }, playerId);
  }

  // Player leaves via WebSocket
  async handlePlayerLeave(ws, data) {
    const { playerId } = data;
    
    this.sessions.delete(playerId);
    
    // Update room if needed
    if (this.room && this.room.players) {
      const player = this.room.players.find(p => p.id === playerId);
      if (player) {
        player.online = false;
        await this.state.storage.put('room', this.room);
      }
    }
    
    // Notify others
    await this.broadcast({
      type: 'player_offline',
      playerId,
      room: this.room
    }, playerId);
  }

  // Start game
  async handleStartGameWS(ws, data) {
    const { playerId } = data;
    
    if (!this.room || this.room.host !== playerId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only host can start the game'
      }));
      return;
    }
    
    if (this.room.players.length < 2) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Need at least 2 players'
      }));
      return;
    }
    
    // Distribute senryu cards (simplified for now)
    const senryuCards = await this.generateSenryuCards(this.room.players.length);
    this.room.players.forEach((player, index) => {
      player.senryu = senryuCards[index];
    });
    
    this.room.gameState = 'presenting';
    this.room.currentPresenterIndex = 0;
    this.room.startedAt = new Date().toISOString();
    
    await this.state.storage.put('room', this.room);
    
    // Broadcast game start
    await this.broadcast({
      type: 'game_started',
      room: this.room
    });
  }

  // Submit score
  async handleSubmitScoreWS(ws, data) {
    const { playerId, targetPlayerId, scores } = data;
    
    if (!this.room || this.room.gameState !== 'scoring') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in scoring phase'
      }));
      return;
    }
    
    // Store scores
    if (!this.room.submittedScores[this.room.currentPresenterIndex]) {
      this.room.submittedScores[this.room.currentPresenterIndex] = {};
    }
    
    this.room.submittedScores[this.room.currentPresenterIndex][playerId] = {
      targetPlayerId,
      scores,
      timestamp: Date.now()
    };
    
    // Check if all scores submitted
    const expectedScores = this.room.players.length - 1; // Exclude presenter
    const submittedCount = Object.keys(this.room.submittedScores[this.room.currentPresenterIndex]).length;
    
    if (submittedCount >= expectedScores) {
      // Calculate total scores
      await this.calculateScores();
      
      // Move to next presenter or end game
      if (this.room.currentPresenterIndex < this.room.players.length - 1) {
        this.room.currentPresenterIndex++;
        this.room.gameState = 'presenting';
      } else {
        this.room.gameState = 'completed';
        this.room.endedAt = new Date().toISOString();
        await this.calculateFinalResults();
      }
    }
    
    await this.state.storage.put('room', this.room);
    
    // Broadcast update
    await this.broadcast({
      type: 'room_update',
      room: this.room
    });
  }

  // Helper: Generate senryu cards
  async generateSenryuCards(count) {
    // Simplified senryu generation
    const upperCards = [
      { text: 'Kubernetes', category: 'cloudnative' },
      { text: 'Docker', category: 'cloudnative' },
      { text: 'サーバーレス', category: 'cloudnative' },
      { text: 'マイクロサービス', category: 'architecture' }
    ];
    
    const middleCards = [
      { text: '朝から夜まで', category: 'temporal' },
      { text: 'コンテナいっぱい', category: 'quantity' },
      { text: 'デバッグ三昧', category: 'action' },
      { text: 'スケールアウトで', category: 'action' }
    ];
    
    const lowerCards = [
      { text: 'ずっとエラー', category: 'result' },
      { text: '腹ペコだ', category: 'daily' },
      { text: '夢に出る', category: 'daily' },
      { text: '完全勝利', category: 'result' }
    ];
    
    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push({
        upper: upperCards[i % upperCards.length],
        middle: middleCards[i % middleCards.length],
        lower: lowerCards[i % lowerCards.length]
      });
    }
    
    return cards;
  }

  // Helper: Calculate scores
  async calculateScores() {
    // Implementation for score calculation
    const presenterIndex = this.room.currentPresenterIndex;
    const presenter = this.room.players[presenterIndex];
    const scores = this.room.submittedScores[presenterIndex];
    
    let totalScore = 0;
    let scoreCount = 0;
    
    Object.values(scores).forEach(submission => {
      Object.values(submission.scores).forEach(score => {
        totalScore += score;
        scoreCount++;
      });
    });
    
    if (scoreCount > 0) {
      presenter.totalScore = Math.round(totalScore / scoreCount);
    }
  }

  // Helper: Calculate final results
  async calculateFinalResults() {
    // Sort players by total score
    const sortedPlayers = [...this.room.players].sort((a, b) => b.totalScore - a.totalScore);
    
    this.room.results = {
      winner: sortedPlayers[0],
      rankings: sortedPlayers,
      timestamp: Date.now()
    };
  }

  // Helper: Broadcast to all connected clients
  async broadcast(message, excludeId = null) {
    const messageStr = JSON.stringify(message);
    
    for (const [sessionId, ws] of this.sessions) {
      if (sessionId !== excludeId) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error(`Failed to send to ${sessionId}:`, error);
          this.sessions.delete(sessionId);
        }
      }
    }
  }

  // Helper: Get session ID from WebSocket
  getSessionId(ws) {
    for (const [id, socket] of this.sessions) {
      if (socket === ws) {
        return id;
      }
    }
    return null;
  }
}

// Export the Durable Object
export default {
  async fetch(request, env) {
    return new Response('This is a Durable Object endpoint', { status: 200 });
  }
};