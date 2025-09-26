'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/lib/senryu/types';

interface PlayerListProps {
  players: Player[];
  currentPresenterId?: string;
  hostId: string;
}

export function PlayerList({ players, currentPresenterId, hostId }: PlayerListProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span className="text-2xl">👥</span>
        参加者（{players.length}人）
      </h3>
      
      <div className="space-y-3">
        {players.map((player, index) => {
          const isHost = player.id === hostId;
          const isPresenting = player.id === currentPresenterId;
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-3 rounded-xl transition-all
                ${isPresenting 
                  ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300' 
                  : 'bg-gray-50 border-2 border-transparent'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* プレイヤーアイコン */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                    ${isPresenting 
                      ? 'bg-gradient-to-br from-purple-400 to-pink-400' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }
                  `}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* プレイヤー名 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isPresenting ? 'text-purple-800' : 'text-gray-800'}`}>
                        {player.name}
                      </span>
                      {isHost && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                          ホスト
                        </span>
                      )}
                      {isPresenting && (
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full"
                        >
                          プレゼン中
                        </motion.span>
                      )}
                    </div>
                    
                    {/* ランキング設定表示 */}
                    <div className="text-xs text-gray-500 mt-0.5">
                      {player.rankingPreference.allowRanking ? (
                        player.rankingPreference.anonymousRanking ? (
                          <span className="flex items-center gap-1">
                            <span className="text-purple-500">👤</span>
                            詠み人知らず
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="text-blue-500">👤</span>
                            ユーザー名で掲載
                          </span>
                        )
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">👤</span>
                          非掲載
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* スコア表示（ゲーム中） */}
                {player.totalScore > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      {player.totalScore}
                    </div>
                    <div className="text-xs text-gray-500">点</div>
                  </div>
                )}
              </div>
              
              {/* プレゼン済みマーク */}
              {player.scores.length > 0 && !isPresenting && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span>✅</span>
                    プレゼン済み
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* ゲーム開始の最小人数案内 */}
      {players.length < 2 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
          <p className="text-sm text-yellow-800">
            あと{2 - players.length}人参加するとゲームを開始できます
          </p>
        </div>
      )}
    </div>
  );
}