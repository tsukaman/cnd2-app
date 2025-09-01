'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Users, Award, Lightbulb, Target, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ShareButton from '@/components/share/ShareButton';
import { DiagnosisResult } from '@/types';
import { logger } from '@/lib/logger';

/**
 * 共有用診断結果表示ページ
 * /result/[id] でアクセスされる
 */
export default function SharedResultPage() {
  const params = useParams();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!params.id) {
        setError('結果IDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/results/${params.id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || '結果の取得に失敗しました');
        }

        setResult(data.data.result);
      } catch (err) {
        logger.error('[SharedResult] Failed to fetch result:', err);
        setError(err instanceof Error ? err.message : '結果の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">診断結果を読み込んでいます...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😢</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">結果が見つかりません</h2>
          <p className="text-gray-400 mb-6">
            {error || '指定された診断結果が見つかりませんでした。URLをご確認ください。'}
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold inline-block hover:shadow-lg transition-all"
          >
            診断を始める
          </Link>
        </motion.div>
      </div>
    );
  }

  const scoreColor = result.compatibility >= 80 ? 'from-green-400 to-emerald-400' :
                    result.compatibility >= 60 ? 'from-blue-400 to-cyan-400' :
                    result.compatibility >= 40 ? 'from-yellow-400 to-orange-400' :
                    'from-red-400 to-pink-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-white">CND² 相性診断</h1>
          </Link>
          <p className="text-gray-400">CloudNative Days × Cloud Native Developers</p>
        </motion.div>

        {/* 診断結果カード */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 mb-8"
        >
          {/* スコア表示 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block">
              <motion.div
                className={`text-8xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(168, 85, 247, 0.5)",
                    "0 0 40px rgba(168, 85, 247, 0.8)",
                    "0 0 20px rgba(168, 85, 247, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {result.compatibility}%
              </motion.div>
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
            <p className="text-2xl font-bold text-white mt-4">{result.type}</p>
          </motion.div>

          {/* サマリー */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-purple-900/30 rounded-xl p-6 mb-6"
          >
            <p className="text-gray-200 leading-relaxed text-lg">{result.summary}</p>
          </motion.div>

          {/* 強みと機会 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-green-900/20 rounded-xl p-6 border border-green-500/30"
            >
              <div className="flex items-center mb-4">
                <Award className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-xl font-bold text-green-400">強み</h3>
              </div>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30"
            >
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-blue-400 mr-2" />
                <h3 className="text-xl font-bold text-blue-400">成長の機会</h3>
              </div>
              <ul className="space-y-2">
                {result.opportunities.map((opportunity, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="text-blue-400 mr-2">→</span>
                    {opportunity}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* アドバイス */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-indigo-900/20 rounded-xl p-6 border border-indigo-500/30 mb-6"
          >
            <div className="flex items-center mb-4">
              <Lightbulb className="w-6 h-6 text-indigo-400 mr-2" />
              <h3 className="text-xl font-bold text-indigo-400">アドバイス</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{result.advice}</p>
          </motion.div>

          {/* 運勢情報 */}
          {(result.fortuneMessage || result.luckyItem || result.luckyAction) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {result.fortuneMessage && (
                <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30 text-center">
                  <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-1">今日の運勢</p>
                  <p className="text-purple-300 font-semibold">{result.fortuneMessage}</p>
                </div>
              )}
              {result.luckyItem && (
                <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30 text-center">
                  <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-1">ラッキーアイテム</p>
                  <p className="text-amber-300 font-bold">{result.luckyItem}</p>
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
          )}
        </motion.div>

        {/* アクションボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Link
            href="/"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors inline-flex items-center"
          >
            <Users className="w-5 h-5 mr-2" />
            自分も診断してみる
          </Link>
          
          <ShareButton resultId={result.id} score={result.compatibility} />
        </motion.div>

        {/* フッター */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="text-center mt-12 text-gray-500 text-sm"
        >
          <p>Created at {new Date(result.createdAt).toLocaleDateString('ja-JP')}</p>
          {result.aiPowered && (
            <p className="mt-1">Powered by AI ✨</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}