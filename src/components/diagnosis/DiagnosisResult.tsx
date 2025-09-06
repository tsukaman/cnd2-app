"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DiagnosisResult } from "@/types";
import { CND2_CONFIG } from "@/config/cnd2.config";
import { Download, RefreshCw, Trophy, MessageCircle, Sparkles, QrCode } from "lucide-react";
import ShareButton from '@/components/share/ShareButton';
import { QRCodeModal } from '@/components/share/QRCodeModal';
import Confetti from "react-confetti";
import { useState, useEffect } from "react";

// 定数定義
const DEFAULT_COMPATIBILITY_SCORE = 85; // デフォルトの相性スコア（ポジティブな体験を保証）
const LUCKY_PROJECT_STYLES = "mb-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl p-5 border border-indigo-400/30";

interface DiagnosisResultProps {
  result: DiagnosisResult;
  onReset?: () => void;
}

export function DiagnosisResultComponent({ result, onReset }: DiagnosisResultProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showQRModal, setShowQRModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // ウィンドウサイズを取得
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // 5秒後にコンフェッティを停止
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    const url = `https://cnd2.cloudnativedays.jp/result/${result.id}`;
    navigator.clipboard.writeText(url);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 相性度に応じた色を決定
  const getScoreColor = (compatibility: number) => {
    if (compatibility >= 90) return "from-yellow-400 to-orange-500"; // ゴールド
    if (compatibility >= 80) return "from-purple-500 to-pink-500";   // パープル
    if (compatibility >= 70) return "from-blue-500 to-cyan-500";     // ブルー
    return "from-green-500 to-emerald-500";                   // グリーン
  };

  return (
    <>
      {/* コンフェッティ効果 */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1 }}
        className="max-w-4xl mx-auto px-4 py-4 animate-fadeIn"
        data-testid="diagnosis-result-container"
        role="article"
        aria-label="診断結果"
      >
        {/* CND²ロゴアニメーション */}
        <motion.div className="text-center mb-6">
          <motion.span 
            className="text-6xl font-bold text-cyan-400"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            CND²
          </motion.span>
        </motion.div>

        {/* 結果カード */}
        <div className="glass-effect rounded-3xl p-8 relative overflow-hidden">
          {/* 背景のグラデーション効果 */}
          <div className="absolute inset-0 opacity-10">
            <div className={`absolute inset-0 bg-gradient-to-br ${getScoreColor(result.compatibility || result.score || 85)}`} />
          </div>

          {/* スコア表示 */}
          <motion.div 
            className="relative text-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <div className="inline-flex items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-500 mr-2" />
              <span className="text-5xl font-bold text-white">{result.compatibility || result.score || DEFAULT_COMPATIBILITY_SCORE}</span>
              <span className="text-2xl text-white/80 ml-1">/100</span>
            </div>
            <div className="text-sm text-white/60 mt-2">相性スコア</div>
          </motion.div>

          {/* 診断タイプ */}
          <motion.h2 
            className={`text-3xl md:text-4xl font-bold text-center mb-6 bg-gradient-to-r ${getScoreColor(result.compatibility || result.score || DEFAULT_COMPATIBILITY_SCORE)} bg-clip-text text-transparent`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {result.type}
            {result.mode === 'group' && result.participants && (
              <div className="text-sm text-white/60 mt-2">
                {result.participants.length}人
              </div>
            )}
          </motion.h2>

          {/* 診断メッセージ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mb-8"
          >
            <p className="text-lg md:text-xl text-white mb-4">
              {result.summary || result.message}
            </p>
            <p className="text-md text-purple-400 font-semibold">
              &quot;Scaling Together² - 出会いを二乗でスケール！&quot;
            </p>
          </motion.div>

          {/* おすすめの会話トピック */}
          {result.conversationStarters && result.conversationStarters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-500/30">
                <div className="flex items-center mb-4">
                  <MessageCircle className="w-6 h-6 text-cyan-400 mr-3" />
                  <h3 className="text-xl font-bold text-white">💬 おすすめの会話トピック</h3>
                </div>
                <div className="space-y-3">
                  {result.conversationStarters.map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className="flex items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-cyan-400 text-lg mr-3">{index + 1}</span>
                      <span className="text-white/90 flex-1">{topic}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}


          {/* 点取り占い */}
          {result.fortuneTelling && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mb-8"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">今日の運勢（点取り占い）</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{result.fortuneTelling.overall}</div>
                  <div className="text-xs text-white/60 mt-1">総合運</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{result.fortuneTelling.tech}</div>
                  <div className="text-xs text-white/60 mt-1">技術運</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-pink-400">{result.fortuneTelling.collaboration}</div>
                  <div className="text-xs text-white/60 mt-1">コラボ運</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{result.fortuneTelling.growth}</div>
                  <div className="text-xs text-white/60 mt-1">成長運</div>
                </div>
              </div>
              <p className="text-center text-white/80 mt-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3">
                💫 {result.fortuneTelling.message}
              </p>
            </motion.div>
          )}

          {/* アドバイス */}
          {result.hiddenGems && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mb-8"
            >
              <div className="flex items-center mb-3">
                <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">アドバイス</h3>
              </div>
              <p className="text-white/80 bg-white/10 rounded-xl p-4">
                {result.hiddenGems}
              </p>
            </motion.div>
          )}

          {/* ラッキーアイテム＆アクション */}
          {(result.luckyItem || result.luckyAction) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 }}
              className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-purple-400/30"
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-4">
                  ✨ 今日のラッキー占い ✨
                </h3>
                {result.luckyItem && (
                  <div className="mb-3">
                    <span className="text-white/90">{result.luckyItem}</span>
                  </div>
                )}
                {result.luckyAction && (
                  <div>
                    <span className="text-white/90">{result.luckyAction}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CNCFラッキープロジェクト */}
          {result.luckyProject && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.65 }}
              className={LUCKY_PROJECT_STYLES}
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-4 flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  CNCFラッキープロジェクト
                </h3>
                <div className="text-white/90 font-semibold">
                  {result.luckyProject}
                </div>
                {result.luckyProjectDescription && (
                  <p className="text-white/70 text-sm mt-2">
                    {result.luckyProjectDescription}
                  </p>
                )}
                {result.luckyProjectUrl && (
                  <a
                    href={result.luckyProjectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-xl text-sm font-medium transition-all hover:scale-105"
                  >
                    <span>プロジェクトを見る</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* アクションボタン */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <ShareButton resultId={result.id} score={result.compatibility ?? result.score ?? 85} />

            <motion.button
              onClick={() => setShowQRModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <QrCode className="w-5 h-5" />
              QRコード
            </motion.button>

            <motion.button
              onClick={copyToClipboard}
              className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-xl font-semibold flex items-center justify-center gap-2 border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5" />
              URLをコピー
            </motion.button>

            {onReset && (
              <motion.button
                onClick={onReset}
                className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-xl font-semibold flex items-center justify-center gap-2 border border-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-5 h-5" />
                もう一度診断
              </motion.button>
            )}
          </motion.div>

          {/* ハッシュタグ促進 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9 }}
            className="text-center mt-8 text-white/60"
          >
            結果を {CND2_CONFIG.app.hashtag} でシェアして、出会いを二乗でスケールしよう！
          </motion.p>
        </div>

        {/* 参加者情報 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-6 text-center text-white/60 text-sm"
        >
          <p>診断参加者：{result.participants.map(p => p.basic.name).join(' × ')}</p>
          <p className="mt-1">診断日時：{new Date(result.createdAt).toLocaleString('ja-JP')}</p>
        </motion.div>
      </motion.div>

      {/* QRコードモーダル */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        resultId={result.id}
        score={result.compatibility ?? result.score ?? 85}
      />

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-green-500/90 backdrop-blur text-white px-6 py-3 rounded-xl shadow-lg">
              ✓ URLをコピーしました
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export with expected name for tests
export { DiagnosisResultComponent as DiagnosisResult };