'use client';

import { motion } from 'framer-motion';

interface SenryuCardProps {
  type: 'upper' | 'middle' | 'lower';
  text: string;
  isSelected?: boolean;
  illustration?: string;
}

export function SenryuCard({ type, text, isSelected, illustration }: SenryuCardProps) {
  const cardStyles = {
    upper: 'bg-gradient-to-br from-blue-400 to-blue-300',
    middle: 'bg-gradient-to-br from-yellow-300 to-yellow-200',
    lower: 'bg-gradient-to-br from-orange-400 to-orange-300'
  };

  const typeLabels = {
    upper: '上の句',
    middle: '中の句',
    lower: '下の句'
  };

  const indentStyles = {
    upper: 'ml-0',
    middle: 'ml-8',
    lower: 'ml-16'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotate: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`${indentStyles[type]} max-w-md`}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl p-6
          ${cardStyles[type]}
          shadow-lg backdrop-blur-sm
          border-2 border-white/50
          ${isSelected ? 'ring-4 ring-orange-400' : ''}
        `}
      >
        {/* 和柄の背景パターン（SVG） */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" fill="currentColor">
            <defs>
              <pattern id={`wave-${type}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path 
                  d="M0,50 Q25,30 50,50 T100,50 M0,25 Q25,5 50,25 T100,25 M0,75 Q25,55 50,75 T100,75" 
                  stroke="currentColor" 
                  fill="none" 
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#wave-${type})`} />
          </svg>
        </div>

        {/* カスタムイラスト表示エリア */}
        {illustration && (
          <img 
            src={illustration} 
            alt=""
            className="absolute top-2 right-2 w-12 h-12 opacity-30"
          />
        )}

        {/* テキスト */}
        <div className="relative z-10">
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 text-center font-serif tracking-wider">
            {text}
          </p>
        </div>

        {/* 句の種類ラベル */}
        <div className="absolute top-2 left-2">
          <span className="text-xs bg-white/30 px-2 py-1 rounded-full text-gray-700 font-medium">
            {typeLabels[type]}
          </span>
        </div>

        {/* 装飾的な円 */}
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      </div>
    </motion.div>
  );
}