/**
 * WebSocket client for Senryu game
 */

export type WebSocketEventType = 
  | 'connected'
  | 'player_joined'
  | 'player_left'
  | 'player_online'
  | 'player_offline'
  | 'game_started'
  | 'room_update'
  | 'presentation_started'
  | 'presentation_ended'
  | 'scoring_started'
  | 'scores_submitted'
  | 'game_completed'
  | 'error'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketEventType;
  room?: any;
  player?: any;
  playerId?: string;
  message?: string;
  timestamp?: number;
}

export class SenryuWebSocketClient {
  private ws: WebSocket | null = null;
  private roomId: string;
  private playerId: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(roomId: string, playerId: string) {
    this.roomId = roomId;
    this.playerId = playerId;
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;

      // WebSocket URL configuration
      const WS_BASE = process.env.NODE_ENV === 'development'
        ? 'ws://localhost:8788'
        : window.location.protocol === 'https:' 
          ? `wss://${window.location.host}`
          : `ws://${window.location.host}`;

      const url = `${WS_BASE}/api/senryu/ws-room/${this.roomId}`;

      try {
        console.log('[WebSocket] Connecting to:', url);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Send join message
          this.send({
            type: 'join',
            playerId: this.playerId
          });

          // Start ping interval
          this.startPing();

          // Emit connected event
          this.emit('connected', { roomId: this.roomId, playerId: this.playerId });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            console.log('[WebSocket] Message received:', data.type);
            this.handleMessage(data);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (event) => {
          console.error('[WebSocket] Error:', event);
          this.emit('error', { message: 'WebSocket connection error' });
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();

          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

            setTimeout(() => {
              this.connect().catch(console.error);
            }, delay);
          } else {
            console.error('[WebSocket] Max reconnection attempts reached');
            this.emit('error', { 
              message: 'Connection lost. Please refresh the page.',
              fatal: true
            });
          }
        };
      } catch (error) {
        console.error('[WebSocket] Failed to create WebSocket:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    console.log('[WebSocket] Disconnecting');
    this.stopPing();

    if (this.ws) {
      // Send leave message
      this.send({
        type: 'leave',
        playerId: this.playerId
      });

      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.listeners.clear();
  }

  /**
   * Send message
   */
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('[WebSocket] Cannot send, not connected');
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage) {
    // Emit message to listeners
    this.emit(message.type, message);
  }

  /**
   * Start ping interval
   */
  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get ready state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}