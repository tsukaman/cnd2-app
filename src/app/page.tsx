"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MenuCard } from "@/components/ui/MenuCard";
import { ConsentDialog } from "@/components/ui/ConsentDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BackgroundEffects } from "@/components/effects/BackgroundEffects";
import { DiagnosisResult as DiagnosisResultComponent } from "@/components/diagnosis/DiagnosisResult";
import type { DiagnosisResult } from "@/types";
import { BarChart3 } from "lucide-react";

const taglines = [
  { en: "Connect Your Future", ja: "エンジニアの出会いを、データで可視化する" },
  { en: "Discover Your Match", ja: "技術スタックから導く、理想のチームメイト" },
  { en: "Scale Your Network", ja: "つながりを二乗で加速させる" },
  { en: "Code × Community", ja: "コードが繋ぐ、新しい出会い" }
];

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const searchParams = useSearchParams();
  const resultId = searchParams.get("result");
  const mode = searchParams.get("mode");
  
  // 初期状態で、localStorageから結果を読み込む
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(() => {
    if (resultId && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`diagnosis-result-${resultId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse stored result:", e);
        }
      }
    }
    return null;
  });

  useEffect(() => {
    // プライバシー同意確認
    const consent = localStorage.getItem("cnd2-privacy-consent");
    if (consent) {
      setHasConsented(true);
    }
    // ローディング画面を1秒間表示
    setTimeout(() => setIsReady(true), 1000);
  }, []);

  // 診断結果を読み込む
  useEffect(() => {
    const loadResult = async () => {
      if (!resultId) return;
      
      // まずLocalStorageから結果を取得
      const storedResult = localStorage.getItem(`diagnosis-result-${resultId}`);
      if (storedResult) {
        try {
          const result = JSON.parse(storedResult);
          console.log("Loading result from localStorage:", result.id);
          setDiagnosisResult(result);
          return;
        } catch (error) {
          console.error("Failed to parse diagnosis result:", error);
        }
      }
      
      // LocalStorageにない場合はAPIから取得
      try {
        console.log("Fetching result from API:", resultId);
        const response = await fetch(`/api/results/${resultId}`);
        
        if (!response.ok) {
          throw new Error('Result not found');
        }
        
        const data = await response.json();
        // APIレスポンスから結果を抽出
        const result = data.data?.result || data;
        
        console.log("Result fetched from API:", result.id);
        // 取得した結果をLocalStorageにも保存（キャッシュ）
        localStorage.setItem(`diagnosis-result-${resultId}`, JSON.stringify(result));
        // 状態を更新
        setDiagnosisResult(result);
      } catch (error) {
        console.error("Failed to fetch diagnosis result:", error);
        
        // セッションストレージからも確認（フォールバック）
        const sessionResult = sessionStorage.getItem(`diagnosis-result-${resultId}`);
        if (sessionResult) {
          try {
            const result = JSON.parse(sessionResult);
            console.log("Loading result from sessionStorage:", result.id);
            setDiagnosisResult(result);
          } catch (parseError) {
            console.error("Failed to parse session storage result:", parseError);
          }
        }
      }
    };
    
    loadResult();
  }, [resultId]);

  useEffect(() => {
    // タグラインを5秒ごとに切り替える
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 5000);
    return () => clearInterval(interval);
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

  // 診断結果がある場合は結果を表示
  if (diagnosisResult) {
    return (
      <main className="min-h-screen relative overflow-hidden stars-bg">
        <BackgroundEffects />
        <div className="relative z-10">
          <DiagnosisResultComponent 
            result={diagnosisResult} 
            onClose={() => {
              setDiagnosisResult(null);
              // URLパラメータをクリア
              window.history.replaceState({}, '', '/');
              // localStorageもクリア
              if (resultId) {
                localStorage.removeItem(`diagnosis-result-${resultId}`);
              }
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden stars-bg flex items-center justify-center">
      {/* 背景エフェクト */}
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
        {/* App Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-6 gradient-text-orange-soft">
            CND²
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-semibold mb-4">
            CloudNative Days × Connect &apos;n&apos; Discover
          </p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base md:text-lg font-semibold mt-4"
          >
            <span className="text-purple-400">Powered by </span>
            <span className="gradient-text">Prairie Card</span>
          </motion.p>
        </motion.div>

        {/* メニューカード */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto w-full mb-14">
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

        {/* マーケティングコピー */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={taglineIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-lg md:text-xl gradient-text-vibrant font-bold tracking-wider uppercase">
              {taglines[taglineIndex].en}
            </p>
            <p className="text-sm md:text-base text-gray-400 font-medium mt-3">
              {taglines[taglineIndex].ja}
            </p>
            <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-6"></div>
          </motion.div>
        </AnimatePresence>

        {/* Admin Link */}
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/admin/metrics"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Metrics</span>
          </Link>
        </motion.div>

        {/* フッター with CloudNative Days Logo and Hashtag */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/images/trademark@4x.png"
              alt="CloudNative Days Winter 2025"
              width={80}
              height={80}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
            <p className="text-sm md:text-base text-purple-400 font-medium">
              #CNDxCnD
            </p>
            <p className="text-gray-500 text-xs font-medium mt-1">
              © 2025 CloudNative Days Committee
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}