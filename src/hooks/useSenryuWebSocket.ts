/**
 * React Hook for Senryu WebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SenryuWebSocketClient } from '@/lib/senryu/websocket-client';
import type { Room } from '@/lib/senryu/types';

interface UseWebSocketOptions {
  onRoomUpdate?: (room: Room) => void;
  onError?: (error: any) => void;
  onPlayerJoined?: (player: any) => void;
  onPlayerLeft?: (player: any) => void;
  onGameStarted?: () => void;
  onGameCompleted?: (results: any) => void;
  enabled?: boolean;
}

export function useSenryuWebSocket(
  roomId: string | null,
  playerId: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onRoomUpdate,
    onError,
    onPlayerJoined,
    onPlayerLeft,
    onGameStarted,
    onGameCompleted,
    enabled = true
  } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsClient = useRef<SenryuWebSocketClient | null>(null);

  // Room update handler
  const handleRoomUpdate = useCallback((data: any) => {
    console.log('[useWebSocket] Room update received:', data);
    if (data.room) {
      setRoom(data.room);
      onRoomUpdate?.(data.room);
    }
  }, [onRoomUpdate]);

  // Error handler
  const handleError = useCallback((errorData: any) => {
    console.error('[useWebSocket] Error:', errorData);
    const err = new Error(errorData?.message || 'WebSocket connection error');
    setError(err);
    onError?.(err);
    
    // Disconnect if fatal error
    if (errorData?.fatal) {
      setIsConnected(false);
    }
  }, [onError]);

  // Connected handler
  const handleConnected = useCallback((data: any) => {
    console.log('[useWebSocket] Connected:', data);
    setIsConnected(true);
    setError(null);
    
    // Set room data if available
    if (data.room) {
      setRoom(data.room);
      onRoomUpdate?.(data.room);
    }
  }, [onRoomUpdate]);

  // Player joined handler
  const handlePlayerJoined = useCallback((data: any) => {
    console.log('[useWebSocket] Player joined:', data);
    if (data.room) {
      setRoom(data.room);
    }
    onPlayerJoined?.(data.player);
  }, [onPlayerJoined]);

  // Player left handler
  const handlePlayerLeft = useCallback((data: any) => {
    console.log('[useWebSocket] Player left:', data);
    if (data.room) {
      setRoom(data.room);
    }
    onPlayerLeft?.(data.playerId);
  }, [onPlayerLeft]);

  // Game started handler
  const handleGameStarted = useCallback((data: any) => {
    console.log('[useWebSocket] Game started:', data);
    if (data.room) {
      setRoom(data.room);
    }
    onGameStarted?.();
  }, [onGameStarted]);

  // Game completed handler
  const handleGameCompleted = useCallback((data: any) => {
    console.log('[useWebSocket] Game completed:', data);
    if (data.room) {
      setRoom(data.room);
    }
    onGameCompleted?.(data.room.results);
  }, [onGameCompleted]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!roomId || !playerId || !enabled) {
      return;
    }

    setIsLoading(true);

    try {
      // Create WebSocket client
      const client = new SenryuWebSocketClient(roomId, playerId);
      wsClient.current = client;

      // Register event handlers
      client.on('connected', handleConnected);
      client.on('room_update', handleRoomUpdate);
      client.on('player_joined', handlePlayerJoined);
      client.on('player_left', handlePlayerLeft);
      client.on('game_started', handleGameStarted);
      client.on('game_completed', handleGameCompleted);
      client.on('error', handleError);

      // Connect
      await client.connect();
    } catch (err) {
      console.error('[useWebSocket] Connection failed:', err);
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    roomId,
    playerId,
    enabled,
    handleConnected,
    handleRoomUpdate,
    handlePlayerJoined,
    handlePlayerLeft,
    handleGameStarted,
    handleGameCompleted,
    handleError
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsClient.current) {
      console.log('[useWebSocket] Disconnecting');
      wsClient.current.disconnect();
      wsClient.current = null;
      setIsConnected(false);
    }
  }, []);

  // Send message
  const send = useCallback((data: any) => {
    if (wsClient.current?.isConnected) {
      wsClient.current.send(data);
    } else {
      console.error('[useWebSocket] Cannot send, not connected');
    }
  }, []);

  // Effect to manage connection
  useEffect(() => {
    if (enabled && roomId && playerId) {
      connect();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('[useWebSocket] Cleaning up connection');
      disconnect();
    };
  }, [roomId, playerId, enabled]); // Only reconnect when these change

  // Game action methods
  const startGame = useCallback((config?: any) => {
    send({
      type: 'start_game',
      playerId,
      config
    });
  }, [send, playerId]);

  const submitScore = useCallback((targetPlayerId: string, scores: Record<string, number>) => {
    send({
      type: 'submit_score',
      playerId,
      targetPlayerId,
      scores
    });
  }, [send, playerId]);

  const startPresentation = useCallback(() => {
    send({
      type: 'start_presentation',
      playerId
    });
  }, [send, playerId]);

  const nextPresenter = useCallback(() => {
    send({
      type: 'next_presenter',
      playerId
    });
  }, [send, playerId]);

  return {
    room,
    isConnected,
    isLoading,
    error,
    // Actions
    connect,
    disconnect,
    send,
    startGame,
    submitScore,
    startPresentation,
    nextPresenter
  };
}