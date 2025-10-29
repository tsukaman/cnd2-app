'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSenryuWebSocket } from '@/hooks/useSenryuWebSocket';
import type { Room, Player } from '@/lib/senryu/types';
import { SenryuHeader } from '@/components/senryu/SenryuHeader';

// Extended Room type for WebSocket implementation
interface WSRoom extends Room {
  currentPresenterIndex?: number;
  results?: {
    winner?: {
      name: string;
      totalScore: number;
    };
  };
}

export default function SenryuGameRoomWS() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('id');
  
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  // WebSocket Hook
  const {
    room,
    isConnected,
    isLoading,
    error,
    startGame,
    submitScore,
    startPresentation,
    nextPresenter
  } = useSenryuWebSocket(roomId, playerId, {
    onRoomUpdate: (roomData) => {
      console.log('[Room WS] Room updated:', roomData);
      toast.info('Room updated');
    },
    onPlayerJoined: (player) => {
      console.log('[Room WS] Player joined:', player);
      toast.success(`${player?.name || 'プレイヤー'}が参加しました`);
    },
    onPlayerLeft: (playerId) => {
      console.log('[Room WS] Player left:', playerId);
      toast.info('プレイヤーが退室しました');
    },
    onGameStarted: () => {
      console.log('[Room WS] Game started!');
      toast.success('ゲーム開始！');
    },
    onGameCompleted: (results) => {
      console.log('[Room WS] Game completed:', results);
      toast.success('ゲーム終了！');
    },
    onError: (error) => {
      console.error('[Room WS] Error:', error);
      toast.error(error.message || 'エラーが発生しました');
    }
  });
  
  // Set player ID from localStorage on mount
  useEffect(() => {
    if (roomId) {
      // Use unified key 'senryu-player-id' (same as lobby page)
      const storedPlayerId = localStorage.getItem('senryu-player-id');
      console.log('[Room WS] Retrieved player ID from localStorage:', storedPlayerId);

      if (storedPlayerId) {
        setPlayerId(storedPlayerId);
      } else {
        // If no player ID exists, redirect to lobby
        console.warn('[Room WS] No player ID found, redirecting to lobby');
        toast.error('プレイヤー情報が見つかりません。ロビーから入り直してください。');
        router.push('/senryu');
      }
    }
  }, [roomId, router]);
  
  // Cast room to WSRoom for extended fields
  const wsRoom = room as WSRoom | null;
  
  // Get current player
  const currentPlayer = wsRoom?.players?.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;
  
  // Handle start game
  const handleStartGame = useCallback(() => {
    if (isHost) {
      startGame({
        presentationTimeLimit: 60,
        numberOfSets: 3
      });
    }
  }, [isHost, startGame]);
  
  // Handle score submission
  const handleScoreSubmit = useCallback((targetPlayerId: string, scores: Record<string, number>) => {
    submitScore(targetPlayerId, scores);
  }, [submitScore]);
  
  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>ルームIDが指定されていません</p>
          <button 
            onClick={() => router.push('/senryu')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            ロビーへ戻る
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Navigation Header */}
      <SenryuHeader
        showBackButton={true}
        backTo="/senryu"
        backLabel="ロビーへ戻る"
        confirmBack={wsRoom?.status !== 'waiting'}
        confirmMessage="ゲーム中です。本当に退出しますか？"
        title="対戦ルーム"
      />

      <div className="container mx-auto px-4 py-8">
        {/* CND² Header */}
        <div className="mb-8">
          <div className="text-sm font-medium text-purple-600 uppercase tracking-wide mb-1">
            CND² - Connect 'n' Devise
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent mb-2">
            Senryu Creation Room
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-lg">
              部屋コード: <span className="font-mono font-bold">{wsRoom?.code || '---'}</span>
            </span>
            <span className={`px-3 py-1 rounded-lg ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isConnected ? '🟢 接続中' : '🔴 未接続'}
            </span>
            {isHost && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">
                👑 ホスト
              </span>
            )}
          </div>
        </div>
        
        {/* Connection Status */}
        {isLoading && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p>接続中...</p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">エラー: {error.message}</p>
          </div>
        )}
        
        {/* Room Info */}
        {wsRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Players Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  参加者 ({wsRoom.players?.length || 0}人)
                </h2>
                <div className="space-y-2">
                  {wsRoom.players?.map((player: Player) => (
                    <div 
                      key={player.id}
                      className={`p-3 rounded-lg ${
                        player.id === playerId 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {player.isHost && '👑 '}
                          {player.name}
                          {player.id === playerId && ' (あなた)'}
                        </span>
                        {player.totalScore > 0 && (
                          <span className="text-sm font-bold text-orange-600">
                            {player.totalScore}点
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Game Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  ゲーム状態: {wsRoom.status || 'waiting'}
                </h2>
                
                {/* Waiting State */}
                {wsRoom.status === 'waiting' && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      参加者を待っています...
                    </p>
                    {isHost && wsRoom.players?.length >= 2 && (
                      <button
                        onClick={handleStartGame}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
                      >
                        ゲーム開始
                      </button>
                    )}
                    {isHost && wsRoom.players?.length < 2 && (
                      <p className="text-sm text-gray-500">
                        2人以上でゲームを開始できます
                      </p>
                    )}
                  </div>
                )}
                
                {/* Presenting State */}
                {wsRoom.status === 'presenting' && (
                  <div className="py-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">プレゼンテーション中</h3>
                      {wsRoom.currentPresenterIndex !== undefined && wsRoom.players && (
                        <p className="text-lg text-gray-600">
                          発表者: {wsRoom.players[wsRoom.currentPresenterIndex]?.name}
                        </p>
                      )}
                    </div>
                    
                    {/* Show senryu if player is presenter */}
                    {wsRoom.currentPresenterIndex !== undefined && 
                     wsRoom.players?.[wsRoom.currentPresenterIndex]?.id === playerId &&
                     currentPlayer?.senryu && (
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold mb-4">あなたの川柳</h4>
                        <div className="text-xl font-serif text-center space-y-1">
                          <div>{currentPlayer.senryu.upper.text}</div>
                          <div className="ml-8">{currentPlayer.senryu.middle.text}</div>
                          <div className="ml-16">{currentPlayer.senryu.lower.text}</div>
                        </div>
                      </div>
                    )}
                    
                    {isHost && (
                      <div className="text-center">
                        <button
                          onClick={startPresentation}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg mr-2"
                        >
                          プレゼン開始
                        </button>
                        <button
                          onClick={nextPresenter}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                        >
                          次の発表者へ
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Scoring State */}
                {wsRoom.status === 'scoring' && (
                  <div className="py-8">
                    <h3 className="text-2xl font-bold text-center mb-6">採点時間</h3>
                    <p className="text-center text-gray-600">
                      発表者の川柳を採点してください
                    </p>
                  </div>
                )}
                
                {/* Completed State */}
                {wsRoom.status === 'finished' && (
                  <div className="py-8">
                    <h3 className="text-2xl font-bold text-center mb-6">ゲーム終了！</h3>
                    {wsRoom.results && (
                      <div className="text-center">
                        <div className="text-4xl mb-4">🏆</div>
                        <p className="text-xl font-bold text-orange-600">
                          優勝: {wsRoom.results.winner?.name}
                        </p>
                        <p className="text-lg text-gray-600">
                          スコア: {wsRoom.results.winner?.totalScore}点
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}