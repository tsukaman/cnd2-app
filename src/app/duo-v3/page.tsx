'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDiagnosisV3 } from '@/hooks/useDiagnosisV3';

/**
 * Duo V3 Page - シンプルな診断ページ
 * Prairie CardのURLを直接AIに渡して診断
 */
export default function DuoV3Page() {
  const router = useRouter();
  const [urls, setUrls] = useState<[string, string]>(['', '']);
  const { diagnose, isLoading, error, result } = useDiagnosisV3();

  const handleUrlChange = (value: string, index: 0 | 1) => {
    const newUrls = [...urls] as [string, string];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleStartDiagnosis = async () => {
    if (urls[0] && urls[1]) {
      await diagnose(urls);
      // 結果はhookのuseEffect内で処理される
    }
  };

  // 診断結果が返ってきたら遷移
  if (result) {
    localStorage.setItem(`diagnosis-result-${result.id}`, JSON.stringify(result));
    router.push(`/?result=${result.id}&mode=duo`);
  }

  const canStartDiagnosis = urls[0] && urls[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center text-white hover:text-cyan-400 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>ホームに戻る</span>
          </Link>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              AI診断 v3（実験版）
            </h1>
            <p className="text-gray-400">
              Prairie CardのURLを入力するだけで診断開始
            </p>
            <p className="text-xs text-cyan-400 mt-2">
              🚀 AIが直接HTMLを解析して相性を診断します
            </p>
          </div>
        </motion.div>

        {/* メインコンテンツ */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-3xl p-8 space-y-6"
        >
          {/* URL入力フォーム */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1人目のPrairie Card URL
              </label>
              <input
                type="url"
                value={urls[0]}
                onChange={(e) => handleUrlChange(e.target.value, 0)}
                placeholder="https://my.prairie.cards/u/username1"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              {urls[0] && (
                <p className="text-xs text-green-400 mt-1">✓ URLを設定しました</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                2人目のPrairie Card URL
              </label>
              <input
                type="url"
                value={urls[1]}
                onChange={(e) => handleUrlChange(e.target.value, 1)}
                placeholder="https://my.prairie.cards/u/username2"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              {urls[1] && (
                <p className="text-xs text-green-400 mt-1">✓ URLを設定しました</p>
              )}
            </div>
          </div>

          {/* 診断開始ボタン */}
          <button
            onClick={handleStartDiagnosis}
            disabled={!canStartDiagnosis || isLoading}
            className="w-full btn-primary flex items-center justify-center space-x-2 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>AI診断中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>診断開始</span>
              </>
            )}
          </button>

          {/* 処理中のステータス表示 */}
          {isLoading && (
            <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-400 text-sm">
                🤖 AIがPrairie Cardの内容を解析中...
              </p>
              <p className="text-blue-400 text-xs mt-1">
                GPT-4oを使用して詳細な相性分析を行っています
              </p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-400">エラー: {error}</p>
            </div>
          )}
        </motion.div>

        {/* 説明セクション */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glass-effect rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-3">
            🆕 新しい診断方式について
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span>Prairie Card全体をAIが直接解析</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span>より詳細で正確な相性診断</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span>新しいフォーマットにも自動対応</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span>
              <span>GPT-4o使用でより高度な分析</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}