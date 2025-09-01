'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';
import PrairieCardInput from '@/components/prairie/PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { RETRY_CONFIG, calculateBackoffDelay } from '@/lib/constants/retry';
import { MULTI_STYLE_RETRY_CONFIG, ANIMATION_DURATIONS, DIAGNOSIS_STYLES } from '@/lib/constants/diagnosis';
import type { PrairieProfile } from '@/types';
import type { DiagnosisStyle } from '@/lib/diagnosis-engine-unified';

export default function DuoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'first' | 'second' | 'ready'>('first');
  const [profiles, setProfiles] = useState<[PrairieProfile | null, PrairieProfile | null]>([null, null]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 常に全スタイルで診断を実行
  const allStyles = [...DIAGNOSIS_STYLES] as DiagnosisStyle[];
  const { loading: parsingLoading, error: parseError } = usePrairieCard();
  const { generateDiagnosis, loading: diagnosisLoading, error: diagnosisError } = useDiagnosis();

  // 1人目のプロフィール読み込み完了時に自動で2人目へ
  useEffect(() => {
    if (profiles[0] && currentStep === 'first' && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep('second');
        setIsTransitioning(false);
      }, ANIMATION_DURATIONS.TRANSITION_MS);
    }
  }, [profiles[0], currentStep, isTransitioning]);

  // 2人目のプロフィール読み込み完了時に診断準備完了へ
  useEffect(() => {
    if (profiles[1] && currentStep === 'second' && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep('ready');
        setIsTransitioning(false);
      }, ANIMATION_DURATIONS.TRANSITION_MS);
    }
  }, [profiles[1], currentStep, isTransitioning]);

  const handleProfileParsed = (profile: PrairieProfile, index: 0 | 1) => {
    const newProfiles = [...profiles] as [PrairieProfile | null, PrairieProfile | null];
    newProfiles[index] = profile;
    setProfiles(newProfiles);
  };

  const handleStartDiagnosis = async () => {
    if (profiles[0] && profiles[1]) {
      // 常に全4スタイルで診断を実行 with retry mechanism
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= MULTI_STYLE_RETRY_CONFIG.MAX_ATTEMPTS; attempt++) {
          try {
            const response = await fetch('/api/diagnosis-multi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                profiles: [profiles[0], profiles[1]],
                mode: 'duo',
                styles: allStyles
              })
            });

            if (!response.ok) {
              throw new Error(`Failed to generate multi-style diagnosis: ${response.status}`);
            }

            const responseData = await response.json();
            
            // Cloudflare Functionsのレスポンスラッパーを考慮
            const data = responseData.data || responseData;
            
            // 結果をLocalStorageに保存
            const resultId = `multi-${Date.now()}`;
            localStorage.setItem(`diagnosis-multi-${resultId}`, JSON.stringify(data));
            
            // 複数スタイル結果ページへ遷移
            router.push(`/duo/multi-results?id=${resultId}`);
            return; // Success - exit the function
          } catch (error) {
            lastError = error as Error;
            console.warn(`Multi-style diagnosis attempt ${attempt} failed:`, error);
            
            // Wait before retry with exponential backoff
            if (attempt < MULTI_STYLE_RETRY_CONFIG.MAX_ATTEMPTS) {
              await new Promise(resolve => setTimeout(resolve, MULTI_STYLE_RETRY_CONFIG.getDelay(attempt)));
            }
          }
        }
        
      // All attempts failed
      console.error('Multi-style diagnosis failed after 3 attempts:', lastError);
      // TODO: Toast通知やエラーコンポーネントへの置き換えを検討
      alert('診断の生成に失敗しました。もう一度お試しください。');
    }
  };

  const handleBack = () => {
    if (currentStep === 'second') {
      setCurrentStep('first');
      // 2人目のプロフィールをクリア
      setProfiles([profiles[0], null]);
    } else if (currentStep === 'ready') {
      setCurrentStep('second');
    }
  };

  const handleReset = () => {
    setProfiles([null, null]);
    setCurrentStep('first');
  };

  return (
    <div className="min-h-screen relative overflow-hidden stars-bg flex items-center justify-center">
      {/* 背景エフェクト */}
      <BackgroundEffects />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center text-white hover:text-cyan-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">ホームに戻る</span>
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
            <h1 className="text-5xl md:text-6xl font-black mb-3 gradient-text-orange-soft">
              2人診断
            </h1>
            <p className="text-gray-300 text-lg">
              Prairie Cardから相性を診断します
            </p>
          </div>
        </motion.div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                ${profiles[0] ? 'bg-green-500 scale-110' : currentStep === 'first' ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'}
              `}>
                {profiles[0] ? <Check className="w-5 h-5 text-white" /> : <span className="text-white font-bold">1</span>}
              </div>
              <span className={`ml-2 text-sm ${profiles[0] ? 'text-green-400' : 'text-gray-400'}`}>
                {profiles[0] ? profiles[0].basic.name : '1人目'}
              </span>
            </div>

            {/* Connector */}
            <div className={`w-16 h-0.5 transition-all duration-500 ${profiles[0] ? 'bg-green-500' : 'bg-gray-600'}`} />

            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                ${profiles[1] ? 'bg-green-500 scale-110' : currentStep === 'second' ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'}
              `}>
                {profiles[1] ? <Check className="w-5 h-5 text-white" /> : <span className="text-white font-bold">2</span>}
              </div>
              <span className={`ml-2 text-sm ${profiles[1] ? 'text-green-400' : 'text-gray-400'}`}>
                {profiles[1] ? profiles[1].basic.name : '2人目'}
              </span>
            </div>

            {/* Connector */}
            <div className={`w-16 h-0.5 transition-all duration-500 ${profiles[1] ? 'bg-green-500' : 'bg-gray-600'}`} />

            {/* Ready */}
            <div className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                ${currentStep === 'ready' ? 'bg-purple-500 animate-bounce' : 'bg-gray-600'}
              `}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className={`ml-2 text-sm ${currentStep === 'ready' ? 'text-purple-400' : 'text-gray-400'}`}>
                診断
              </span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <AnimatePresence mode="wait">
          {currentStep === 'first' && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  1人目のPrairie Card
                </h2>
                
                <PrairieCardInput 
                  onProfileLoaded={(profile) => handleProfileParsed(profile, 0)}
                  placeholder="Prairie CardのURLを入力またはQRコードをスキャン"
                />
                
                {profiles[0] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/30"
                  >
                    <div className="flex items-center text-green-400">
                      <Check className="w-5 h-5 mr-2" />
                      <span className="font-semibold">{profiles[0].basic.name}さんのプロフィールを読み込みました！</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">自動的に次のステップへ進みます...</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 'second' && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <span className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                    2人目のPrairie Card
                  </h2>
                  <button
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    1人目に戻る
                  </button>
                </div>
                
                <PrairieCardInput 
                  onProfileLoaded={(profile) => handleProfileParsed(profile, 1)}
                  placeholder="Prairie CardのURLを入力またはQRコードをスキャン"
                />
                
                {profiles[1] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/30"
                  >
                    <div className="flex items-center text-green-400">
                      <Check className="w-5 h-5 mr-2" />
                      <span className="font-semibold">{profiles[1].basic.name}さんのプロフィールを読み込みました！</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">診断の準備をしています...</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30">
                <div className="text-center">
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="inline-block mb-6"
                  >
                    <Sparkles className="w-20 h-20 text-purple-400" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">
                    診断準備完了！
                  </h2>
                  
                  <div className="flex justify-center items-center space-x-4 mb-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-xl">1</span>
                      </div>
                      <p className="text-gray-300 text-sm">{profiles[0]?.basic.name}</p>
                    </div>
                    
                    <div className="text-gray-400 text-2xl">×</div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-xl">2</span>
                      </div>
                      <p className="text-gray-300 text-sm">{profiles[1]?.basic.name}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-6">
                    2人の相性を4つのスタイルで診断します
                  </p>
                  
                  {/* 診断スタイル一覧 */}
                  <div className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                        <span className="text-2xl mb-1 block">🎨</span>
                        <span className="text-xs text-purple-400">クリエイティブ</span>
                      </div>
                      <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
                        <span className="text-2xl mb-1 block">⭐</span>
                        <span className="text-xs text-blue-400">占星術</span>
                      </div>
                      <div className="bg-pink-600/20 rounded-lg p-3 border border-pink-500/30">
                        <span className="text-2xl mb-1 block">🔮</span>
                        <span className="text-xs text-pink-400">点取り占い</span>
                      </div>
                      <div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                        <span className="text-2xl mb-1 block">📊</span>
                        <span className="text-xs text-green-400">技術分析</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                    >
                      やり直す
                    </button>
                    <button
                      onClick={handleStartDiagnosis}
                      disabled={diagnosisLoading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {diagnosisLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          4つのスタイルで診断中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          4つのスタイルで診断開始
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* エラー表示 */}
        {(parseError || diagnosisError) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/30"
          >
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>エラー: {parseError || diagnosisError}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}