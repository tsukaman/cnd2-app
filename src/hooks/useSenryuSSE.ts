import { useEffect, useRef, useState, useCallback } from 'react';
import { SenryuSSEClient } from '@/lib/senryu/sse-client';
import type { Room } from '@/lib/senryu/types';

interface UseSSEOptions {
  onRoomUpdate?: (room: Room) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export function useSenryuSSE(
  roomId: string | null,
  playerId: string | null,
  options: UseSSEOptions = {}
) {
  const { onRoomUpdate, onError, enabled = true } = options;
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sseClient = useRef<SenryuSSEClient | null>(null);

  // ルーム更新ハンドラー
  const handleRoomUpdate = useCallback((roomData: Room) => {
    console.log('[useSenryuSSE] Room update received:', roomData);
    setRoom(roomData);
    onRoomUpdate?.(roomData);
  }, [onRoomUpdate]);

  // エラーハンドラー
  const handleError = useCallback((errorData: any) => {
    console.error('[useSenryuSSE] Error:', errorData);
    const err = new Error(errorData?.message || 'SSE connection error');
    setError(err);
    onError?.(err);
  }, [onError]);

  // 接続ハンドラー
  const handleConnected = useCallback(() => {
    console.log('[useSenryuSSE] Connected');
    setIsConnected(true);
    setError(null);
  }, []);

  // 最大再接続回数到達ハンドラー
  const handleMaxReconnect = useCallback(() => {
    console.error('[useSenryuSSE] Max reconnection attempts reached');
    setIsConnected(false);
    setError(new Error('Connection lost. Please refresh the page.'));
  }, []);

  // SSE接続を確立
  useEffect(() => {
    if (!enabled || !roomId || !playerId) {
      return;
    }

    setIsLoading(true);

    // SSEクライアントを作成
    const client = new SenryuSSEClient(roomId, playerId);
    sseClient.current = client;

    // イベントリスナーを登録
    client.on('connected', handleConnected);
    client.on('roomUpdate', handleRoomUpdate);
    client.on('error', handleError);
    client.on('maxReconnectReached', handleMaxReconnect);

    // 接続を開始
    client.connect()
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[useSenryuSSE] Failed to connect:', err);
        setError(err);
        setIsLoading(false);
      });

    // クリーンアップ
    return () => {
      console.log('[useSenryuSSE] Cleaning up SSE connection');
      client.disconnect();
      sseClient.current = null;
      setIsConnected(false);
    };
  }, [enabled, roomId, playerId, handleConnected, handleRoomUpdate, handleError, handleMaxReconnect]);

  // 手動再接続
  const reconnect = useCallback(() => {
    if (sseClient.current && !sseClient.current.isConnected) {
      sseClient.current.connect().catch(console.error);
    }
  }, []);

  return {
    room,
    isConnected,
    isLoading,
    error,
    reconnect,
  };
}