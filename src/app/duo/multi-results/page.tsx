'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';
import { MultiStyleResults } from '@/components/diagnosis/MultiStyleResults';
import { CLEANUP_INTERVALS } from '@/lib/constants/diagnosis';

export default function MultiResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up old diagnosis results (older than 24 hours)
    const cleanupOldResults = () => {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('diagnosis-multi-'));
      keys.forEach(key => {
        try {
          const timestamp = parseInt(key.split('-').pop() || '0');
          const age = Date.now() - timestamp;
          if (age > CLEANUP_INTERVALS.TTL_MS) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      });
    };
    cleanupOldResults();

    const resultId = searchParams.get('id');
    if (!resultId) {
      router.push('/duo');
      return;
    }

    // LocalStorageから結果を取得
    const storedData = localStorage.getItem(`diagnosis-multi-${resultId}`);
    if (storedData) {
      setResults(JSON.parse(storedData));
    } else {
      router.push('/duo');
    }
    setLoading(false);
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden stars-bg flex items-center justify-center">
        <BackgroundEffects />
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">結果を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // APIレスポンスが直接格納されている場合と、ラップされている場合の両方に対応
  const diagnosisData = results.result ? results.result : results;
  const multiResults = diagnosisData.multiResults || diagnosisData.results || [];
  const summary = diagnosisData.summary || {
    bestStyle: 'creative',
    bestScore: 0,
    averageScore: 0,
    allScores: [],
    recommendation: ''
  };
  const metadata = diagnosisData.metadata || {};

  return (
    <div className="min-h-screen relative overflow-hidden stars-bg">
      <BackgroundEffects />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/duo" className="inline-flex items-center text-white hover:text-cyan-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">診断に戻る</span>
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
              <Users className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 gradient-text-orange-soft">
              複数スタイル診断結果
            </h1>
            <p className="text-gray-300 text-lg">
              {multiResults.length}つのスタイルで診断しました
            </p>
          </div>
        </motion.div>

        {/* 診断結果 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MultiStyleResults 
            results={multiResults} 
            summary={summary}
          />
        </motion.div>

        {/* 処理時間の表示 */}
        {metadata && metadata.processingTimeMs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center text-sm text-gray-500"
          >
            処理時間: {(metadata.processingTimeMs / 1000).toFixed(2)}秒
          </motion.div>
        )}

        {/* アクションボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex justify-center space-x-4"
        >
          <Link
            href="/duo"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors inline-flex items-center"
          >
            <Users className="w-5 h-5 mr-2" />
            別の2人を診断
          </Link>
          
          <button
            onClick={() => {
              // TODO: シェア機能の実装
              alert('シェア機能は準備中です');
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 inline-flex items-center"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            結果をシェア
          </button>
        </motion.div>
      </div>
    </div>
  );
}