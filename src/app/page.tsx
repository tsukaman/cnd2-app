"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Shuffle, Users, Trophy, ChevronRight, Sparkles } from "lucide-react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BackgroundEffects } from "@/components/effects/BackgroundEffects";

// Constants
const LOADING_SCREEN_DURATION = 1000;
const TAGLINE_ROTATION_INTERVAL = 5000;

const taglines = [
  { en: "Senryu Showdown", ja: "川柳で楽しむエンジニアリング" },
  { en: "Code × Creativity", ja: "コードと創造性の融合" },
  { en: "Tech Haiku Battle", ja: "技術川柳バトル" },
  { en: "Engineer's Poetry", ja: "エンジニアの詩心" }
];

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    // 初回ロード時のローディング画面
    const timer = setTimeout(() => {
      setIsReady(true);
    }, LOADING_SCREEN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // タグラインを定期的に切り替える
    const intervalId = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, TAGLINE_ROTATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen relative overflow-hidden stars-bg">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/" className="inline-block">
            <motion.div
              className="inline-flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/cndw2025-favicon.svg"
                alt="CNDW 2025"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <h1 className="text-4xl font-bold">
                <span className="gradient-text">川柳ゲーム</span>
              </h1>
            </motion.div>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="space-y-1"
            >
              <p className="text-xl text-purple-300 font-medium">
                {taglines[taglineIndex].en}
              </p>
              <p className="text-sm text-gray-400">
                {taglines[taglineIndex].ja}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, staggerChildren: 0.1 }}
          >
            {/* ソロプレイ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/senryu">
                <motion.div
                  className="glass-effect rounded-2xl p-6 h-full cursor-pointer group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">ソロプレイ</h2>
                  <p className="text-gray-300 text-sm mb-4">
                    一人で川柳を作って楽しむモード。自由に創作を楽しもう！
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-purple-900/50 rounded-lg text-xs text-purple-300">
                      創作
                    </span>
                    <span className="px-2 py-1 bg-blue-900/50 rounded-lg text-xs text-blue-300">
                      練習
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* 対戦モード */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/senryu/room">
                <motion.div
                  className="glass-effect rounded-2xl p-6 h-full cursor-pointer group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-green-400" />
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">対戦モード</h2>
                  <p className="text-gray-300 text-sm mb-4">
                    友達と川柳バトル！リアルタイムで競い合おう
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-900/50 rounded-lg text-xs text-green-300">
                      マルチプレイ
                    </span>
                    <span className="px-2 py-1 bg-yellow-900/50 rounded-lg text-xs text-yellow-300">
                      リアルタイム
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* ランキング */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/senryu/ranking">
                <motion.div
                  className="glass-effect rounded-2xl p-6 h-full cursor-pointer group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">ランキング</h2>
                  <p className="text-gray-300 text-sm mb-4">
                    みんなの川柳を見て投票！人気作品をチェック
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-yellow-900/50 rounded-lg text-xs text-yellow-300">
                      投票
                    </span>
                    <span className="px-2 py-1 bg-red-900/50 rounded-lg text-xs text-red-300">
                      人気
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* ゲーム説明 */}
          <motion.div
            className="glass-effect rounded-3xl p-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              エンジニアリング川柳とは？
            </h2>
            <div className="space-y-4 text-gray-300">
              <p>
                技術用語や日常の出来事を織り交ぜて、5-7-5（または5-7-7）のリズムで表現する言葉遊びです。
                CloudNative Days Winter 2025の参加者同士で楽しく競い合いましょう！
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-semibold text-purple-300 mb-2">🎯 例1: 技術系</h3>
                  <p className="font-mono text-sm">
                    コンテナが<br />
                    落ちては上がる<br />
                    無限ループ
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-semibold text-green-300 mb-2">😄 例2: 日常系</h3>
                  <p className="font-mono text-sm">
                    コーヒーを<br />
                    飲みすぎて今日も<br />
                    眠れない夜
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl">
                <p className="text-center text-sm">
                  <span className="text-purple-300 font-semibold">✨ ヒント: </span>
                  技術用語と日常の出来事をミックスすると面白い川柳が生まれます！
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            className="mt-12 text-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <p className="text-sm">
              <Link
                href="https://event.cloudnativedays.jp/cndw2025"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-400 transition-colors"
              >
                CloudNative Days Winter 2025
              </Link>
              {" "}公式アプリ
            </p>
          </motion.footer>
        </div>
      </div>
    </main>
  );
}