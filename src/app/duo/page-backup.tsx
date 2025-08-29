'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PrairieCardInput from '@/components/prairie/PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { useDiagnosisV3 } from '@/hooks/useDiagnosisV3';
import type { PrairieProfile } from '@/types';

// 環境変数でエンジンバージョンを切り替え（デフォルトはv2を使用）
const USE_V3_ENGINE = process.env.NEXT_PUBLIC_USE_DIAGNOSIS_V3 === 'true';

export default function DuoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profiles, setProfiles] = useState<[PrairieProfile | null, PrairieProfile | null]>([null, null]);
  const [prairieUrls, setPrairieUrls] = useState<[string, string]>(['', '']);
  const { loading: parsingLoading, error: parseError } = usePrairieCard();
  const { generateDiagnosis, loading: diagnosisLoading, error: diagnosisError } = useDiagnosis();
  const { diagnose: diagnoseV3, isLoading: v3Loading, error: v3Error, result: v3Result } = useDiagnosisV3();

  // V3エンジン使用時の設定
  const isLoading = USE_V3_ENGINE ? (parsingLoading || v3Loading) : (parsingLoading || diagnosisLoading);
  const error = USE_V3_ENGINE ? (parseError || v3Error) : (parseError || diagnosisError);

  // V3の結果が返ってきたら遷移
  useEffect(() => {
    if (USE_V3_ENGINE && v3Result) {
      // Store result in localStorage
      localStorage.setItem(`diagnosis-${v3Result.id}`, JSON.stringify(v3Result));
      // Navigate to home with result in state
      router.push(`/?result=${v3Result.id}&mode=duo`);
    }
  }, [v3Result, router]);

  const handleProfileParsed = (profile: PrairieProfile, index: 0 | 1) => {
    const newProfiles = [...profiles] as [PrairieProfile | null, PrairieProfile | null];
    newProfiles[index] = profile;
    setProfiles(newProfiles);
    
    // V3エンジンの場合、URLも抽出して保存
    if (USE_V3_ENGINE && profile.meta?.sourceUrl) {
      const newUrls = [...prairieUrls] as [string, string];
      newUrls[index] = profile.meta.sourceUrl;
      setPrairieUrls(newUrls);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      // V3エンジンの場合はURL、従来エンジンの場合はprofileをチェック
      const canProceed = USE_V3_ENGINE ? prairieUrls[0] : profiles[0];
      if (canProceed) {
        setStep(2);
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleStartDiagnosis = async () => {
    if (USE_V3_ENGINE) {
      // V3エンジン: URLを直接渡す
      if (prairieUrls[0] && prairieUrls[1]) {
        await diagnoseV3(prairieUrls);
      }
    } else {
      // 従来エンジン: パース済みのprofileを渡す
      if (profiles[0] && profiles[1]) {
        const result = await generateDiagnosis([profiles[0], profiles[1]], 'duo');
        if (result) {
          localStorage.setItem(`diagnosis-${result.id}`, JSON.stringify(result));
          router.push(`/?result=${result.id}&mode=duo`);
        }
      }
    }
  };

  // 診断開始可能かどうかの判定
  const canStartDiagnosis = USE_V3_ENGINE 
    ? (prairieUrls[0] && prairieUrls[1])  // V3: URLがあればOK
    : (profiles[0] && profiles[1]);        // 従来: profileが必要

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto">
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
              2人診断モード
            </h1>
            <p className="text-gray-400">
              2つのPrairie Cardから相性を診断します
            </p>
            {USE_V3_ENGINE && (
              <p className="text-xs text-cyan-400 mt-2">
                🚀 新エンジンv3使用中（AI直接解析）
              </p>
            )}
          </div>
        </motion.div>

        {/* ステップインジケータ */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-cyan-500' : 'bg-gray-700'
            }`}>
              <span className="text-white font-bold">1</span>
            </div>
            <div className={`w-20 h-0.5 ${step >= 2 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2 ? 'bg-cyan-500' : 'bg-gray-700'
            }`}>
              <span className="text-white font-bold">2</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-effect rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  1人目のPrairie Card
                </h2>
                <PrairieCardInput 
                  onProfileLoaded={(profile) => handleProfileParsed(profile, 0)}
                  // @ts-ignore - 互換性のため一時的に無視
                />
                {profiles[0] && !USE_V3_ENGINE && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400">
                      ✓ {profiles[0].basic.name}さんのプロフィールを読み込みました
                    </p>
                  </div>
                )}
                {USE_V3_ENGINE && prairieUrls[0] && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400">
                      ✓ Prairie Card URLを設定しました
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={USE_V3_ENGINE ? !prairieUrls[0] : !profiles[0]}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>次へ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-effect rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  2人目のPrairie Card
                </h2>
                <PrairieCardInput 
                  onProfileLoaded={(profile) => handleProfileParsed(profile, 1)}
                  // @ts-ignore - 互換性のため一時的に無視
                />
                {profiles[1] && !USE_V3_ENGINE && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400">
                      ✓ {profiles[1].basic.name}さんのプロフィールを読み込みました
                    </p>
                  </div>
                )}
                {USE_V3_ENGINE && prairieUrls[1] && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400">
                      ✓ Prairie Card URLを設定しました
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>戻る</span>
                </button>

                <button
                  onClick={handleStartDiagnosis}
                  disabled={!canStartDiagnosis || isLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>診断中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>診断開始</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* エラー表示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20"
          >
            <p className="text-red-400">エラー: {error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}