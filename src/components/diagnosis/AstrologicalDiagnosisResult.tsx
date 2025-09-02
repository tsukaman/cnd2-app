"use client";

import { motion } from "framer-motion";
import { DiagnosisResult } from "@/types";
import { Star, Sparkles, Users, MessageCircle, Zap, Heart, Trophy, Gift, Target } from "lucide-react";
import { useState, useEffect } from "react";
import Confetti from "react-confetti";

interface AstrologicalDiagnosisResultProps {
  result: DiagnosisResult;
  onReset?: () => void;
}

export function AstrologicalDiagnosisResult({ result, onReset }: AstrologicalDiagnosisResultProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 相性に応じた評価メッセージ
  const getCompatibilityMessage = (score: number) => {
    if (score >= 90) return "運命的なCloud Native相性！";
    if (score >= 80) return "素晴らしいCloud Native相性！";
    if (score >= 75) return "良好なCloud Native相性！";
    return "Cloud Native Journey の始まり！";
  };

  // 相性度に応じた色を決定
  const getScoreColor = (compatibility: number) => {
    if (compatibility >= 90) return "from-yellow-400 to-orange-500";
    if (compatibility >= 80) return "from-purple-500 to-pink-500";
    if (compatibility >= 75) return "from-blue-500 to-cyan-500";
    return "from-green-500 to-emerald-500";
  };

  const participants = result.participants || [];
  // const name1 = participants[0]?.basic?.name || "エンジニア1";
  // const name2 = participants[1]?.basic?.name || "エンジニア2";

  return (
    <>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        {/* ヘッダー: 占星術風タイトル */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            🔮 Cloud Native Days 相性占い 🐳
          </h1>
          <p className="text-gray-400">
            占星術 × Cloud Native エンジニアリングで紡ぐ、技術者同士の絆
          </p>
        </motion.div>

        {/* メインスコア */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="glass-effect rounded-2xl p-8 mb-6"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <motion.div
                className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {result.compatibility}%
              </motion.div>
            </div>
            <h2 className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(result.compatibility)} bg-clip-text text-transparent`}>
              {getCompatibilityMessage(result.compatibility)}
            </h2>
          </div>
        </motion.div>

        {/* 占星術的分析 */}
        {result.astrologicalAnalysis && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center mb-4">
              <Star className="w-6 h-6 text-yellow-400 mr-2" />
              <h3 className="text-xl font-bold text-white">🔮 占星術的分析</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {result.astrologicalAnalysis}
            </p>
          </motion.div>
        )}

        {/* 技術スタック相性 */}
        {result.techStackCompatibility && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 text-cyan-400 mr-2" />
              <h3 className="text-xl font-bold text-white">⚙️ 技術スタック相性</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {result.techStackCompatibility}
            </p>
          </motion.div>
        )}

        {/* おすすめ会話トピック */}
        {result.conversationTopics && result.conversationTopics.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-xl font-bold text-white">💬 おすすめ会話トピック</h3>
            </div>
            <ul className="space-y-3">
              {result.conversationTopics.map((topic, index) => (
                <motion.li
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start"
                >
                  <span className="text-purple-400 mr-2">•</span>
                  <span className="text-gray-300">{topic}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* 強みと機会 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 強み */}
          {result.strengths && result.strengths.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="flex items-center mb-4">
                <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
                <h3 className="text-lg font-bold text-white">強み</h3>
              </div>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <Sparkles className="w-4 h-4 text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* 機会 */}
          {result.opportunities && result.opportunities.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="flex items-center mb-4">
                <Heart className="w-6 h-6 text-pink-400 mr-2" />
                <h3 className="text-lg font-bold text-white">機会</h3>
              </div>
              <ul className="space-y-2">
                {result.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start">
                    <Sparkles className="w-4 h-4 text-pink-400 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* アドバイス */}
        {result.advice && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="glass-effect rounded-2xl p-6 mb-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20"
          >
            <div className="flex items-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-400 mr-2" />
              <h3 className="text-lg font-bold text-white">アドバイス</h3>
            </div>
            <p className="text-gray-300 italic">{result.advice}</p>
          </motion.div>
        )}

        {/* ラッキーアイテムとラッキーアクション */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* ラッキーアイテム */}
          {result.luckyItem && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="glass-effect rounded-2xl p-6 bg-gradient-to-br from-yellow-900/20 to-orange-900/20"
            >
              <div className="flex items-center mb-4">
                <Gift className="w-6 h-6 text-yellow-400 mr-2" />
                <h3 className="text-lg font-bold text-white">🌟 ラッキーアイテム</h3>
              </div>
              <p className="text-gray-300 text-lg">{result.luckyItem}</p>
            </motion.div>
          )}

          {/* ラッキーアクション */}
          {result.luckyAction && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="glass-effect rounded-2xl p-6 bg-gradient-to-br from-green-900/20 to-teal-900/20"
            >
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-lg font-bold text-white">🎯 ラッキーアクション</h3>
              </div>
              <p className="text-gray-300 text-lg">{result.luckyAction}</p>
            </motion.div>
          )}
        </div>

        {/* 参加者 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-400 mr-2" />
            <h3 className="text-lg font-bold text-white">診断参加者</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold">
                  {participant.basic?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">{participant.basic?.name || `参加者${index + 1}`}</p>
                  {participant.basic?.company && (
                    <p className="text-gray-400 text-sm">{participant.basic.company}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* アクションボタン */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-4"
        >
          <button
            onClick={onReset}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            もう一度診断する
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              alert("URLをコピーしました！");
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
          >
            結果を共有
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}