'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PreparationTimerProps {
  duration: number; // seconds
  onTimeout: () => void;
  isActive: boolean;
}

export function PreparationTimer({ duration, onTimeout, isActive }: PreparationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, duration, onTimeout]);
  
  const progress = (duration - timeLeft) / duration;
  
  // 色の変化（残り時間に応じて）
  const getColor = () => {
    if (timeLeft <= 5) return '#EF4444'; // 赤
    if (timeLeft <= 10) return '#F59E0B'; // オレンジ
    return '#8B5CF6'; // 紫
  };
  
  return (
    <div className="text-center mb-4">
      <div className="flex items-center justify-center gap-2">
        <motion.div
          className="text-2xl font-bold"
          style={{ color: getColor() }}
          animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          準備時間: {timeLeft}秒
        </motion.div>
      </div>
      
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-colors duration-300"
            style={{ 
              width: `${progress * 100}%`,
              backgroundColor: getColor()
            }}
          />
        </div>
      </div>
      
      {timeLeft <= 10 && (
        <motion.p
          className="mt-2 text-sm text-orange-600 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          まもなくプレゼンが始まります！
        </motion.p>
      )}
    </div>
  );
}