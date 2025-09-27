'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PlayerRegistration } from '@/components/senryu/PlayerRegistration';
import { senryuApi } from '@/lib/senryu/api-client';
import { Settings } from 'lucide-react';

export default function SenryuLobby() {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'register'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [rankingPreference, setRankingPreference] = useState<'public' | 'anonymous' | 'none'>('public');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ページロード時にlocalStorageから情報を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ユーザー情報の復元
      const savedPlayerName = localStorage.getItem('senryu-player-name');
      const savedRankingPref = localStorage.getItem('senryu-ranking-preference');
      
      if (savedPlayerName) {
        setPlayerName(savedPlayerName);
      } else {
        // ユーザー名が未設定の場合は最初から設定画面を表示
        setMode('register');
      }
      
      if (savedRankingPref) {
        setRankingPreference(savedRankingPref as 'public' | 'anonymous' | 'none');
      }
      
      // URLパラメータから部屋コードを取得（QRコード経由のアクセス）
      const roomParam = searchParams.get('room');
      if (roomParam) {
        setRoomCode(roomParam);
        // ユーザー名が設定済みの場合のみ参加画面へ
        if (savedPlayerName) {
          setMode('join');
        }
      }
    }
  }, [searchParams]);

  const handleCreateRoom = async () => {
    if (!playerName) {
      setMode('register');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const { room, playerId } = await senryuApi.createRoom({
        hostName: playerName,
        rankingPreference: {
          allowRanking: rankingPreference !== 'none',
          anonymousRanking: rankingPreference === 'anonymous'
        }
      });

      // Store player info in localStorage for reconnection
      if (typeof window !== 'undefined') {
        localStorage.setItem('senryu-player-id', playerId);
        localStorage.setItem('senryu-room-id', room.id);
        localStorage.setItem('senryu-player-name', playerName);
        localStorage.setItem('senryu-ranking-preference', rankingPreference);
      }

      setCreatedRoomCode(room.code);
      toast.success(`部屋を作成しました！コード: ${room.code}`);
      
      // Navigate to room
      setTimeout(() => {
        router.push(`/senryu/room?id=${room.id}`);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '部屋の作成に失敗しました');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName) {
      setMode('register');
      return;
    }

    if (!roomCode || roomCode.length !== 6) {
      toast.error('6文字の部屋コードを入力してください');
      return;
    }

    setIsJoiningRoom(true);
    try {
      const { room, playerId } = await senryuApi.joinRoom({
        roomCode: roomCode.toUpperCase(),
        playerName,
        rankingPreference: {
          allowRanking: rankingPreference !== 'none',
          anonymousRanking: rankingPreference === 'anonymous'
        }
      });

      // Store player info in localStorage for reconnection
      if (typeof window !== 'undefined') {
        localStorage.setItem('senryu-player-id', playerId);
        localStorage.setItem('senryu-room-id', room.id);
        localStorage.setItem('senryu-player-name', playerName);
        localStorage.setItem('senryu-ranking-preference', rankingPreference);
      }

      toast.success('部屋に参加しました！');
      router.push(`/senryu/room?id=${room.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '部屋への参加に失敗しました');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handlePlayerRegistration = (settings: {
    name: string;
    allowRanking: boolean;
    anonymousRanking: boolean;
  }) => {
    setPlayerName(settings.name);
    const preference = !settings.allowRanking ? 'none' :
      settings.anonymousRanking ? 'anonymous' : 'public';
    setRankingPreference(preference);
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('senryu-player-name', settings.name);
      localStorage.setItem('senryu-ranking-preference', preference);
    }
    
    // 登録後、元のアクションに戻る
    if (mode === 'register') {
      setMode('menu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* 和風装飾ヘッダー */}
      <header className="relative bg-white/80 backdrop-blur-md border-b-2 border-orange-300">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {/* 波模様のSVGパターン */}
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,0 Q300,60 600,30 T1200,0 L1200,120 L0,120 Z" fill="#60A5FA" />
          </svg>
        </div>
        
        <div className="relative z-10 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2"
              >
                CloudNative川柳道場
              </motion.h1>
              <p className="text-gray-600">
                〜 技術と笑いの交流会 〜
              </p>
            </div>

            {/* 管理者ダッシュボードリンク */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => router.push('/admin/senryu')}
              className="absolute top-8 right-6 p-2 bg-white/90 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
              title="管理者ダッシュボード"
            >
              <Settings className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {mode === 'menu' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            {/* プレイヤー名表示 */}
            {playerName && (
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-600">ようこそ</p>
                <p className="text-xl font-bold text-gray-800">{playerName} さん</p>
                <button
                  onClick={() => setMode('register')}
                  className="text-sm text-blue-500 hover:underline mt-1"
                >
                  名前を変更
                </button>
              </div>
            )}

            {/* ユーザー名表示（設定済みの場合） */}
            {playerName && (
              <div className="mb-4 p-4 bg-white rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">現在のユーザー名</p>
                    <p className="text-lg font-bold text-gray-800">{playerName}</p>
                  </div>
                  <button
                    onClick={() => setMode('register')}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    変更
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* 部屋を作るボタン */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => playerName ? handleCreateRoom() : setMode('register')}
                className="w-full p-6 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🎴</span>
                  <div className="text-left">
                    <p className="text-xl font-bold">部屋を作る</p>
                    <p className="text-sm opacity-90">ホストとしてゲームを開始</p>
                  </div>
                </div>
              </motion.button>

              {/* 部屋に参加ボタン */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('join')}
                className="w-full p-6 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🤝</span>
                  <div className="text-left">
                    <p className="text-xl font-bold">部屋に参加</p>
                    <p className="text-sm opacity-90">部屋コードで参加</p>
                  </div>
                </div>
              </motion.button>

              {/* ギャラリーを見るボタン */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/senryu/gallery')}
                className="w-full p-6 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🎨</span>
                  <div className="text-left">
                    <p className="text-xl font-bold">ギャラリー</p>
                    <p className="text-sm opacity-90">みんなの作品を見る</p>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* ゲーム説明 */}
            <div className="mt-8 p-4 bg-white/80 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-2">遊び方</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. 各プレイヤーに異なる川柳が配られます</li>
                <li>2. 順番に30〜60秒で解釈をプレゼンします</li>
                <li>3. 他のプレイヤーが5項目で採点します</li>
                <li>4. 最高得点の人が優勝！</li>
              </ol>
            </div>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-md mx-auto"
          >
            <button
              onClick={() => setMode('menu')}
              className="mb-4 text-gray-600 hover:text-gray-800"
            >
              ← 戻る
            </button>

            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">部屋に参加</h2>
              
              {!playerName && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    先にユーザー名設定が必要です
                  </p>
                  <button
                    onClick={() => setMode('register')}
                    className="mt-2 text-sm text-blue-500 hover:underline"
                  >
                    ユーザー名設定へ
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    部屋コード（6文字）
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full p-3 text-2xl text-center font-mono text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-400 transition-colors placeholder-gray-400"
                    disabled={!playerName}
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={!playerName || roomCode.length !== 6}
                  className="w-full p-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
                >
                  参加する
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'register' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <button
              onClick={() => setMode('menu')}
              className="mb-4 text-gray-600 hover:text-gray-800"
            >
              ← 戻る
            </button>
            
            <PlayerRegistration onComplete={handlePlayerRegistration} />
          </motion.div>
        )}
      </main>

      {/* 桜の花びらアニメーション */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-300 text-2xl"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: -50,
              rotate: 0
            }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 50 : 1080,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              rotate: 360
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 3
            }}
          >
            🌸
          </motion.div>
        ))}
      </div>
    </div>
  );
}