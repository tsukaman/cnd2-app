"use client";

import { motion } from "framer-motion";
import { DiagnosisResult } from "@/types";
import { Info, Database, Brain, Users, Hash, Zap, Target, Gift, Activity, Box } from "lucide-react";

interface DiagnosisFullDebugProps {
  result: DiagnosisResult;
}

/**
 * LLMから取得した全フィールドを表示するデバッグコンポーネント
 * トークン消費量の最適化を判断するため一時的に使用
 */
export function DiagnosisFullDebug({ result }: DiagnosisFullDebugProps) {
  // メタデータを安全に取得
  const metadata = result.metadata as any || {};
  const calculatedScore = metadata.calculatedScore || {};
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8 space-y-6"
    >
      <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4 mb-6">
        <h1 className="text-2xl font-bold text-red-400 flex items-center gap-2">
          <Info className="w-6 h-6" />
          DEBUG MODE: LLM全フィールド表示
        </h1>
        <p className="text-white/60 mt-2">トークン最適化のための一時的な全データ表示</p>
      </div>

      {/* 現在表示されているフィールド */}
      <section className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          ✅ 現在表示されているフィールド
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">基本情報</h3>
            <ul className="space-y-1 text-white/80 text-sm">
              <li>• type: {result.type}</li>
              <li>• compatibility/score: {result.compatibility || result.score}</li>
              <li>• summary/message: {(result.summary || result.message || '').substring(0, 50)}...</li>
            </ul>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">コンテンツ</h3>
            <ul className="space-y-1 text-white/80 text-sm">
              <li>• conversationStarters: {result.conversationStarters?.length || 0}件</li>
              <li>• hiddenGems (adviceとして表示): {result.hiddenGems ? '有' : '無'}</li>
              <li>• luckyItem: {result.luckyItem ? '有' : '無'}</li>
              <li>• luckyAction: {result.luckyAction ? '有' : '無'}</li>
              <li>• luckyProject: {result.luckyProject ? '有' : '無'}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 未使用フィールド（赤色強調） */}
      <section className="glass-effect rounded-xl p-6 border-2 border-orange-500">
        <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          ⚠️ LLMから取得しているが表示されていないフィールド
        </h2>
        
        {/* astrologicalAnalysis */}
        {result.astrologicalAnalysis && (
          <div className="bg-orange-500/10 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              astrologicalAnalysis（占星術的分析）
            </h3>
            <p className="text-white/70 text-sm whitespace-pre-wrap">{result.astrologicalAnalysis}</p>
            <div className="mt-2 text-xs text-orange-300">
              💡 推定トークン数: ~{Math.ceil((result.astrologicalAnalysis?.length || 0) / 4)}
            </div>
          </div>
        )}

        {/* techStackCompatibility */}
        {result.techStackCompatibility && (
          <div className="bg-orange-500/10 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              techStackCompatibility（技術スタック互換性）
            </h3>
            <p className="text-white/70 text-sm whitespace-pre-wrap">{result.techStackCompatibility}</p>
            <div className="mt-2 text-xs text-orange-300">
              💡 推定トークン数: ~{Math.ceil((result.techStackCompatibility?.length || 0) / 4)}
            </div>
          </div>
        )}

        {/* shareTag */}
        <div className="bg-orange-500/10 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            shareTag（共有タグ）
          </h3>
          <p className="text-white/70 text-sm">{result.shareTag || '#CND2診断'}</p>
          <div className="mt-2 text-xs text-orange-300">
            💡 常に固定値 (#CND2診断) なので不要
          </div>
        </div>

        {/* metadata.calculatedScore */}
        {calculatedScore && Object.keys(calculatedScore).length > 0 && (
          <div className="bg-orange-500/10 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              metadata.calculatedScore（詳細スコア）
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-white/70">
                <span className="text-orange-300">technical:</span> {calculatedScore.technical || 'N/A'}
              </div>
              <div className="text-white/70">
                <span className="text-orange-300">communication:</span> {calculatedScore.communication || 'N/A'}
              </div>
              <div className="text-white/70">
                <span className="text-orange-300">values:</span> {calculatedScore.values || 'N/A'}
              </div>
              <div className="text-white/70">
                <span className="text-orange-300">growth:</span> {calculatedScore.growth || 'N/A'}
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-300">
              💡 内部計算用、UI表示には総合スコアのみで十分
            </div>
          </div>
        )}

        {/* extracted_profiles（LLMレスポンス内）*/}
        <div className="bg-orange-500/10 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            extracted_profiles（抽出されたプロフィール）
          </h3>
          <p className="text-white/70 text-sm">
            LLMが解析したプロフィール情報（person1, person2）が含まれていますが、
            元のプロフィールデータ (participants) を既に持っているため不要です。
          </p>
          <div className="mt-2 text-xs text-orange-300">
            💡 推定トークン数: ~200-300（重複データ）
          </div>
        </div>

        {/* その他のメタデータ */}
        {metadata.participant1 && (
          <div className="bg-orange-500/10 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" />
              その他のメタデータ
            </h3>
            <ul className="space-y-1 text-white/70 text-sm">
              <li>• participant1: {metadata.participant1}</li>
              <li>• participant2: {metadata.participant2}</li>
            </ul>
            <div className="mt-2 text-xs text-orange-300">
              💡 participants配列から取得可能なので不要
            </div>
          </div>
        )}
      </section>

      {/* トークン削減の推定 */}
      <section className="glass-effect rounded-xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          💰 トークン削減の推定効果
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-white/80">
            <span>astrologicalAnalysis削除:</span>
            <span className="font-mono text-green-400">-100~150 tokens</span>
          </div>
          <div className="flex justify-between text-white/80">
            <span>techStackCompatibility削除:</span>
            <span className="font-mono text-green-400">-100~150 tokens</span>
          </div>
          <div className="flex justify-between text-white/80">
            <span>extracted_profiles削除:</span>
            <span className="font-mono text-green-400">-200~300 tokens</span>
          </div>
          <div className="flex justify-between text-white/80">
            <span>calculatedScore削除:</span>
            <span className="font-mono text-green-400">-50 tokens</span>
          </div>
          <div className="flex justify-between text-white/80">
            <span>shareTag削除:</span>
            <span className="font-mono text-green-400">-10 tokens</span>
          </div>
          <div className="border-t border-white/20 pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">合計削減量:</span>
              <span className="text-green-400">約460~660 tokens/診断</span>
            </div>
            <div className="text-sm text-purple-300 mt-2">
              💡 1診断あたり約30-40%のトークン削減が可能
            </div>
          </div>
        </div>
      </section>

      {/* 実際のJSONデータ（参考用） */}
      <details className="glass-effect rounded-xl p-6">
        <summary className="cursor-pointer text-lg font-semibold text-cyan-400 mb-2">
          📋 生のJSONデータを表示（クリックで展開）
        </summary>
        <pre className="mt-4 text-xs text-white/60 overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </motion.div>
  );
}