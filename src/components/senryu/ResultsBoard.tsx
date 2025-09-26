'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Room, Player } from '@/lib/senryu/types';
import { SenryuCard } from './SenryuCard';
import Confetti from 'react-confetti';

interface ResultsBoardProps {
  room: Room;
}

// ダミーデータ（開発用）
const DUMMY_RESULTS = [
  {
    player: {
      id: '1',
      name: 'ホスト太郎',
      rankingPreference: { allowRanking: true, anonymousRanking: false },
      scores: [],
      totalScore: 85,
      isHost: true,
      joinedAt: new Date().toISOString(),
      senryu: {
        upper: { id: 'u001', text: 'Kubernetes', category: 'cloudnative', type: 'upper' as const },
        middle: { id: 'm001', text: '朝から夜まで', category: 'temporal', type: 'middle' as const },
        lower: { id: 'l001', text: 'ずっとエラー', category: 'result', type: 'lower' as const }
      }
    },
    rank: 1,
    averageScore: 17
  },
  {
    player: {
      id: '2',
      name: 'ゲスト花子',
      rankingPreference: { allowRanking: true, anonymousRanking: true },
      scores: [],
      totalScore: 72,
      joinedAt: new Date().toISOString(),
      senryu: {
        upper: { id: 'u002', text: 'Docker', category: 'cloudnative', type: 'upper' as const },
        middle: { id: 'm002', text: 'コンテナいっぱい', category: 'quantity', type: 'middle' as const },
        lower: { id: 'l002', text: '腹ペコだ', category: 'daily', type: 'lower' as const }
      }
    },
    rank: 2,
    averageScore: 14.4
  }
];

export function ResultsBoard({ room }: ResultsBoardProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    // ウィンドウサイズを取得
    setWindowSize({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
    
    // 5秒後に紙吹雪を停止
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // ランキングメダルの取得
  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}位`;
    }
  };
  
  // スコアによる背景色
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-100 to-yellow-50';
      case 2: return 'bg-gradient-to-r from-gray-100 to-gray-50';
      case 3: return 'bg-gradient-to-r from-orange-100 to-orange-50';
      default: return 'bg-white';
    }
  };
  
  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-200">
      {/* 紙吹雪エフェクト */}
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}
      
      {/* タイトル */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🎊 結果発表 🎊
        </h2>
        <p className="text-gray-600">
          素晴らしい川柳と解釈でした！
        </p>
      </motion.div>
      
      {/* ランキング */}
      <div className="space-y-6">
        {DUMMY_RESULTS.map((result, index) => (
          <motion.div
            key={result.player.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.3 }}
            className={`p-6 rounded-2xl ${getRankColor(result.rank)} border-2 border-gray-200`}
          >
            {/* ランクとプレイヤー情報 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: index * 0.3 + 0.2 }}
                  className="text-5xl"
                >
                  {getMedal(result.rank)}
                </motion.div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {result.player.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {result.player.rankingPreference.anonymousRanking && 
                      '（ランキングには「詠み人知らず」として掲載）'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {result.player.totalScore}点
                </div>
                <div className="text-sm text-gray-600">
                  平均: {result.averageScore.toFixed(1)}点
                </div>
              </div>
            </div>
            
            {/* 川柳表示 */}
            {result.player.senryu && (
              <div className="mt-4 p-4 bg-white/50 rounded-xl">
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="text-lg font-serif text-gray-800">
                      <div>{result.player.senryu.upper.text}</div>
                      <div className="ml-8">{result.player.senryu.middle.text}</div>
                      <div className="ml-16">{result.player.senryu.lower.text}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 1位の特別演出 */}
            {result.rank === 1 && (
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut"
                }}
                className="mt-4 text-center"
              >
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-full shadow-lg">
                  👑 本日の川柳マスター 👑
                </span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* アクションボタン */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 p-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          もう一度プレイ
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 p-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          ランキングを見る
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 p-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          部屋を出る
        </motion.button>
      </div>
    </div>
  );
}