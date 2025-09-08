'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { senryuApi } from '@/lib/senryu/api-client';
import type { RankingEntry } from '@/lib/senryu/types';

// ダミーデータ（開発用）
const DUMMY_RANKINGS: RankingEntry[] = [
  {
    id: '1',
    senryu: {
      upper: { id: 'u001', text: 'Kubernetes', category: 'cloudnative', type: 'upper' as const },
      middle: { id: 'm001', text: '朝から夜まで', category: 'temporal', type: 'middle' as const },
      lower: { id: 'l001', text: 'ずっとエラー', category: 'result', type: 'lower' as const }
    },
    playerName: 'クラウド太郎',
    playerId: '1',
    anonymousRanking: false,
    scores: {
      total: 115,
      average: 23,
      details: [
        {
          scorerName: 'ゲスト花子',
          scores: { humor: 5, persuasion: 4, creativity: 5, relevance: 5, presentation: 4 }
        },
        {
          scorerName: '山田次郎',
          scores: { humor: 5, persuasion: 5, creativity: 4, relevance: 5, presentation: 5 }
        }
      ]
    },
    scorers: ['ゲスト花子', '山田次郎', '鈴木三郎', '田中四郎', '佐藤五郎'],
    playerCount: 6,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    roomId: 'room1',
    roomCode: 'ABC123',
    isPublic: true
  },
  {
    id: '2',
    senryu: {
      upper: { id: 'u002', text: 'Docker', category: 'cloudnative', type: 'upper' as const },
      middle: { id: 'm002', text: 'コンテナいっぱい', category: 'quantity', type: 'middle' as const },
      lower: { id: 'l002', text: '腹ペコだ', category: 'daily', type: 'lower' as const }
    },
    playerName: '詠み人知らず',
    playerId: '2',
    anonymousRanking: true,
    scores: {
      total: 108,
      average: 21.6,
      details: [
        {
          scorerName: 'プレイヤーA',
          scores: { humor: 5, persuasion: 4, creativity: 5, relevance: 4, presentation: 4 }
        }
      ]
    },
    scorers: ['プレイヤーA', 'プレイヤーB', 'プレイヤーC', 'プレイヤーD', 'プレイヤーE'],
    playerCount: 5,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    roomId: 'room2',
    roomCode: 'DEF456',
    isPublic: true
  },
  {
    id: '3',
    senryu: {
      upper: { id: 'u041', text: 'デプロイが', category: 'action', type: 'upper' as const },
      middle: { id: 'm031', text: 'エラーだらけ', category: 'quantity', type: 'middle' as const },
      lower: { id: 'l036', text: '泣きそうだ', category: 'emotion', type: 'lower' as const }
    },
    playerName: '技術花子',
    playerId: '3',
    anonymousRanking: false,
    scores: {
      total: 95,
      average: 23.75,
      details: []
    },
    scorers: ['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4'],
    playerCount: 4,
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    roomId: 'room3',
    roomCode: 'GHI789',
    isPublic: true
  }
];

export default function SenryuRanking() {
  const router = useRouter();
  const [category, setCategory] = useState<string>('all');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const { rankings: data } = await senryuApi.getRankings(category);
        setRankings(data);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
        // Fall back to dummy data in development
        if (process.env.NODE_ENV === 'development') {
          let filtered = [...DUMMY_RANKINGS];
          
          if (category !== 'all') {
            const [min, max] = category.split('-').map(Number);
            filtered = filtered.filter(e => 
              e.playerCount >= min && e.playerCount <= max
            );
          }
          
          // スコア計算してソート
          filtered.sort((a, b) => {
            const scoreA = a.scores.average + Math.log10(a.playerCount) * 10;
            const scoreB = b.scores.average + Math.log10(b.playerCount) * 10;
            return scoreB - scoreA;
          });
          
          setRankings(filtered);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRankings();
  }, [category]);
  
  const getMedal = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* ヘッダー */}
      <header className="relative bg-white/80 backdrop-blur-md border-b-2 border-orange-300">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,0 Q300,60 600,30 T1200,0 L1200,120 L0,120 Z" fill="#60A5FA" />
          </svg>
        </div>
        
        <div className="relative z-10 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent"
              >
                🏆 川柳ランキング
              </motion.h1>
              
              <button
                onClick={() => router.push('/senryu')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← ロビーへ戻る
              </button>
            </div>
            
            <p className="text-gray-600">
              歴代の名作川柳たち
            </p>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* カテゴリ選択 */}
        <div className="mb-6 flex gap-2 flex-wrap justify-center">
          <button 
            onClick={() => setCategory('all')} 
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              category === 'all' 
                ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            総合
          </button>
          <button 
            onClick={() => setCategory('3-4')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              category === '3-4' 
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            3-4人戦
          </button>
          <button 
            onClick={() => setCategory('5-6')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              category === '5-6' 
                ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            5-6人戦
          </button>
          <button 
            onClick={() => setCategory('7-8')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              category === '7-8' 
                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            7-8人戦
          </button>
          <button 
            onClick={() => setCategory('9-10')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              category === '9-10' 
                ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            9-10人戦
          </button>
        </div>
        
        {/* ランキング表示 */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {rankings.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200"
            >
              <div className="flex items-start gap-4">
                {/* 順位 */}
                <div className="text-4xl font-bold text-center min-w-[60px]">
                  {getMedal(index)}
                </div>
                
                {/* 内容 */}
                <div className="flex-1">
                  {/* 川柳 */}
                  <div className="text-xl mb-3 font-serif text-gray-800">
                    <div>{entry.senryu.upper.text}</div>
                    <div className="ml-4">{entry.senryu.middle.text}</div>
                    <div className="ml-8">{entry.senryu.lower.text}</div>
                  </div>
                  
                  {/* 情報 */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {entry.anonymousRanking ? '👤' : '👤'} 
                      <span className={entry.anonymousRanking ? 'italic' : ''}>
                        {entry.anonymousRanking ? '詠み人知らず' : entry.playerName}
                      </span>
                    </span>
                    <span>⭐ {entry.scores.average.toFixed(1)}/5.0</span>
                    <span>👥 {entry.playerCount}人戦</span>
                    <span>📅 {new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  {/* 採点詳細（展開可能） */}
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="mt-3 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {expandedId === entry.id ? '採点詳細を隠す ▲' : '採点詳細を見る ▼'}
                  </button>
                  
                  {expandedId === entry.id && entry.scores.details.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {entry.scores.details.map((detail, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-xl">
                            <div className="font-semibold text-gray-700 mb-1">
                              {detail.scorerName}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span>😂{detail.scores.humor}</span>
                              <span>💪{detail.scores.persuasion}</span>
                              <span>✨{detail.scores.creativity}</span>
                              <span>🤝{detail.scores.relevance}</span>
                              <span>🎤{detail.scores.presentation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        採点者: {entry.scorers.join('、')}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-500">ランキングを読み込み中...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">このカテゴリにはまだランキングがありません</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}