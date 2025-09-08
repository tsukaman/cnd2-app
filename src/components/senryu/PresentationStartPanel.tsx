'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface PresentationStartPanelProps {
  onStart: () => void;
  presenterName: string;
}

export function PresentationStartPanel({ onStart, presenterName }: PresentationStartPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-300"
    >
      <h3 className="text-2xl font-bold mb-6 text-purple-600 text-center">
        {presenterName}さんのプレゼンタイム
      </h3>
      
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎤</div>
        <p className="text-gray-600 mb-2">
          準備ができたらプレゼンを開始してください
        </p>
        <p className="text-sm text-gray-500">
          プレゼンを開始すると、川柳の再選出はできなくなります
        </p>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5" />
        プレゼンを開始する
      </motion.button>
    </motion.div>
  );
}