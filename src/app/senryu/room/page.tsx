'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { SenryuDisplay } from '@/components/senryu/SenryuDisplay';
import { PresentationTimer } from '@/components/senryu/PresentationTimer';
import { PreparationTimer } from '@/components/senryu/PreparationTimer';
import { PresentationStartPanel } from '@/components/senryu/PresentationStartPanel';
import { ScoringPanel } from '@/components/senryu/ScoringPanel';
import { PlayerList } from '@/components/senryu/PlayerList';
import { ResultsBoard } from '@/components/senryu/ResultsBoard';
import { RoomQRCode } from '@/components/senryu/RoomQRCode';
import { GameConfigModal } from '@/components/senryu/GameConfigModal';
import { senryuApi } from '@/lib/senryu/api-client';
import { useSenryuSSE } from '@/hooks/useSenryuSSE';
import type { Room, Player, Senryu } from '@/lib/senryu/types';

const POLLING_INTERVAL = 2000; // 2 seconds (フォールバック用)

export default function SenryuGameRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('id');
  
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [hasStartedPresentation, setHasStartedPresentation] = useState(false); // プレゼンを開始したかどうか
  const [showPresenterSenryu, setShowPresenterSenryu] = useState(false); // プレゼンターの川柳を表示するか
  const [useSSE, setUseSSE] = useState(true); // SSEを使用するかどうか
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSE Hook - リアルタイム更新用
  const { 
    room: sseRoom, 
    isConnected: isSSEConnected, 
    isLoading: isSSELoading,
    error: sseError,
    reconnect: sseReconnect
  } = useSenryuSSE(roomId, playerId, {
    enabled: useSSE && !!roomId && !!playerId,
    onRoomUpdate: (roomData: any) => {
      // ゲーム状態の変化を検知
      if (roomData.gameState === 'presenting' && !isPresenting) {
        setIsPresenting(true);
        setHasStartedPresentation(false);
        setShowPresenterSenryu(false);
        // presentationStartedフラグがあればプレゼン開始済みと判断
        if (roomData.presentationStarted) {
          setShowPresenterSenryu(true);
        }
      } else if (roomData.gameState === 'presenting' && roomData.presentationStarted && !showPresenterSenryu) {
        // プレゼン中にpresentationStartedフラグが立ったら川柳を表示
        setShowPresenterSenryu(true);
      } else if (roomData.gameState === 'scoring' && isPresenting) {
        setIsPresenting(false);
      } else if (roomData.gameState === 'results' && !showResults) {
        setShowResults(true);
      }
    },
    onError: (error) => {
      console.error('SSE Error:', error);
      // SSEエラー時はポーリングにフォールバック
      setUseSSE(false);
      toast.warning('リアルタイム接続に問題が発生しました。自動更新モードに切り替えます。');
    }
  });

  // SSEまたはポーリングで取得したルームデータ
  const [pollingRoom, setPollingRoom] = useState<any>(null);
  const room = useSSE ? sseRoom : pollingRoom;
  const isLoading = useSSE ? isSSELoading : !pollingRoom && !sseError;

  // Load player ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPlayerId = localStorage.getItem('senryu-player-id');
      setPlayerId(storedPlayerId);
    }
  }, []);

  // Fetch room status
  const fetchRoomStatus = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const { room: roomData } = await senryuApi.getRoomStatus(roomId);
      setPollingRoom(roomData);
      
      // Check game state transitions
      if (roomData.gameState === 'distributing' && !transitionTimeoutRef.current) {
        // Auto-transition to presenting after 3 seconds
        transitionTimeoutRef.current = setTimeout(async () => {
          if (roomData.hostId === playerId && playerId) {
            try {
              await senryuApi.transitionGameState(roomId, {
                playerId,
                nextState: 'presenting'
              });
            } catch (error) {
              console.error('Failed to transition to presenting:', error);
            }
          }
          transitionTimeoutRef.current = null;
        }, 3000);
      } else if (roomData.gameState === 'presenting' && !isPresenting) {
        setIsPresenting(true);
        // プレゼンターが変わったら状態をリセット
        setHasStartedPresentation(false);
        setShowPresenterSenryu(false);
        // presentationStartedフラグがあればプレゼン開始済みと判断
        if (roomData.presentationStarted) {
          setShowPresenterSenryu(true);
        }
      } else if (roomData.gameState === 'scoring' && isPresenting) {
        setIsPresenting(false);
      } else if (roomData.gameState === 'results' && !showResults) {
        setShowResults(true);
        // Stop polling when game ends
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch room status:', error);
      if (isLoading) {
        toast.error('部屋の情報を取得できませんでした');
        router.push('/senryu');
      }
    }
  }, [roomId, isPresenting, showResults, isLoading, router]);

  // Set up polling (SSE無効時のフォールバック)
  useEffect(() => {
    if (!roomId) {
      router.push('/senryu');
      return;
    }
    
    // SSE使用時はポーリングしない
    if (useSSE) {
      return;
    }
    
    // Initial fetch
    fetchRoomStatus();
    
    // Start polling
    pollingIntervalRef.current = setInterval(fetchRoomStatus, POLLING_INTERVAL);
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [fetchRoomStatus, roomId, router, useSSE]);

  // Open config modal (host only)
  const handleOpenConfig = () => {
    setShowConfigModal(true);
  };
  
  // Start game with config (host only)
  const handleStartGame = async (gameConfig?: any) => {
    if (!playerId || !roomId) {
      toast.error('プレイヤー情報が見つかりません');
      return;
    }
    
    try {
      const { room: updatedRoom } = await senryuApi.startGame(roomId, { 
        playerId,
        gameConfig 
      });
      setPollingRoom(updatedRoom);
      toast.success('ゲームを開始しました！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ゲームの開始に失敗しました');
    }
  };

  // Move to next presenter (host only)
  const handleNextPresenter = async () => {
    if (!playerId || !roomId) return;
    
    try {
      const { room: updatedRoom } = await senryuApi.nextPresenter(roomId, { playerId });
      setPollingRoom(updatedRoom);
    } catch (error) {
      toast.error('次のプレゼンターへの移行に失敗しました');
    }
  };

  // Start presentation handler
  const handleStartPresentation = async () => {
    if (!playerId || !roomId) return;
    
    setHasStartedPresentation(true);
    setShowPresenterSenryu(true);
    
    // APIを呼んでプレゼン開始を通知
    try {
      const { room: updatedRoom } = await senryuApi.startPresentation(roomId, { playerId });
      setPollingRoom(updatedRoom);
    } catch (error) {
      console.error('Failed to notify presentation start:', error);
      // フォールバック：ローカルで管理
      if (room) {
        const updatedRoom = { ...room, presentationStarted: true };
        setPollingRoom(updatedRoom);
      }
    }
  };

  // Presentation complete handler
  const handlePresentationComplete = async () => {
    // プレゼンターが自分のプレゼンを完了させた場合
    const currentPresenter = room?.players?.[room?.currentPresenterIndex];
    const isMyTurn = currentPresenter?.id === playerId;
    
    if (playerId && roomId && isMyTurn) {
      // プレゼンター本人のみが処理を実行
      console.log(`[Timer] ${playerId} completing presentation for room ${roomId}`);
      try {
        // 次のプレゼンターに移行
        const { room: updatedRoom } = await senryuApi.nextPresenter(roomId, { playerId });
        setPollingRoom(updatedRoom);
      } catch (error) {
        console.error('[Timer] Failed to move to next presenter:', error);
        // エラー時はSSE/ポーリングによる状態更新を待つ
      }
    }
  };

  // Submit scores
  const handleScoreSubmit = async (scores: Record<string, number>) => {
    if (!playerId || !room || !roomId) return;
    
    const currentPresenter = room.players[room.currentPresenterIndex];
    if (!currentPresenter) return;
    
    try {
      const { room: updatedRoom, allScoresSubmitted } = await senryuApi.submitScore(roomId, {
        playerId,
        targetPlayerId: currentPresenter.id,
        scores
      });
      
      setPollingRoom(updatedRoom);
      
      if (allScoresSubmitted) {
        toast.success('全員の採点が完了しました！');
      }
    } catch (error) {
      toast.error('採点の送信に失敗しました');
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (confirm('部屋から退出しますか？')) {
      if (typeof window !== 'undefined') {
        // プレイヤーIDとルームIDのみクリア（ユーザー名とランキング設定は保持）
        localStorage.removeItem('senryu-player-id');
        localStorage.removeItem('senryu-room-id');
      }
      router.push('/senryu');
    }
  };

  // Loading state
  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = room.players?.find((p: any) => p.id === playerId);
  const currentPresenter = room.players?.[room.currentPresenterIndex];
  const isMyTurn = currentPresenter?.id === playerId;
  const isHost = currentPlayer?.isHost || room.hostId === playerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-orange-300 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              CloudNative川柳ゲーム
            </h1>
            <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-600 font-medium">
              部屋コード: {room.code}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 接続状態インジケーター */}
            {useSSE && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80">
                <div className={`w-2 h-2 rounded-full ${isSSEConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                <span className="text-xs text-gray-600">
                  {isSSEConnected ? 'リアルタイム' : '接続中...'}
                </span>
              </div>
            )}
            {isHost && <RoomQRCode roomCode={room.code} isHost={isHost} />}
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Players */}
          <div className="lg:col-span-1">
            <PlayerList 
              players={room.players || []}
              currentPresenterId={currentPresenter?.id}
              hostId={room.hostId}
            />
            
            {/* Host Controls */}
            {isHost && room.gameState === 'waiting' && room.players?.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <button
                  onClick={handleOpenConfig}
                  className="w-full py-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all animate-pulse text-lg"
                >
                  🎮 ゲームを開始する（{room.players?.length}人参加中）
                </button>
              </motion.div>
            )}
          </div>

          {/* Center Panel - Game Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waiting State */}
            {room.gameState === 'waiting' && (
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-200 text-center">
                {room.players?.length >= 2 ? (
                  <>
                    {isHost ? (
                      <>
                        <h2 className="text-2xl font-bold mb-4 text-green-600">
                          ゲームを開始できます！
                        </h2>
                        <p className="text-gray-600 mb-6">
                          参加者が揃いました。下のボタンからゲームを開始してください。
                        </p>
                        <div className="text-6xl">🎮</div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">
                          ゲーム開始を待っています
                        </h2>
                        <p className="text-gray-600 mb-6">
                          ホストがゲームを開始するのをお待ちください。
                        </p>
                        <div className="text-6xl animate-pulse">⏳</div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">参加者を待っています...</h2>
                    <p className="text-gray-600 mb-6">
                      あと{2 - (room.players?.length || 0)}人参加するとゲームを開始できます
                    </p>
                    <div className="text-6xl">⏳</div>
                  </>
                )}
              </div>
            )}

            {/* Distributing Cards */}
            {room.gameState === 'distributing' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-200 text-center"
              >
                <h2 className="text-2xl font-bold mb-4">カードを配っています...</h2>
                <div className="text-6xl animate-bounce">🎴</div>
              </motion.div>
            )}

            {/* Show My Cards - 自分のターンまで非表示 */}
            {room.gameState !== 'waiting' && currentPlayer?.senryu && (
              <>
                {/* distributingまたは自分のプレゼンターンの時だけ川柳を表示 */}
                {(room.gameState === 'distributing' || (room.gameState === 'presenting' && isMyTurn)) ? (
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-gray-800">あなたの川柳</h3>
                    <SenryuDisplay 
                      senryu={currentPlayer.senryu}
                      allowRedraw={(room.gameState === 'distributing' || (room.gameState === 'presenting' && isMyTurn && !hasStartedPresentation))}
                      redrawsRemaining={
                        room.gameConfig && room.redrawsUsed && playerId ? {
                          upper: (room.gameConfig.redrawLimits?.upper || 0) - (room.redrawsUsed[playerId]?.upper || 0),
                          middle: (room.gameConfig.redrawLimits?.middle || 0) - (room.redrawsUsed[playerId]?.middle || 0),
                          lower: (room.gameConfig.redrawLimits?.lower || 0) - (room.redrawsUsed[playerId]?.lower || 0)
                        } : undefined
                      }
                      onRedraw={async (cardType) => {
                        if (!playerId || !roomId) return;
                        try {
                          const { room: updatedRoom, newCard } = await senryuApi.redrawCard(roomId, {
                            playerId,
                            cardType
                          });
                          setPollingRoom(updatedRoom);
                        } catch (error) {
                          throw error;
                        }
                      }}
                      showAnimation={false}
                      isPresenting={false}
                    />
                  </div>
                ) : (
                  /* 他の人のプレゼン中は自分の川柳を隠す */
                  room.gameState === 'presenting' && !isMyTurn && (
                    <div className="bg-gray-100 rounded-3xl p-6 shadow-xl border-2 border-gray-300">
                      <h3 className="text-xl font-bold mb-4 text-gray-600">あなたの川柳</h3>
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">🤫</div>
                        <p className="text-gray-500">自分のターンまでお待ちください</p>
                        <p className="text-sm text-gray-400 mt-2">他の人のプレゼンを楽しみましょう</p>
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            {/* Presenting State */}
            {room.gameState === 'presenting' && currentPresenter && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPresenter.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  {isMyTurn ? (
                    <>
                      {!hasStartedPresentation ? (
                        <div className="space-y-4">
                          {/* 準備時間タイマー */}
                          <PreparationTimer
                            duration={room.gameConfig?.preparationTimeLimit || 30}
                            onTimeout={handleStartPresentation}
                            isActive={true}
                          />
                          <PresentationStartPanel
                            onStart={handleStartPresentation}
                            presenterName={currentPresenter.name}
                          />
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-300">
                          <h3 className="text-2xl font-bold mb-4 text-purple-600">
                            あなたのプレゼンタイムです！
                          </h3>
                          <PresentationTimer
                            duration={room.gameConfig?.presentationTimeLimit || room.presentationTimeLimit || 60}
                            onComplete={handlePresentationComplete}
                            isActive={hasStartedPresentation}
                            allowSkip={isMyTurn} // プレゼンター自身が早期終了できる
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {(!showPresenterSenryu && !room.presentationStarted) ? (
                        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200">
                          <h3 className="text-xl font-bold mb-4 text-gray-800">
                            {currentPresenter.name}さんがプレゼン準備中...
                          </h3>
                          <div className="text-center">
                            <div className="text-6xl mb-4 animate-pulse">⏳</div>
                            <p className="text-gray-600">
                              もうすぐプレゼンが始まります
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* プレゼンターの川柳を表示（カードめくり演出付き） */}
                          {currentPresenter.senryu && (
                            <SenryuDisplay
                              senryu={currentPresenter.senryu}
                              allowRedraw={false}
                              showAnimation={true}
                              isPresenting={true}
                            />
                          )}
                          
                          {/* 参加者にもタイマーを表示 */}
                          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">
                              {currentPresenter.name}さんがプレゼン中...
                            </h3>
                            <PresentationTimer
                              duration={room.gameConfig?.presentationTimeLimit || room.presentationTimeLimit || 60}
                              onComplete={() => {
                                // 参加者はタイマー終了を観察するのみ（API呼び出しはしない）
                                if (isMyTurn) {
                                  // プレゼンター本人のみが終了処理を実行
                                  handlePresentationComplete();
                                } else {
                                  console.log('[Timer] Presentation timer completed for observer');
                                }
                              }}
                              isActive={room.presentationStarted || false}
                              allowSkip={isMyTurn} // 自分のターンなら早期終了できる
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Scoring State */}
            {room.gameState === 'scoring' && currentPresenter && !isMyTurn && (
              <ScoringPanel
                targetPlayer={currentPresenter.name}
                targetPlayerId={currentPresenter.id}
                onSubmit={handleScoreSubmit}
                timeLimit={room.gameConfig?.scoringTimeLimit || 60}
                onTimeout={() => {
                  // タイムアウト時の処理（自動送信は ScoringPanel 内で行われる）
                  toast.warning('採点時間が終了しました');
                }}
              />
            )}

            {/* Results State */}
            {room.gameState === 'results' && room.results && (
              <ResultsBoard room={room} />
            )}
          </div>
        </div>
      </main>
      
      {/* Game Config Modal */}
      <GameConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfirm={handleStartGame}
        playerCount={room.players?.length || 0}
      />
    </div>
  );
}