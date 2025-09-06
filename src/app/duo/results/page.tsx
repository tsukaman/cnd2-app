'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles, Handshake, MessageCircle, Target, Gift, Star } from 'lucide-react';
import Link from 'next/link';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';
import { DiagnosisResult } from '@/types';
import ShareButton from '@/components/share/ShareButton';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { DiagnosisFullDebug } from '@/components/diagnosis/DiagnosisFullDebug';
import Image from 'next/image';

const Confetti = dynamic(() => import('react-confetti').then(mod => mod.default), { ssr: false });

// スタイル定数
const LUCKY_PROJECT_STYLES = "bg-purple-900/20 rounded-xl p-4 border border-purple-500/30 text-center";

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
        const apiUrl = `/api/results?id=${resultId}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const responseData = await response.json();
          // Cloudflare Functionsのレスポンス形式に対応
          // APIレスポンスは { success: true, data: { result: {...} } } の形式
          const data = responseData.data?.result || responseData.result || responseData;
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
      } catch (_error) {
        logger.error('[Results] Failed to load result from KV:', _error);
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
              <Handshake className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 gradient-text-orange-soft">
              診断結果
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-semibold mb-2">
              CloudNative Days × Connect &apos;n&apos; Discover
            </p>
            {result.participants && (
              <p className="text-gray-300 mb-2">
                {result.participants[0]?.basic?.name || '1人目'} × {result.participants[1]?.basic?.name || '2人目'}
              </p>
            )}
            <p className="text-sm">
              <span className="text-purple-400">Works with </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent font-semibold">Prairie Card</span>
            </p>
          </div>
        </motion.div>

        {/* メインの診断結果カード */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-gray-700/50 mb-8"
        >
          {/* 相性スコア */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className={`inline-block bg-gradient-to-r ${scoreColor} text-transparent bg-clip-text`}
            >
              <span className="text-6xl md:text-8xl font-black">{result.compatibility || result.score || 0}</span>
              <span className="text-3xl md:text-4xl">%</span>
            </motion.div>
            {result.type && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-purple-400 font-bold mt-4"
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
              className="mb-8 p-4 md:p-6 bg-purple-900/20 rounded-2xl border border-purple-500/30"
            >
              <p className="text-white text-base md:text-lg leading-relaxed">
                {result.summary || result.message}
              </p>
            </motion.div>
          )}

          {/* 詳細分析セクション - アコーディオン形式 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              🔮 詳細な占術的分析
            </h3>
            
            {/* 五行思想分析 */}
            {(result.fiveElementsAnalysis || result.metadata?.analysis?.fiveElementsAnalysis) && (
              <CollapsibleSection
                title="五行思想分析"
                icon="☯️"
                className="bg-amber-900/20 border border-amber-500/30"
                titleClassName="text-amber-400"
              >
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {result.fiveElementsAnalysis || result.metadata?.analysis?.fiveElementsAnalysis}
                </p>
              </CollapsibleSection>
            )}

            {/* 占星術的分析 */}
            {(result.astrologicalAnalysis || result.metadata?.analysis?.astrologicalAnalysis) && (
              <CollapsibleSection
                title="占星術的分析"
                icon={<Star className="w-5 h-5 text-blue-400" />}
                className="bg-blue-900/20 border border-blue-500/30"
                titleClassName="text-blue-400"
              >
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {result.astrologicalAnalysis || result.metadata?.analysis?.astrologicalAnalysis}
                </p>
              </CollapsibleSection>
            )}

            {/* 数秘術分析 */}
            {(result.numerologyAnalysis || result.metadata?.analysis?.numerologyAnalysis) && (
              <CollapsibleSection
                title="数秘術分析"
                icon="🔢"
                className="bg-indigo-900/20 border border-indigo-500/30"
                titleClassName="text-indigo-400"
              >
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {result.numerologyAnalysis || result.metadata?.analysis?.numerologyAnalysis}
                </p>
              </CollapsibleSection>
            )}

            {/* エネルギーフィールド分析 */}
            {(result.energyFieldAnalysis || result.metadata?.analysis?.energyFieldAnalysis) && (
              <CollapsibleSection
                title="エネルギーフィールド分析"
                icon={<Sparkles className="w-5 h-5 text-purple-400" />}
                className="bg-purple-900/20 border border-purple-500/30"
                titleClassName="text-purple-400"
              >
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {result.energyFieldAnalysis || result.metadata?.analysis?.energyFieldAnalysis}
                </p>
              </CollapsibleSection>
            )}

            {/* 技術的シナジー分析 */}
            {(result.technicalSynergy || result.techStackCompatibility || result.metadata?.analysis?.technicalSynergy || result.metadata?.analysis?.techStackCompatibility) && (
              <CollapsibleSection
                title="技術的シナジー"
                icon={<Target className="w-5 h-5 text-green-400" />}
                className="bg-green-900/20 border border-green-500/30"
                titleClassName="text-green-400"
              >
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {result.technicalSynergy || result.techStackCompatibility || result.metadata?.analysis?.technicalSynergy || result.metadata?.analysis?.techStackCompatibility}
                </p>
              </CollapsibleSection>
            )}
          </motion.div>

          {/* おすすめの会話トピック */}
          {result.conversationStarters && result.conversationStarters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-4 md:p-6 border border-cyan-500/30">
                <div className="flex items-center mb-4">
                  <MessageCircle className="w-6 h-6 text-cyan-400 mr-3" />
                  <h3 className="text-lg md:text-xl font-bold text-white">💬 おすすめの会話トピック</h3>
                </div>
                <div className="space-y-3">
                  {result.conversationStarters.map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex items-center bg-white/5 rounded-lg p-2.5 md:p-3 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-cyan-400 text-base md:text-lg mr-3">{index + 1}</span>
                      <span className="text-sm md:text-base text-white/90 flex-1 leading-relaxed">{topic}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
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
                <p className="text-sm md:text-base text-yellow-300 font-bold">{result.luckyItem}</p>
              </div>
            )}
            {result.luckyAction && (
              <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30 text-center">
                <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-1">ラッキーアクション</p>
                <p className="text-sm md:text-base text-cyan-300 font-bold">{result.luckyAction}</p>
              </div>
            )}
          </motion.div>
          
          {/* CNCFラッキープロジェクト */}
          {result.luckyProject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35 }}
              className="mt-4"
            >
              <div className={LUCKY_PROJECT_STYLES}>
                <div className="flex items-center justify-center mb-3">
                  <span className="text-2xl mr-2">🚀</span>
                  <span className="text-sm text-gray-400">CNCFラッキープロジェクト</span>
                </div>
                <p className="text-purple-300 font-bold text-base md:text-lg mb-2">{result.luckyProject}</p>
                {result.luckyProjectDescription && (
                  <p className="text-gray-300 text-sm mb-3">{result.luckyProjectDescription}</p>
                )}
                {result.luckyProjectUrl && (
                  <a 
                    href={result.luckyProjectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors text-sm"
                  >
                    <span className="mr-1">プロジェクトサイトを見る</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </motion.div>
          )}
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

        {/* フッター */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col items-center gap-4 mt-16 pt-8 border-t border-gray-700/50"
        >
          <Image
            src="/images/trademark@4x.png"
            alt="CloudNative Days Winter 2025"
            width={80}
            height={20}
            className="opacity-90"
          />
          <p className="text-sm md:text-base text-purple-400 font-medium">
            #CNDxCnD
          </p>
          <p className="text-gray-500 text-xs font-medium">
            © 2025 CloudNative Days Committee
          </p>
        </motion.div>
      </div>
    </div>
  );
}