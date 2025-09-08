/**
 * Server-Sent Events (SSE) for real-time room updates
 * Cloudflare Workers implementation
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const roomId = url.searchParams.get('id');
  const playerId = url.searchParams.get('playerId');

  if (!roomId) {
    return new Response('Room ID is required', { status: 400 });
  }

  // SSEヘッダーの設定
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no', // Nginxプロキシバッファリング無効化
  };

  // TransformStreamを使用してSSEストリームを作成
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // クライアントへのメッセージ送信関数
  const sendMessage = async (data) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // ハートビート送信（30秒ごと）
  const sendHeartbeat = async () => {
    await writer.write(encoder.encode(': heartbeat\n\n'));
  };

  // 非同期でルームの状態を監視
  context.waitUntil((async () => {
    try {
      // 初回接続メッセージ
      await sendMessage({
        type: 'connected',
        roomId,
        playerId,
        timestamp: Date.now()
      });

      let previousState = null;
      let heartbeatCounter = 0;

      // ポーリングループ（1秒ごと）
      while (true) {
        try {
          // KVから最新のルーム状態を取得
          const roomKey = `senryu-room:${roomId}`;
          const roomData = await env.SENRYU_KV.get(roomKey, 'json');

          if (!roomData) {
            await sendMessage({
              type: 'error',
              message: 'Room not found'
            });
            break;
          }

          // 状態が変更された場合のみ通知
          const currentStateHash = JSON.stringify({
            gameState: roomData.gameState,
            players: roomData.players?.length,
            currentPresenterIndex: roomData.currentPresenterIndex,
            results: roomData.results ? Object.keys(roomData.results).length : 0
          });

          if (currentStateHash !== previousState) {
            await sendMessage({
              type: 'roomUpdate',
              room: roomData,
              timestamp: Date.now()
            });
            previousState = currentStateHash;
          }

          // ハートビート（30秒ごと）
          heartbeatCounter++;
          if (heartbeatCounter >= 30) {
            await sendHeartbeat();
            heartbeatCounter = 0;
          }

          // 1秒待機
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error('Error in SSE loop:', error);
          await sendMessage({
            type: 'error',
            message: 'Internal server error'
          });
          break;
        }
      }
    } catch (error) {
      console.error('SSE stream error:', error);
    } finally {
      writer.close();
    }
  })());

  return new Response(readable, { headers });
}

// OPTIONS request for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}