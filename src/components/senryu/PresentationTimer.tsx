'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

interface PresentationTimerProps {
  duration: number; // seconds
  onComplete: () => void;
  isActive: boolean;
  allowSkip?: boolean; // ホストのみスキップ可能
}

export function PresentationTimer({ duration, onComplete, isActive, allowSkip = false }: PresentationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, duration, onComplete]);
  
  const progress = (duration - timeLeft) / duration;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // 円形プログレスバーの計算
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  // 色の変化（残り時間に応じて）
  const getColor = () => {
    if (timeLeft <= 10) return '#EF4444'; // 赤
    if (timeLeft <= 20) return '#F59E0B'; // オレンジ
    return '#10B981'; // 緑
  };
  
  const handleSkip = () => {
    if (allowSkip) {
      onComplete();
    }
  };
  
  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-200">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-800">
        プレゼンタイム
      </h3>
      
      <div className="relative w-64 h-64 mx-auto">
        {/* 背景の円 */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="12"
            fill="none"
          />
          {/* プログレスの円 */}
          <motion.circle
            cx="128"
            cy="128"
            r={radius}
            stroke={getColor()}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>
        
        {/* タイマー表示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-6xl font-mono font-bold"
            style={{ color: getColor() }}
            animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </motion.div>
          
          {timeLeft <= 10 && (
            <motion.div
              className="mt-2 text-red-500 font-bold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              残りわずか！
            </motion.div>
          )}
        </div>
      </div>
      
      {/* テキストでの進捗表示 */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>開始</span>
          <span>{Math.round(progress * 100)}%</span>
          <span>終了</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-colors duration-300"
            style={{ 
              width: `${progress * 100}%`,
              backgroundColor: getColor()
            }}
          />
        </div>
      </div>
      
      {/* 励ましメッセージ */}
      <div className="mt-6 text-center">
        {timeLeft > 40 && (
          <p className="text-gray-600">落ち着いて、楽しくプレゼンしましょう！</p>
        )}
        {timeLeft <= 40 && timeLeft > 20 && (
          <p className="text-gray-600">いい調子です！続けてください！</p>
        )}
        {timeLeft <= 20 && timeLeft > 10 && (
          <p className="text-orange-600 font-medium">そろそろまとめに入りましょう</p>
        )}
        {timeLeft <= 10 && (
          <p className="text-red-600 font-bold animate-pulse">ラストスパート！</p>
        )}
      </div>
      
      {/* 早期終了ボタン（ホストのみ） */}
      {allowSkip && (
        <div className="mt-6">
          <button
            onClick={handleSkip}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            プレゼンを終了して採点へ
          </button>
        </div>
      )}
    </div>
  );
}