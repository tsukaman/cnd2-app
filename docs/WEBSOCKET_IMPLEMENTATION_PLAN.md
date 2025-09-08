# WebSocket実装計画 - CloudNative川柳ゲーム

## 📋 概要

現在の2秒ポーリング方式からWebSocketによるリアルタイム通信への移行計画。

## 🔄 現在の実装（ポーリング方式）

- **更新間隔**: 2秒ごとにAPIを呼び出し
- **ストレージ**: Cloudflare KVに全データを保存
- **問題点**:
  - 最大2秒のラグが発生
  - 不要なAPIリクエストが多い
  - リアルタイム性が低い

## ⚡ WebSocket実装のメリット

1. **リアルタイム同期**: 即座に全プレイヤーに反映
2. **低遅延**: ミリ秒単位での更新
3. **効率的**: 必要な時だけデータ送信
4. **接続管理**: オンライン状態を正確に把握

## 🏗️ 技術アーキテクチャ

### Cloudflare Durable Objects

```javascript
// functions/room-websocket.js
export class SenryuRoomDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.room = null;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketUpgrade(request);
    }
    return this.handleHttpRequest(request);
  }

  handleWebSocketUpgrade(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    this.handleSession(server, request);
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(webSocket, request) {
    webSocket.accept();
    const session = { webSocket, playerId: null };
    this.sessions.push(session);

    webSocket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);
      await this.handleMessage(session, data);
    });

    webSocket.addEventListener("close", () => {
      this.sessions = this.sessions.filter(s => s !== session);
      this.broadcast({
        type: "playerLeft",
        playerId: session.playerId
      });
    });
  }

  async handleMessage(session, data) {
    switch (data.type) {
      case "join":
        session.playerId = data.playerId;
        await this.handlePlayerJoin(session, data);
        break;
      case "startPresentation":
        await this.handleStartPresentation(data);
        break;
      case "submitScore":
        await this.handleScoreSubmit(data);
        break;
      // ... その他のイベント
    }
  }

  broadcast(message, exclude = null) {
    const messageStr = JSON.stringify(message);
    this.sessions.forEach(session => {
      if (session !== exclude && session.webSocket.readyState === 1) {
        session.webSocket.send(messageStr);
      }
    });
  }
}
```

### クライアント側実装

```typescript
// lib/senryu/websocket-client.ts
export class SenryuWebSocketClient {
  private ws: WebSocket | null = null;
  private roomId: string;
  private playerId: string;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(roomId: string, playerId: string) {
    this.roomId = roomId;
    this.playerId = playerId;
  }

  connect() {
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://cnd2.cloudnativedays.jp/api/ws/room/${this.roomId}`
      : `ws://localhost:8788/api/ws/room/${this.roomId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.send({
        type: 'join',
        playerId: this.playerId,
        roomId: this.roomId
      });
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  disconnect() {
    this.ws?.close();
  }
}
```

### React Hook実装

```typescript
// hooks/useSenryuWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { SenryuWebSocketClient } from '@/lib/senryu/websocket-client';

export function useSenryuWebSocket(roomId: string, playerId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsClient = useRef<SenryuWebSocketClient | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;

    wsClient.current = new SenryuWebSocketClient(roomId, playerId);
    
    wsClient.current.on('roomUpdate', (data) => {
      setRoom(data.room);
    });

    wsClient.current.on('playerJoined', (data) => {
      setRoom(prev => ({
        ...prev!,
        players: [...(prev?.players || []), data.player]
      }));
    });

    wsClient.current.on('gameStateChange', (data) => {
      setRoom(prev => ({
        ...prev!,
        gameState: data.gameState
      }));
    });

    wsClient.current.connect();
    setIsConnected(true);

    return () => {
      wsClient.current?.disconnect();
      setIsConnected(false);
    };
  }, [roomId, playerId]);

  const sendMessage = (type: string, data: any) => {
    wsClient.current?.send({ type, ...data });
  };

  return {
    room,
    isConnected,
    sendMessage
  };
}
```

## 📦 必要な設定変更

### 1. wrangler.toml

```toml
name = "cnd2-app"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "SENRYU_ROOMS"
class_name = "SenryuRoomDurableObject"
script_name = "room-websocket"

[[migrations]]
tag = "v1"
new_classes = ["SenryuRoomDurableObject"]
```

### 2. package.json

```json
{
  "scripts": {
    "dev:ws": "wrangler dev --local --persist",
    "deploy:ws": "wrangler publish"
  }
}
```

## 🚀 実装ステップ

### Phase 1: 基盤構築（1-2日）
1. Durable Object クラスの作成
2. WebSocket接続の基本実装
3. ルーティング設定

### Phase 2: クライアント実装（1-2日）
1. WebSocketクライアントクラス
2. React Hook作成
3. 自動再接続機能

### Phase 3: 機能移行（2-3日）
1. 部屋への参加
2. ゲーム開始
3. プレゼン開始/終了
4. 採点送信
5. 結果表示

### Phase 4: 最適化（1日）
1. エラーハンドリング
2. 接続状態表示
3. デバッグツール

## 🎯 期待される改善

- **レスポンス時間**: 2000ms → 50ms（40倍高速化）
- **データ転送量**: 80%削減（必要な更新のみ）
- **ユーザー体験**: シームレスなリアルタイム同期

## ⚠️ 注意事項

1. **料金**: Durable Objectsは有料機能（$5/月 + リクエスト料金）
2. **開発環境**: ローカルでのテストにはwrangler v3が必要
3. **移行期間**: 既存のKVベースも併用して段階的移行

## 📚 参考資料

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [WebSocket API](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation/)
- [Workers WebSocket](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

---

*最終更新: 2025-09-07*