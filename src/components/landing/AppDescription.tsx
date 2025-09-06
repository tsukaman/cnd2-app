'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Sparkles, Shield, Heart } from 'lucide-react';

export function AppDescription() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-4xl mx-auto mb-12 px-4"
    >
      {/* メインの説明 */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
        >
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            CND² へようこそ！
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </h2>
          
          <p className="text-gray-300 leading-relaxed mb-4">
            CND²（シーエヌディースクエア）は、CloudNative Days の参加者同士の
            「つながり」と「発見」をサポートする相性診断アプリです。
          </p>
          
          <p className="text-gray-300 leading-relaxed">
            Prairie Card のプロフィール情報をもとに、
            AI が2人の相性を楽しく分析。
            技術の話題から意外な共通点まで、
            新しい出会いのきっかけを見つけましょう！
          </p>
        </motion.div>
      </div>

      {/* アコーディオンセクション */}
      <div className="space-y-3">
        {/* 使い方セクション */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => toggleSection('howto')}
            className="w-full text-left bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-white font-semibold">かんたん3ステップ</span>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  openSection === 'howto' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
          
          {openSection === 'howto' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50"
            >
              <ol className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>「Let\'s Connect \'n\' Discover!」をタップ</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>2人分の Prairie Card URL を入力（QRコード読み取りもOK！）</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>AIが相性を診断！結果をシェアして盛り上がろう 🎉</span>
                </li>
              </ol>
            </motion.div>
          )}
        </motion.div>

        {/* プライバシーについて */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => toggleSection('privacy')}
            className="w-full text-left bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-white font-semibold">プライバシーについて</span>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  openSection === 'privacy' ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
          
          {openSection === 'privacy' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50"
            >
              <div className="space-y-3 text-gray-300">
                <p className="font-semibold text-white">🔒 あなたのデータは安全です</p>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Prairie Card のプロフィールページで公開されている情報のみを使用します</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">✓</span>
                    <span>読み取ったプロフィール情報は相性診断のみで利用します</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">✓</span>
                    <span>読み取ったプロフィール情報は保存されません</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">✓</span>
                    <span>診断結果は7日間で自動削除されます</span>
                  </li>
                </ul>
                
                <div className="pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-400">
                    診断はエンターテイメント目的であり、
                    結果は参考程度にお楽しみください。
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* フッターメッセージ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-8"
      >
        <p className="text-gray-400 text-sm">
          CloudNative Days Winter 2025 で、
          素敵な出会いがありますように ✨
        </p>
      </motion.div>
    </motion.div>
  );
}