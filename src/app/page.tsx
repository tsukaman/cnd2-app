"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Users, Trophy, ChevronRight, Zap, Heart, Star } from "lucide-react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BackgroundEffects } from "@/components/effects/BackgroundEffects";

// Constants
const LOADING_SCREEN_DURATION = 1000;
const TAGLINE_ROTATION_INTERVAL = 4000;

const taglines = [
  { en: "Devise Your Verse", ja: "あなたの詩を創ろう", sub: "Connect Your World" },
  { en: "Code × Creativity", ja: "コードと創造性の融合", sub: "CloudNative Poetry" },
  { en: "Deploy Your Creativity", ja: "創造性をデプロイ", sub: "5-7-5 Challenge" },
  { en: "Where Code Meets Haiku", ja: "コードが俳句になる", sub: "Tech Senryu Game" }
];

// Tailwind動的クラス生成を避けるため、色の組み合わせを事前定義
const tagColorClasses = {
  purple: "bg-purple-100 border-purple-300 text-purple-700 group-hover:bg-purple-200",
  blue: "bg-blue-100 border-blue-300 text-blue-700 group-hover:bg-blue-200",
  green: "bg-green-100 border-green-300 text-green-700 group-hover:bg-green-200",
  cyan: "bg-cyan-100 border-cyan-300 text-cyan-700 group-hover:bg-cyan-200",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-700 group-hover:bg-yellow-200",
  orange: "bg-orange-100 border-orange-300 text-orange-700 group-hover:bg-orange-200",
} as const;

type TagColor = keyof typeof tagColorClasses;

interface GameFeature {
  icon: typeof Sparkles | typeof Users | typeof Trophy;
  title: string;
  description: string;
  link: string;
  gradient: string;
  gradientOverlay: string;
  glowColor: string;
  tags: Array<{ label: string; color: TagColor }>;
}

const gameFeatures: GameFeature[] = [
  {
    icon: Sparkles,
    title: "ソロプレイ",
    description: "一人で川柳を作って楽しむモード。自由に創作を楽しもう！",
    link: "/senryu",
    gradient: "from-purple-500 to-pink-500",
    gradientOverlay: "var(--gradient-overlay-purple)",
    glowColor: "rgba(192, 132, 252, 0.4)",
    tags: [
      { label: "創作", color: "purple" },
      { label: "練習", color: "blue" }
    ]
  },
  {
    icon: Users,
    title: "対戦モード",
    description: "友達と川柳バトル！リアルタイムで競い合おう",
    link: "/senryu/room",
    gradient: "from-green-500 to-cyan-500",
    gradientOverlay: "var(--gradient-overlay-green)",
    glowColor: "rgba(34, 211, 238, 0.4)",
    tags: [
      { label: "マルチプレイ", color: "green" },
      { label: "リアルタイム", color: "cyan" }
    ]
  },
  {
    icon: Trophy,
    title: "ランキング",
    description: "みんなの川柳を見て投票！人気作品をチェック",
    link: "/senryu/ranking",
    gradient: "from-yellow-500 to-orange-500",
    gradientOverlay: "var(--gradient-overlay-orange)",
    glowColor: "rgba(251, 146, 60, 0.4)",
    tags: [
      { label: "投票", color: "yellow" },
      { label: "人気", color: "orange" }
    ]
  }
];

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, LOADING_SCREEN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
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

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        {/* Header - CND² Branding */}
        <motion.header
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo & Title */}
          <Link href="/" className="inline-block">
            <motion.div
              className="inline-flex flex-col items-center gap-3 mb-6"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* CND² Logo */}
              <div className="flex items-center gap-3">
                <Image
                  src="/images/trademark@4x.png"
                  alt="CloudNative Days Winter 2025"
                  width={56}
                  height={56}
                  className="rounded-xl shadow-lg"
                />
                <div className="flex flex-col items-start">
                  <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
                    <span className="gradient-text">CND²</span>
                  </h1>
                  <p className="text-sm sm:text-base text-purple-300 font-semibold tracking-wide">
                    Connect 'n' Devise
                  </p>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Rotating Tagline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 animate-pulse-glow" />
                <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  {taglines[taglineIndex].en}
                </p>
                <Star className="w-4 h-4 text-yellow-400 animate-pulse-glow" />
              </div>
              <p className="text-base sm:text-lg text-purple-700 font-medium">
                {taglines[taglineIndex].ja}
              </p>
              <p className="text-sm text-gray-600">
                {taglines[taglineIndex].sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Subtitle */}
          <motion.p
            className="mt-6 text-sm sm:text-base text-gray-700 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Zap className="inline w-4 h-4 text-amber-500 mr-1" />
            クラウドネイティブ川柳クリエイター
            <Heart className="inline w-4 h-4 text-rose-500 ml-1" />
          </motion.p>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Game Mode Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, staggerChildren: 0.1 }}
          >
            {gameFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Link href={feature.link}>
                    <motion.div
                      className="glass-effect rounded-3xl p-8 h-full cursor-pointer group relative overflow-hidden"
                      whileHover={{
                        scale: 1.03,
                        y: -4,
                        boxShadow: `0 20px 40px ${feature.glowColor}`
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {/* Gradient overlay on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: feature.gradientOverlay }}
                      />

                      {/* Icon & Arrow */}
                      <div className="relative flex items-center justify-between mb-6">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} strokeWidth={2} />
                        </motion.div>
                        <ChevronRight className="w-7 h-7 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-300" />
                      </div>

                      {/* Content */}
                      <div className="relative">
                        <h2 className={`text-3xl font-bold mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                          {feature.title}
                        </h2>
                        <p className="text-gray-700 text-base mb-6 leading-relaxed">
                          {feature.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {feature.tags.map((tag) => (
                            <span
                              key={tag.label}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tagColorClasses[tag.color]}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Game Description */}
          <motion.div
            className="glass-effect rounded-3xl p-8 sm:p-10 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                <span className="gradient-text">エンジニアリング川柳</span>
                <span className="text-gray-800">とは？</span>
              </h2>
              <p className="text-gray-600 text-sm">5-7-5で紡ぐ、技術者たちの創造力</p>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p className="text-center text-lg">
                技術用語や日常の出来事を織り交ぜて、<span className="text-purple-700 font-semibold">5-7-5（または5-7-7）</span>のリズムで表現する言葉遊びです。<br />
                <span className="text-sky-700 font-semibold">CloudNative Days Winter 2025</span>の参加者同士で楽しく競い合いましょう！
              </p>

              {/* Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <motion.div
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200"
                  whileHover={{ scale: 1.02, borderColor: "rgba(139, 92, 246, 0.5)" }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎯</span> 例1: 技術系
                  </h3>
                  <p className="font-mono text-base sm:text-lg leading-loose text-gray-800">
                    コンテナが<br />
                    落ちては上がる<br />
                    無限ループ
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200"
                  whileHover={{ scale: 1.02, borderColor: "rgba(16, 185, 129, 0.5)" }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                    <span className="text-2xl">😄</span> 例2: 日常系
                  </h3>
                  <p className="font-mono text-base sm:text-lg leading-loose text-gray-800">
                    コーヒーを<br />
                    飲みすぎて今日も<br />
                    眠れない夜
                  </p>
                </motion.div>
              </div>

              {/* Hint */}
              <motion.div
                className="mt-8 p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-2xl border border-amber-200"
                whileHover={{ borderColor: "rgba(245, 158, 11, 0.5)" }}
              >
                <p className="text-center text-base">
                  <Sparkles className="inline w-5 h-5 text-amber-600 mr-2" />
                  <span className="text-amber-700 font-bold">ヒント: </span>
                  <span className="text-gray-800">技術用語と日常の出来事をミックスすると面白い川柳が生まれます！</span>
                  <Sparkles className="inline w-5 h-5 text-amber-600 ml-2" />
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.footer
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <p className="text-sm text-gray-600 mb-2">
              <Link
                href="https://event.cloudnativedays.jp/cndw2025"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-600 transition-colors font-medium underline decoration-dotted underline-offset-4"
              >
                CloudNative Days Winter 2025
              </Link>
              {" "}公式アプリ
            </p>
            <p className="text-xs text-gray-500">
              Powered by CND² - Connect 'n' Devise
            </p>
          </motion.footer>
        </div>
      </div>
    </main>
  );
}
