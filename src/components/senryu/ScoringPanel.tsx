'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SCORING_CRITERIA } from '@/lib/constants/senryu-cards';
import { toast } from 'sonner';

interface ScoringPanelProps {
  targetPlayer: string;
  targetPlayerId: string;
  onSubmit: (scores: Record<string, number>) => void;
  timeLimit?: number; // 採点制限時間（秒）
  onTimeout?: () => void; // タイムアウト時のコールバック
}

export function ScoringPanel({ targetPlayer, targetPlayerId, onSubmit, timeLimit, onTimeout }: ScoringPanelProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(SCORING_CRITERIA.map(c => [c.id, 3]))
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 60);
  
  // タイマー機能
  useEffect(() => {
    if (!timeLimit || hasSubmitted) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 時間切れ時に自動送信
          if (!hasSubmitted) {
            onSubmit(scores);
            setHasSubmitted(true);
            if (onTimeout) {
              onTimeout();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLimit, hasSubmitted, scores, onSubmit, onTimeout]);
  
  const handleScoreChange = (criteriaId: string, score: number) => {
    if (hasSubmitted) return;
    setScores(prev => ({ ...prev, [criteriaId]: score }));
  };
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = SCORING_CRITERIA.length * 5;
  const scorePercentage = (totalScore / maxScore) * 100;
  
  const handleSubmit = () => {
    if (hasSubmitted) {
      toast.error('すでに採点済みです');
      return;
    }
    
    onSubmit(scores);
    setHasSubmitted(true);
    toast.success('採点を送信しました！');
  };
  
  // 色の取得
  const getColor = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-400',
      blue: 'bg-blue-400',
      purple: 'bg-purple-400',
      green: 'bg-green-400',
      orange: 'bg-orange-400'
    };
    return colors[color] || 'bg-gray-400';
  };
  
  const getColorHover = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'hover:bg-yellow-300',
      blue: 'hover:bg-blue-300',
      purple: 'hover:bg-purple-300',
      green: 'hover:bg-green-300',
      orange: 'hover:bg-orange-300'
    };
    return colors[color] || 'hover:bg-gray-300';
  };
  
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          {targetPlayer}さんの川柳を採点
        </h3>
        {timeLimit && (
          <motion.div
            className={`text-lg font-bold ${
              timeLeft <= 10 ? 'text-red-500' : timeLeft <= 20 ? 'text-orange-500' : 'text-gray-600'
            }`}
            animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            残り{timeLeft}秒
          </motion.div>
        )}
      </div>

      <div className="space-y-4">
        {SCORING_CRITERIA.map((criteria) => (
          <div key={criteria.id} className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{criteria.emoji}</span>
                <div>
                  <span className="font-medium text-gray-700">{criteria.label}</span>
                  <p className="text-xs text-gray-500">{criteria.description}</p>
                </div>
              </div>
              
              <div className="text-xl font-bold text-gray-800">
                {scores[criteria.id]}点
              </div>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: hasSubmitted ? 1 : 1.1 }}
                  whileTap={{ scale: hasSubmitted ? 1 : 0.95 }}
                  onClick={() => handleScoreChange(criteria.id, star)}
                  disabled={hasSubmitted}
                  className={`
                    w-12 h-12 rounded-lg transition-all flex items-center justify-center
                    ${scores[criteria.id] >= star 
                      ? `${getColor(criteria.color)} text-white shadow-md` 
                      : `bg-gray-200 text-gray-400 ${!hasSubmitted && getColorHover(criteria.color)}`
                    }
                    ${hasSubmitted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-2xl">★</span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 合計スコア表示 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-gray-700">総合得点</span>
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {totalScore}点
          </span>
        </div>
        
        {/* スコアバー */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-600 text-center">
          {scorePercentage >= 80 && '素晴らしい！'}
          {scorePercentage >= 60 && scorePercentage < 80 && 'いい感じ！'}
          {scorePercentage >= 40 && scorePercentage < 60 && 'まずまず'}
          {scorePercentage < 40 && 'もう少し...'}
        </div>
      </div>

      {/* 送信ボタン */}
      <motion.button
        whileHover={{ scale: hasSubmitted ? 1 : 1.02 }}
        whileTap={{ scale: hasSubmitted ? 1 : 0.98 }}
        onClick={handleSubmit}
        disabled={hasSubmitted}
        className={`
          w-full mt-6 py-4 rounded-2xl font-bold shadow-lg transition-all
          ${hasSubmitted 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-orange-400 to-pink-400 text-white hover:shadow-xl'
          }
        `}
      >
        {hasSubmitted ? '採点完了済み' : '採点完了！'}
      </motion.button>
      
      {hasSubmitted && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm text-gray-500"
        >
          他のプレイヤーの採点を待っています...
        </motion.p>
      )}
    </div>
  );
}