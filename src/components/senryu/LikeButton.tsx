'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface LikeButtonProps {
  entryId: string;
  initialLikes: number;
  initialLiked: boolean;
  sessionId: string | null;
  onLike: (entryId: string, sessionId: string) => Promise<{ likes: number; liked: boolean }>;
  onUnlike: (entryId: string, sessionId: string) => Promise<{ likes: number; liked: boolean }>;
}

export function LikeButton({
  entryId,
  initialLikes,
  initialLiked,
  sessionId,
  onLike,
  onUnlike
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleClick = async () => {
    if (!sessionId) {
      toast.error('セッションIDを取得中です。もう一度お試しください。');
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    setIsAnimating(true);
    
    try {
      let result;
      if (liked) {
        result = await onUnlike(entryId, sessionId);
      } else {
        result = await onLike(entryId, sessionId);
      }
      
      setLikes(result.likes);
      setLiked(result.liked);
      
      if (!liked) {
        // いいねアニメーション用のハート
        createFloatingHearts();
      }
    } catch (error) {
      console.error('Like action failed:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };
  
  const createFloatingHearts = () => {
    // 複数の小さなハートを飛ばすアニメーション
    if (!containerRef.current) return;
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = '❤️';
        heart.style.cssText = `
          position: absolute;
          font-size: 20px;
          pointer-events: none;
          animation: floatUp 1s ease-out forwards;
          left: ${15 + Math.random() * 20}px;
          bottom: 30px;
        `;
        containerRef.current?.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1000);
      }, i * 100);
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative inline-flex items-center gap-2"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={isLoading}
        className={`
          relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
          transition-colors duration-200
          ${liked 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${isLoading ? 'cursor-wait opacity-70' : 'cursor-pointer'}
        `}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={liked ? 'liked' : 'unliked'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Heart 
              className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
              style={{
                animation: isAnimating && liked ? 'heartBeat 0.3s ease-in-out' : 'none'
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        <motion.span
          key={likes}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-medium text-sm min-w-[2ch] text-center"
        >
          {likes}
        </motion.span>
      </motion.button>
      
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.5) rotate(${Math.random() * 60 - 30}deg);
          }
        }
        
        @keyframes heartBeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}