'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Card {
  id: string;
  text: string;
  category: string;
  type: 'upper' | 'middle' | 'lower';
}

interface SenryuDisplayProps {
  senryu: {
    upper: Card;
    middle: Card;
    lower: Card;
  };
  allowRedraw?: boolean;
  redrawsRemaining?: {
    upper: number;
    middle: number;
    lower: number;
  };
  onRedraw?: (cardType: 'upper' | 'middle' | 'lower') => Promise<void>;
  showAnimation?: boolean; // カードめくり演出を表示するか
  isPresenting?: boolean; // プレゼン中かどうか（他の人の川柳を見ている時）
}

export function SenryuDisplay({ 
  senryu, 
  allowRedraw = false, 
  redrawsRemaining,
  onRedraw,
  showAnimation = false,
  isPresenting = false
}: SenryuDisplayProps) {
  const [isRedrawing, setIsRedrawing] = useState<'upper' | 'middle' | 'lower' | null>(null);
  const [flippedCards, setFlippedCards] = useState({
    upper: !showAnimation,
    middle: !showAnimation,
    lower: !showAnimation
  });

  // カードめくり演出のタイミング制御
  useEffect(() => {
    if (showAnimation) {
      setFlippedCards({ upper: false, middle: false, lower: false });
      const timers = [
        setTimeout(() => setFlippedCards(prev => ({ ...prev, upper: true })), 500),
        setTimeout(() => setFlippedCards(prev => ({ ...prev, middle: true })), 1500),
        setTimeout(() => setFlippedCards(prev => ({ ...prev, lower: true })), 2500)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [showAnimation]);

  const handleRedraw = async (cardType: 'upper' | 'middle' | 'lower') => {
    if (!onRedraw) return;
    
    if (redrawsRemaining && redrawsRemaining[cardType] <= 0) {
      toast.error(`${cardType === 'upper' ? '上の句' : cardType === 'middle' ? '中の句' : '下の句'}の再選出回数を使い切りました`);
      return;
    }

    setIsRedrawing(cardType);
    try {
      await onRedraw(cardType);
      toast.success(`${cardType === 'upper' ? '上の句' : cardType === 'middle' ? '中の句' : '下の句'}を再選出しました`);
    } catch (error) {
      toast.error('再選出に失敗しました');
    } finally {
      setIsRedrawing(null);
    }
  };

  const cardVariants = {
    hidden: { 
      rotateY: 180,
      opacity: 0.5,
      scale: 0.95
    },
    visible: { 
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  const renderCard = (card: Card, type: 'upper' | 'middle' | 'lower', marginLeft: string) => {
    const colorMap = {
      upper: 'from-blue-50 to-blue-100 border-blue-300',
      middle: 'from-yellow-50 to-yellow-100 border-yellow-300',
      lower: 'from-orange-50 to-orange-100 border-orange-300'
    };

    const buttonColorMap = {
      upper: 'bg-blue-500 hover:bg-blue-600',
      middle: 'bg-yellow-500 hover:bg-yellow-600',
      lower: 'bg-orange-500 hover:bg-orange-600'
    };

    const isFlipped = flippedCards[type];

    return (
      <motion.div
        key={card.id}
        initial={showAnimation ? "hidden" : "visible"}
        animate={isFlipped ? "visible" : "hidden"}
        variants={cardVariants}
        className={`${marginLeft} preserve-3d`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`relative bg-gradient-to-r ${colorMap[type]} rounded-2xl p-6 border-2 shadow-lg`}>
          <div className="text-3xl font-serif text-gray-800 text-center">
            {isFlipped ? card.text : '？？？？？'}
          </div>
          
          {allowRedraw && redrawsRemaining && redrawsRemaining[type] > 0 && !isPresenting && isFlipped && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRedraw(type)}
              disabled={isRedrawing === type}
              className={`absolute -right-2 -top-2 p-2 rounded-full shadow-lg transition-all ${
                isRedrawing === type 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : `${buttonColorMap[type]} text-white`
              }`}
              title={`再選出（残り${redrawsRemaining[type]}回）`}
            >
              <RefreshCw 
                className={`w-4 h-4 ${isRedrawing === type ? 'animate-spin' : ''}`} 
              />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-200">
      <div className="relative">
        {/* タイトル */}
        {isPresenting && (
          <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
            プレゼンター の川柳
          </h3>
        )}
        
        {/* 川柳表示 - 横並びのカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence mode="wait">
            {renderCard(senryu.upper, 'upper', '')}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {renderCard(senryu.middle, 'middle', '')}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {renderCard(senryu.lower, 'lower', '')}
          </AnimatePresence>
        </div>

        {/* 再選出回数表示 */}
        {allowRedraw && redrawsRemaining && !isPresenting && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-medium">再選出可能回数：</span>
              <div className="flex gap-4">
                <span>上: {redrawsRemaining.upper}</span>
                <span>中: {redrawsRemaining.middle}</span>
                <span>下: {redrawsRemaining.lower}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}