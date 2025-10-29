/**
 * Senryu Room Durable Object
 * Manages WebSocket connections and game state for a single room
 */

export class SenryuRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    // WebSocket sessions: Map<WebSocket, SessionData>
    this.sessions = new Map();

    // Room data
    this.roomData = {
      id: null,
      code: null,
      status: 'waiting', // waiting, presenting, scoring, finished
      players: [],
      currentPresenterIndex: 0,
      currentSet: 1,
      config: {
        presentationTimeLimit: 60,
        numberOfSets: 3
      }
    };

    // Initialize from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('roomData');
      if (stored) {
        this.roomData = stored;
      }
    });
  }

  /**
   * Handle HTTP requests (including WebSocket upgrades)
   */
  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket upgrade endpoint
    if (url.pathname === '/ws') {
      return this.handleWebSocketUpgrade(request);
    }

    // HTTP API endpoints
    if (url.pathname === '/api/room') {
      return this.handleRoomAPI(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle WebSocket upgrade
   */
  async handleWebSocketUpgrade(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept WebSocket connection
    server.accept();

    // Get player ID from URL query parameter
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId');

    if (!playerId) {
      server.close(1008, 'Player ID required');
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // Set up session
    const session = {
      playerId,
      webSocket: server,
      joinedAt: Date.now()
    };

    this.sessions.set(server, session);

    // Set up event listeners
    server.addEventListener('message', (event) => {
      this.handleMessage(server, event.data, session);
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(server, session);
    });

    server.addEventListener('error', (error) => {
      console.error('[Senryu Room] WebSocket error:', error);
      this.handleDisconnect(server, session);
    });

    // Send initial room state
    this.sendToClient(server, {
      type: 'room_state',
      room: this.roomData
    });

    // Notify other players
    this.broadcast({
      type: 'player_joined',
      playerId,
      playerCount: this.roomData.players?.length || 0
    }, server);

    // Return WebSocket response
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(ws, data, session) {
    try {
      const message = JSON.parse(data);
      console.log('[Senryu Room] Received message:', message.type, 'from', session.playerId);

      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong' });
          break;

        case 'start_game':
          await this.handleStartGame(session, message.config);
          break;

        case 'submit_score':
          await this.handleSubmitScore(session, message);
          break;

        case 'start_presentation':
          await this.handleStartPresentation(session);
          break;

        case 'next_presenter':
          await this.handleNextPresenter(session);
          break;

        default:
          console.warn('[Senryu Room] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Senryu Room] Error handling message:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: error.message || 'Unknown error'
      });
    }
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(ws, session) {
    console.log('[Senryu Room] Player disconnected:', session.playerId);
    this.sessions.delete(ws);

    // Notify other players
    this.broadcast({
      type: 'player_left',
      playerId: session.playerId,
      playerCount: this.sessions.size
    });
  }

  /**
   * Handle start game request
   */
  async handleStartGame(session, config) {
    // Verify player is host
    const player = this.roomData.players?.find(p => p.id === session.playerId);
    if (!player || !player.isHost) {
      throw new Error('Only host can start the game');
    }

    // Verify minimum players
    if (this.roomData.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }

    // Update room config
    if (config) {
      this.roomData.config = {
        ...this.roomData.config,
        ...config
      };
    }

    // Distribute senryu to players
    // TODO: Fetch senryu from KV or generate
    const availableSenryu = [
      {
        id: 'temp1',
        upper: { text: 'コンテナが', syllables: 5 },
        middle: { text: '落ちては上がる', syllables: 7 },
        lower: { text: '無限ループ', syllables: 5 }
      },
      {
        id: 'temp2',
        upper: { text: 'デバッグの', syllables: 5 },
        middle: { text: '出力見ながら', syllables: 7 },
        lower: { text: '夜が明ける', syllables: 5 }
      }
    ];

    // Assign senryu to each player
    this.roomData.players = this.roomData.players.map((player, index) => ({
      ...player,
      senryu: availableSenryu[index % availableSenryu.length],
      totalScore: 0
    }));

    // Start game
    this.roomData.status = 'presenting';
    this.roomData.currentPresenterIndex = 0;
    this.roomData.currentSet = 1;

    // Save state
    await this.saveRoomData();

    // Broadcast game start
    this.broadcast({
      type: 'game_started',
      room: this.roomData
    });
  }

  /**
   * Handle score submission
   */
  async handleSubmitScore(session, message) {
    const { targetPlayerId, scores } = message;

    // Find target player
    const targetPlayer = this.roomData.players?.find(p => p.id === targetPlayerId);
    if (!targetPlayer) {
      throw new Error('Target player not found');
    }

    // Calculate total score
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Update player score
    targetPlayer.totalScore = (targetPlayer.totalScore || 0) + totalScore;

    // Save state
    await this.saveRoomData();

    // Broadcast score update
    this.broadcast({
      type: 'score_submitted',
      playerId: session.playerId,
      targetPlayerId,
      scores,
      totalScore: targetPlayer.totalScore
    });
  }

  /**
   * Handle start presentation
   */
  async handleStartPresentation(session) {
    // Verify player is host
    const player = this.roomData.players?.find(p => p.id === session.playerId);
    if (!player || !player.isHost) {
      throw new Error('Only host can start presentation');
    }

    this.roomData.status = 'presenting';
    await this.saveRoomData();

    this.broadcast({
      type: 'presentation_started',
      presenterIndex: this.roomData.currentPresenterIndex
    });
  }

  /**
   * Handle next presenter
   */
  async handleNextPresenter(session) {
    // Verify player is host
    const player = this.roomData.players?.find(p => p.id === session.playerId);
    if (!player || !player.isHost) {
      throw new Error('Only host can advance to next presenter');
    }

    this.roomData.currentPresenterIndex++;

    // Check if all players have presented
    if (this.roomData.currentPresenterIndex >= this.roomData.players.length) {
      // End game
      this.roomData.status = 'finished';

      // Calculate winner
      const winner = this.roomData.players.reduce((max, player) =>
        player.totalScore > max.totalScore ? player : max
      );

      this.roomData.results = {
        winner: {
          name: winner.name,
          totalScore: winner.totalScore
        }
      };

      await this.saveRoomData();

      this.broadcast({
        type: 'game_completed',
        results: this.roomData.results
      });
    } else {
      // Move to next presenter
      await this.saveRoomData();

      this.broadcast({
        type: 'next_presenter',
        presenterIndex: this.roomData.currentPresenterIndex
      });
    }
  }

  /**
   * Handle Room API requests
   */
  async handleRoomAPI(request) {
    if (request.method === 'GET') {
      return new Response(JSON.stringify(this.roomData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      const data = await request.json();

      // Initialize room
      this.roomData = {
        ...this.roomData,
        ...data,
        status: 'waiting',
        players: data.players || []
      };

      await this.saveRoomData();

      return new Response(JSON.stringify(this.roomData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  /**
   * Save room data to storage
   */
  async saveRoomData() {
    await this.state.storage.put('roomData', this.roomData);
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, message) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[Senryu Room] Error sending to client:', error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message, exclude = null) {
    const data = JSON.stringify(message);
    for (const [ws, session] of this.sessions) {
      if (ws !== exclude && ws.readyState === 1) { // 1 = OPEN
        try {
          ws.send(data);
        } catch (error) {
          console.error('[Senryu Room] Error broadcasting to client:', error);
        }
      }
    }
  }
}
