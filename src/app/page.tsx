"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { MenuCard } from "@/components/ui/MenuCard";
import { ConsentDialog } from "@/components/ui/ConsentDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BackgroundEffects } from "@/components/effects/BackgroundEffects";
import dynamic from 'next/dynamic';

// Dynamic import for 3D components to avoid SSR issues
const CloudAnimation = dynamic(() => import('@/components/effects/CloudAnimation'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 to-purple-50" />
});

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // プライバシー同意確認
    const consent = localStorage.getItem("cnd2-privacy-consent");
    if (consent) {
      setHasConsented(true);
    }
    // ローディング画面を1秒間表示
    setTimeout(() => setIsReady(true), 1000);
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!hasConsented) {
    return (
      <ConsentDialog
        onConsent={() => {
          localStorage.setItem("cnd2-privacy-consent", "true");
          setHasConsented(true);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* 背景エフェクト */}
      <BackgroundEffects />
      <Suspense fallback={null}>
        <CloudAnimation />
      </Suspense>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* CND²ロゴ */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-12"
        >
          <Logo size="lg" animate={true} />
        </motion.div>

        {/* メニューカード */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <MenuCard
            href="/duo"
            icon="👥"
            title="2人診断"
            description="相性をチェック"
            delay={0.2}
          />
          <MenuCard
            href="/group"
            icon="🎯"
            title="グループ診断"
            description="3-6人で診断"
            delay={0.4}
          />
        </div>

        {/* フッター */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-white/60 text-sm">
            CloudNative Days Winter 2025
          </p>
          <p className="text-white/40 text-xs mt-2">
            11月18-19日 @ 東京
          </p>
        </motion.div>
      </div>
    </main>
  );
}