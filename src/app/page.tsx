"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MenuCard } from "@/components/ui/MenuCard";
import { ConsentDialog } from "@/components/ui/ConsentDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BackgroundEffects } from "@/components/effects/BackgroundEffects";
import { AppDescription } from "@/components/landing/AppDescription";
import { DiagnosisResult as DiagnosisResultComponent } from "@/components/diagnosis/DiagnosisResult";
import type { DiagnosisResult, ResultApiResponse } from "@/types";
import { sanitizer } from "@/lib/sanitizer";
import { BarChart3 } from "lucide-react";

// Constants
const LOADING_SCREEN_DURATION = 1000;
const TAGLINE_ROTATION_INTERVAL = 5000;
const RESULT_ID_MAX_LENGTH = 50;
const ERROR_MESSAGES = {
  RESULT_NOT_FOUND: '診断結果の読み込みに失敗しました。URLを確認してください。',
  INVALID_STRUCTURE: 'Invalid diagnosis result structure from API',
  INVALID_RESPONSE_FORMAT: 'Invalid API response format'
} as const;

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
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [loadingResultId, setLoadingResultId] = useState<string | null>(null); // 重複リクエスト防止用
  const searchParams = useSearchParams();
  const resultId = searchParams.get("result");
  // const mode = searchParams.get("mode");

  // Result ID検証関数
  const validateResultId = useCallback((id: string): boolean => {
    return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= RESULT_ID_MAX_LENGTH;
  }, []);

  // イベントハンドラの最適化
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleGoHome = useCallback(() => {
    setResultError(null);
    setIsLoadingResult(false);
    setDiagnosisResult(null);
    window.history.replaceState({}, '', '/');
  }, []);
  
  // データ検証関数
  const validateDiagnosisResult = (data: unknown): DiagnosisResult | null => {
    if (!data || typeof data !== 'object') return null;
    
    const obj = data as Record<string, unknown>;
    
    // 必須フィールドの存在確認
    if (!obj.id || !obj.createdAt || !obj.participants || !Array.isArray(obj.participants)) {
      console.warn('[CND²] Invalid diagnosis result structure:', data);
      return null;
    }
    
    // XSS対策: 文字列フィールドをサニタイズ
    const sanitized = {
      ...obj,
      type: obj.type ? sanitizer.sanitizeText(obj.type as string) : '',
      summary: obj.summary ? sanitizer.sanitizeText(obj.summary as string) : '',
      message: obj.message ? sanitizer.sanitizeText(obj.message as string) : '',
      advice: obj.advice ? sanitizer.sanitizeText(obj.advice as string) : undefined,
      strengths: obj.strengths ? (obj.strengths as string[]).map((s: string) => sanitizer.sanitizeText(s)) : [],
      opportunities: obj.opportunities ? (obj.opportunities as string[]).map((o: string) => sanitizer.sanitizeText(o)) : [],
      conversationStarters: obj.conversationStarters ? (obj.conversationStarters as string[]).map((c: string) => sanitizer.sanitizeText(c)) : [],
    };
    
    return sanitized as DiagnosisResult;
  };

  // 初期状態で、localStorageから結果を読み込む
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(() => {
    if (resultId && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`diagnosis-result-${resultId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // データ検証とサニタイズ
          if (parsed && parsed.id === resultId) {
            return validateDiagnosisResult(parsed);
          }
        } catch (e) {
          console.error(`[CND²] Failed to parse stored result for ID ${resultId}:`, e);
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
    // ローディング画面を表示
    const timeoutId = setTimeout(() => setIsReady(true), LOADING_SCREEN_DURATION);
    
    // クリーンアップ関数でタイマーをクリア
    return () => clearTimeout(timeoutId);
  }, []);

  // 診断結果を読み込む
  useEffect(() => {
    let cancelled = false; // Race condition防止用フラグ
    
    const loadResult = async () => {
      if (!resultId || cancelled) return;
      
      // 重複リクエストのチェック
      if (loadingResultId === resultId) {
        console.log(`[CND²] Already loading result: ${resultId}`);
        return;
      }
      
      // Result IDの検証
      if (!validateResultId(resultId)) {
        console.error(`[CND²] Invalid result ID format: ${resultId}`);
        setResultError('無効な結果IDの形式です。');
        setIsLoadingResult(false);
        return;
      }
      
      // すでに結果がある場合はスキップ（初期化で読み込み済み）
      if (diagnosisResult && diagnosisResult.id === resultId) {
        return;
      }
      
      // ローディング中のIDを記録
      setLoadingResultId(resultId);
      
      // ローディング開始
      setIsLoadingResult(true);
      setResultError(null);
      
      // まずLocalStorageから結果を取得（初期化と重複チェック）
      const storedResult = localStorage.getItem(`diagnosis-result-${resultId}`);
      if (storedResult) {
        try {
          const result = JSON.parse(storedResult);
          // データ検証とサニタイズ
          if (result && result.id === resultId) {
            const validatedResult = validateDiagnosisResult(result);
            if (validatedResult && !cancelled) {
              console.log("[CND²] Loading result from localStorage:", result.id);
              setDiagnosisResult(validatedResult);
              setIsLoadingResult(false);
              setLoadingResultId(null); // ローディング完了
              return;
            }
          }
        } catch (error) {
          console.error(`Failed to parse stored diagnosis result for ID ${resultId}:`, error);
        }
      }
      
      // LocalStorageにない場合はAPIから取得
      try {
        console.log("Fetching result from API:", resultId);
        const response = await fetch(`/api/results?id=${resultId}`);
        
        if (!response.ok) {
          throw new Error(`Result not found: ${response.status}`);
        }
        
        const data: ResultApiResponse | DiagnosisResult = await response.json();
        // APIレスポンスから結果を抽出（型チェック付き）
        const result = 'success' in data && data.data?.result 
          ? data.data.result 
          : (data as DiagnosisResult).id 
            ? data as DiagnosisResult 
            : null;
        
        if (!result) {
          throw new Error(ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
        }
        
        // データ検証とサニタイズ
        const validatedResult = validateDiagnosisResult(result);
        if (!validatedResult) {
          throw new Error(ERROR_MESSAGES.INVALID_STRUCTURE);
        }
        
        console.log("[CND²] Result fetched from API:", validatedResult.id);
        
        // 取得した結果をLocalStorageにも保存（キャッシュ）
        localStorage.setItem(`diagnosis-result-${resultId}`, JSON.stringify(validatedResult));
        
        // 状態を更新（キャンセルされていない場合のみ）
        if (!cancelled) {
          setDiagnosisResult(validatedResult);
          setIsLoadingResult(false);
          setLoadingResultId(null); // ローディング完了
        }
      } catch (error) {
        console.error(`Failed to fetch diagnosis result for ID ${resultId}:`, error);
        
        // セッションストレージからも確認（フォールバック）
        const sessionResult = sessionStorage.getItem(`diagnosis-result-${resultId}`);
        if (sessionResult) {
          try {
            const result = JSON.parse(sessionResult);
            if (result && result.id === resultId) {
              const validatedResult = validateDiagnosisResult(result);
              if (validatedResult && !cancelled) {
                console.log("[CND²] Loading result from sessionStorage:", result.id);
                setDiagnosisResult(validatedResult);
                setIsLoadingResult(false);
                setLoadingResultId(null); // ローディング完了
                return;
              }
            }
          } catch (parseError) {
            console.error(`Failed to parse session storage result for ID ${resultId}:`, parseError);
          }
        }
        
        // 最終的にエラー状態を設定
        if (!cancelled) {
          setResultError(ERROR_MESSAGES.RESULT_NOT_FOUND);
          setIsLoadingResult(false);
          setLoadingResultId(null); // ローディング完了
        }
      }
    };
    
    loadResult();
    
    // クリーンアップ関数で競合状態を防ぐ
    return () => {
      cancelled = true;
    };
  }, [resultId, diagnosisResult, loadingResultId, validateResultId]);

  useEffect(() => {
    // タグラインを定期的に切り替える
    const intervalId = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, TAGLINE_ROTATION_INTERVAL);
    
    // クリーンアップ関数でインターバルをクリア
    return () => clearInterval(intervalId);
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

  // ローディング中の表示
  if (isLoadingResult && resultId) {
    return (
      <main className="min-h-screen relative overflow-hidden stars-bg flex items-center justify-center">
        <BackgroundEffects />
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-3xl p-8 max-w-md mx-auto"
          >
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">診断結果を読み込み中...</h2>
            <p className="text-gray-300">結果ID: {resultId}</p>
          </motion.div>
        </div>
      </main>
    );
  }

  // エラー表示
  if (resultError && resultId) {
    return (
      <main className="min-h-screen relative overflow-hidden stars-bg flex items-center justify-center">
        <BackgroundEffects />
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-3xl p-8 max-w-md mx-auto"
          >
            <div className="mb-6">
              <div className="text-6xl">⚠️</div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">診断結果の読み込みに失敗しました</h2>
            <p className="text-gray-300 mb-6">{resultError}</p>
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
              >
                再試行
              </button>
              <button
                onClick={handleGoHome}
                className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </motion.div>
        </div>
      </main>
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
            onReset={() => {
              setDiagnosisResult(null);
              setResultError(null);
              setIsLoadingResult(false);
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
            <span className="text-purple-400">Works with </span>
            <span className="gradient-text">Prairie Card</span>
          </motion.p>
        </motion.div>

        {/* アプリの説明 */}
        <AppDescription />

        {/* メニューカード */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto w-full mb-6">
          <MenuCard
            href="/duo"
            icon="🤝"
            title="Let's Connect 'n' Discover!"
            description="2人の相性をチェック"
            delay={0.2}
          />
          {/* グループ診断機能は一時的に非表示（開発優先度の調整）
          <MenuCard
            href="/group"
            icon="🎯"
            title="グループ診断"
            description="3-6人で診断"
            delay={0.4}
          />
          */}
        </div>

        {/* 診断同意事項 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-gray-400 text-center mb-12 px-4"
        >
          ※ 診断を開始することで、Prairie Card の公開プロフィール情報の<br className="hidden sm:inline" />
          読み取りと分析に同意したものとみなされます。
        </motion.p>

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