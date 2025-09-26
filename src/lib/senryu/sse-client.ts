/**
 * Server-Sent Events (SSE) クライアント
 * リアルタイムルーム更新用
 */

export type SSEEventType = 'connected' | 'roomUpdate' | 'error' | 'heartbeat';

export interface SSEMessage {
  type: SSEEventType;
  room?: any;
  message?: string;
  timestamp?: number;
  roomId?: string;
  playerId?: string;
}

export class SenryuSSEClient {
  private eventSource: EventSource | null = null;
  private roomId: string;
  private playerId: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(roomId: string, playerId: string) {
    this.roomId = roomId;
    this.playerId = playerId;
  }

  /**
   * SSE接続を開始
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.eventSource?.readyState === EventSource.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;

      const url = `/api/senryu/room-sse?id=${this.roomId}&playerId=${this.playerId}`;

      try {
        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
          console.log('[SSE] Connected to room:', this.roomId);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data: SSEMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[SSE] Failed to parse message:', error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('[SSE] Connection error:', error);
          this.isConnecting = false;
          
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.handleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * メッセージを処理
   */
  private handleMessage(data: SSEMessage) {
    switch (data.type) {
      case 'connected':
        console.log('[SSE] Connected confirmed');
        this.emit('connected', data);
        break;
      
      case 'roomUpdate':
        this.emit('roomUpdate', data.room);
        break;
      
      case 'error':
        console.error('[SSE] Server error:', data.message);
        this.emit('error', data);
        break;
      
      default:
        // その他のメッセージタイプ
        this.emit(data.type, data);
    }
  }

  /**
   * 再接続処理
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      this.emit('maxReconnectReached', null);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[SSE] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * イベントリスナーを登録
   */
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * イベントリスナーを削除
   */
  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * イベントを発火
   */
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[SSE] Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * 接続を切断
   */
  disconnect() {
    if (this.eventSource) {
      console.log('[SSE] Disconnecting from room:', this.roomId);
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  /**
   * 接続状態を取得
   */
  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * 接続状態を取得（詳細）
   */
  get readyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED;
  }
}