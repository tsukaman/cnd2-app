'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles, Heart, MessageCircle, Target, TrendingUp, Gift, Star, Share2 } from 'lucide-react';
import Link from 'next/link';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';
import { DiagnosisResult } from '@/types';
import ShareButton from '@/components/share/ShareButton';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { DiagnosisFullDebug } from '@/components/diagnosis/DiagnosisFullDebug';

const Confetti = dynamic(() => import('react-confetti').then(mod => mod.default), { ssr: false });

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // デバッグモードの判定（開発環境のみ、または本番で明示的に有効化された場合）
  const isDebugEnabled = process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_ENABLE_PRODUCTION_DEBUG === 'true';
  const debugMode = searchParams.get('debug') === 'true' && isDebugEnabled;

  useEffect(() => {
    const resultId = searchParams.get('id');
    if (!resultId) {
      router.push('/duo');
      return;
    }

    const loadResult = async () => {
      // まずLocalStorageから結果を取得
      const storedData = localStorage.getItem(`diagnosis-result-${resultId}`);
      if (storedData) {
        const parsedResult = JSON.parse(storedData);
        setResult(parsedResult);
        // 高スコアの場合は紙吹雪を表示
        if (parsedResult.compatibility && parsedResult.compatibility >= 80) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
        setLoading(false);
        return;
      }

      // LocalStorageになければKVストレージから取得
      try {
        // Cloudflare Functionsのエンドポイントを使用
        const apiUrl = `/api/results/${resultId}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const responseData = await response.json();
          // Cloudflare Functionsのレスポンス形式に対応
          const data = responseData.result || responseData;
          setResult(data);
          // LocalStorageにも保存
          localStorage.setItem(`diagnosis-result-${resultId}`, JSON.stringify(data));
          // 高スコアの場合は紙吹雪を表示
          if (data.compatibility && data.compatibility >= 80) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        } else {
          // 結果が見つからない場合はトップページへ
          router.push('/duo');
        }
      } catch (error) {
        logger.error('[Results] Failed to load result from KV:', error);
        router.push('/duo');
      }
      setLoading(false);
    };

    loadResult();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden stars-bg flex items-center justify-center">
        <BackgroundEffects />
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">診断結果を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // スコアに基づいた色を取得
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-yellow-400 to-orange-500';
    if (score >= 80) return 'from-purple-400 to-pink-500';
    if (score >= 70) return 'from-blue-400 to-cyan-500';
    if (score >= 60) return 'from-green-400 to-emerald-500';
    return 'from-gray-400 to-gray-500';
  };

  const scoreColor = getScoreColor(result.compatibility || result.score || 0);

  return (
    <div className="min-h-screen relative overflow-hidden stars-bg">
      {showConfetti && <Confetti />}
      <BackgroundEffects />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/duo" className="inline-flex items-center text-white hover:text-cyan-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">新しい診断を始める</span>
          </Link>
          
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center justify-center mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Heart className="w-16 h-16 text-pink-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 gradient-text-orange-soft">
              診断結果
            </h1>
            {result.participants && (
              <p className="text-gray-300 text-lg">
                {result.participants[0]?.basic?.name || '1人目'} × {result.participants[1]?.basic?.name || '2人目'}
              </p>
            )}
          </div>
        </motion.div>

        {/* メインの診断結果カード */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50 mb-8"
        >
          {/* 相性スコア */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className={`inline-block bg-gradient-to-r ${scoreColor} text-transparent bg-clip-text`}
            >
              <span className="text-8xl font-black">{result.compatibility || result.score || 0}</span>
              <span className="text-4xl">%</span>
            </motion.div>
            {result.type && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-purple-400 font-bold mt-4"
              >
                {result.type}
              </motion.p>
            )}
          </div>

          {/* 診断サマリー */}
          {(result.summary || result.message) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8 p-6 bg-purple-900/20 rounded-2xl border border-purple-500/30"
            >
              <p className="text-white text-lg leading-relaxed">
                {result.summary || result.message}
              </p>
            </motion.div>
          )}

          {/* 詳細分析セクション */}
          <div className="grid gap-6 mb-8">
            {/* 占星術的分析 - 修正: result.astrologicalAnalysisに直接アクセス */}
            {(result.astrologicalAnalysis || result.metadata?.analysis?.astrologicalAnalysis) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-blue-900/20 rounded-2xl p-6 border border-blue-500/30"
              >
                <div className="flex items-center mb-3">
                  <Star className="w-5 h-5 text-blue-400 mr-2" />
                  <h3 className="text-lg font-bold text-blue-400">占星術的分析</h3>
                </div>
                <p className="text-gray-300">
                  {result.astrologicalAnalysis || result.metadata?.analysis?.astrologicalAnalysis}
                </p>
              </motion.div>
            )}

            {/* 技術スタック相性 - 修正: result.techStackCompatibilityに直接アクセス */}
            {(result.techStackCompatibility || result.metadata?.analysis?.techStackCompatibility) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-green-900/20 rounded-2xl p-6 border border-green-500/30"
              >
                <div className="flex items-center mb-3">
                  <Target className="w-5 h-5 text-green-400 mr-2" />
                  <h3 className="text-lg font-bold text-green-400">技術スタック相性</h3>
                </div>
                <p className="text-gray-300">
                  {result.techStackCompatibility || result.metadata?.analysis?.techStackCompatibility}
                </p>
              </motion.div>
            )}
          </div>

          {/* おすすめの会話トピック */}
          {result.conversationStarters && result.conversationStarters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <div className="flex items-center mb-4">
                <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
                <h3 className="text-lg font-bold text-cyan-400">おすすめの会話トピック</h3>
              </div>
              <div className="space-y-3">
                {result.conversationStarters.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-start"
                  >
                    <span className="text-cyan-400 mr-2">•</span>
                    <p className="text-gray-300">{topic}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 強みと機会 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {result.strengths && result.strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="bg-purple-900/20 rounded-2xl p-6 border border-purple-500/30"
              >
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="text-lg font-bold text-purple-400">強み</h3>
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-purple-400 mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {result.opportunities && result.opportunities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-pink-900/20 rounded-2xl p-6 border border-pink-500/30"
              >
                <div className="flex items-center mb-3">
                  <Sparkles className="w-5 h-5 text-pink-400 mr-2" />
                  <h3 className="text-lg font-bold text-pink-400">機会</h3>
                </div>
                <ul className="space-y-2">
                  {result.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-pink-400 mr-2">◆</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* アドバイス */}
          {result.advice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mb-8 p-6 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-2xl border border-orange-500/30"
            >
              <p className="text-orange-300 text-lg">
                💡 {result.advice}
              </p>
            </motion.div>
          )}

          {/* ラッキーアイテム・アクション */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {result.luckyItem && (
              <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/30 text-center">
                <Gift className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">ラッキーアイテム</p>
                <p className="text-yellow-300 font-bold">{result.luckyItem}</p>
              </div>
            )}
            {result.luckyAction && (
              <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30 text-center">
                <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">ラッキーアクション</p>
                <p className="text-cyan-300 font-bold">{result.luckyAction}</p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* アクションボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex justify-center space-x-4"
        >
          <Link
            href="/duo"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors inline-flex items-center"
          >
            <Users className="w-5 h-5 mr-2" />
            別の2人を診断
          </Link>
          
          <ShareButton resultId={result.id} score={result.compatibility || result.score || 0} />
        </motion.div>

        {/* DEBUG: 全LLMフィールド表示（?debug=trueの時のみ） */}
        {debugMode && <DiagnosisFullDebug result={result} />}
      </div>
    </div>
  );
}