'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Eye, EyeOff, User, UserX } from 'lucide-react';
import type { Senryu, PublicationPreference } from '@/lib/senryu/types';

interface PublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  senryu: Senryu;
  playerName: string;
  onSubmit: (preference: PublicationPreference) => Promise<void>;
}

export function PublicationModal({
  isOpen,
  onClose,
  senryu,
  playerName,
  onSubmit
}: PublicationModalProps) {
  const [shareToGallery, setShareToGallery] = useState(true);
  const [displayName, setDisplayName] = useState<'real' | 'anonymous'>('real');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        shareToGallery,
        displayName
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit publication preference:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        shareToGallery: false,
        displayName: 'real' // デフォルト値
      });
      onClose();
    } catch (error) {
      console.error('Failed to skip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* モーダル本体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                作品を公開しますか？
              </h2>
              <button
                onClick={handleSkip}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* 作品プレビュー */}
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-4 mb-6">
              <div className="text-lg font-serif text-gray-800">
                <div>{senryu.upper.text}</div>
                <div className="ml-4">{senryu.middle.text}</div>
                <div className="ml-8">{senryu.lower.text}</div>
              </div>
            </div>
            
            {/* 公開設定 */}
            <div className="space-y-4 mb-6">
              {/* 公開/非公開 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareToGallery}
                    onChange={(e) => setShareToGallery(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">
                    ギャラリーに作品を公開する
                  </span>
                </label>
                {shareToGallery ? (
                  <Eye className="w-5 h-5 text-blue-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {/* 表示名設定 */}
              <AnimatePresence>
                {shareToGallery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <p className="text-sm text-gray-600 font-medium px-1">
                      公開時の表示名:
                    </p>
                    
                    <label className={`
                      flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors
                      ${displayName === 'real' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 border-2 border-transparent'}
                    `}>
                      <input
                        type="radio"
                        value="real"
                        checked={displayName === 'real'}
                        onChange={() => setDisplayName('real')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">
                        実名で投稿（{playerName}）
                      </span>
                    </label>
                    
                    <label className={`
                      flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors
                      ${displayName === 'anonymous' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 border-2 border-transparent'}
                    `}>
                      <input
                        type="radio"
                        value="anonymous"
                        checked={displayName === 'anonymous'}
                        onChange={() => setDisplayName('anonymous')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <UserX className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-700">
                        匿名で投稿（詠み人知らず）
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                スキップ
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50
                  ${shareToGallery
                    ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    処理中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Share2 className="w-5 h-5" />
                    {shareToGallery ? '公開する' : '非公開で保存'}
                  </span>
                )}
              </button>
            </div>
            
            {/* 注意書き */}
            <p className="text-xs text-gray-500 text-center mt-4">
              ※ 公開設定は後から変更できません
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}