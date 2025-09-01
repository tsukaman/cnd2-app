'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowLeft, Loader2, X, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PrairieCardInput from '@/components/prairie/PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { RETRY_CONFIG, calculateBackoffDelay } from '@/lib/constants/retry';
import { isProduction } from '@/lib/utils/environment';
import { logger } from '@/lib/logger';
import type { PrairieProfile } from '@/types';

export default function GroupPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<(PrairieProfile | null)[]>([null, null, null]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { loading: parsingLoading, error: parseError } = usePrairieCard();
  const { generateDiagnosis, loading: diagnosisLoading, error: diagnosisError } = useDiagnosis();

  const handleProfileParsed = (profile: PrairieProfile, index: number) => {
    const newProfiles = [...profiles];
    newProfiles[index] = profile;
    setProfiles(newProfiles);
    
    // Auto advance to next empty slot
    const nextEmpty = newProfiles.findIndex((p, i) => i > index && p === null);
    if (nextEmpty !== -1) {
      setCurrentIndex(nextEmpty);
    }
  };

  const handleAddSlot = () => {
    if (profiles.length < 6) {
      setProfiles([...profiles, null]);
      setCurrentIndex(profiles.length);
    }
  };

  const handleRemoveSlot = (index: number) => {
    if (profiles.length > 3) {
      const newProfiles = profiles.filter((_, i) => i !== index);
      setProfiles(newProfiles);
      if (currentIndex >= newProfiles.length) {
        setCurrentIndex(newProfiles.length - 1);
      }
    }
  };

  const handleStartDiagnosis = async () => {
    const validProfiles = profiles.filter((p): p is PrairieProfile => p !== null);
    if (validProfiles.length >= 3) {
      const result = await generateDiagnosis(validProfiles, 'group');
      if (result) {
        // LocalStorageに保存
        localStorage.setItem(`diagnosis-result-${result.id}`, JSON.stringify(result));
        
        // KVにも保存（非同期、リトライ付き）
        const saveToKV = async () => {
          for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
            try {
              const response = await fetch(`/api/results/${result.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
              });
              if (response.ok) {
                logger.info('[Group] Successfully saved to KV');
                return;
              }
              logger.warn(`[Group] KV save attempt ${i + 1} failed:`, response.status);
            } catch (err) {
              logger.warn(`[Group] KV save attempt ${i + 1} error:`, err);
            }
            // Wait before retry (exponential backoff)
            if (i < RETRY_CONFIG.maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, calculateBackoffDelay(i)));
            }
          }
          logger.error('[Group] Failed to save to KV after all retries');
        };
        saveToKV();
        
        // Navigate to home with result in state
        router.push(`/?result=${result.id}&mode=group`);
      }
    }
  };

  const isLoading = parsingLoading || diagnosisLoading;
  const error = parseError || diagnosisError;
  const validProfilesCount = profiles.filter(p => p !== null).length;
  const canStartDiagnosis = validProfilesCount >= 3 && !isLoading;

  return (
    <div className="min-h-screen stars-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>ホームに戻る</span>
            </motion.div>
          </Link>
          
          <h1 className="text-4xl font-bold gradient-text mb-2">
            グループ相性診断
          </h1>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            3〜6人のPrairie Cardから相性を診断します
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Input */}
            <div>
              <div className="card-dark p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    メンバー {currentIndex + 1} / {profiles.length}
                  </h2>
                  {profiles.length < 6 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddSlot}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-full font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      メンバー追加
                    </motion.button>
                  )}
                </div>
                
                {/* Member Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {profiles.map((profile, index) => (
                    <motion.div
                      key={index}
                      className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 relative ${
                        currentIndex === index
                          ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white'
                          : profile
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                      }`}
                    >
                      <button
                        onClick={() => setCurrentIndex(index)}
                        className="flex items-center gap-2"
                      >
                        <span>{index + 1}</span>
                        {profile && <span className="text-xs">✓</span>}
                      </button>
                      {profiles.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSlot(index);
                          }}
                          className="ml-1 hover:text-red-500 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Prairie Card Input */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <PrairieCardInput
                      onProfileLoaded={(profile) => handleProfileParsed(profile, currentIndex)}
                    />
                    
                    {profiles[currentIndex] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <p className="text-green-800 font-semibold">
                          ✅ {profiles[currentIndex]?.basic.name}さんのカードを読み込みました
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <p className="text-red-600">{error}</p>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Right Column - Summary */}
            <div>
              <div className="card-dark p-6">
                <h3 className="text-xl font-bold mb-6">診断メンバー</h3>
                
                <div className="space-y-3 mb-6">
                  {profiles.map((profile, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        profile
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          profile
                            ? 'bg-gradient-to-r from-purple-600 to-orange-500'
                            : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {profile ? profile.basic.name : '未設定'}
                          </p>
                          {profile && (
                            <p className="text-sm text-gray-600">
                              {profile.basic.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>進捗</span>
                    <span>{validProfilesCount} / {profiles.length} 人</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-600 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(validProfilesCount / profiles.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                
                {/* Start Diagnosis Button */}
                <motion.button
                  whileHover={{ scale: canStartDiagnosis ? 1.05 : 1 }}
                  whileTap={{ scale: canStartDiagnosis ? 0.95 : 1 }}
                  onClick={handleStartDiagnosis}
                  disabled={!canStartDiagnosis}
                  className={`w-full px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${
                    canStartDiagnosis
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {diagnosisLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      診断中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      グループ診断を開始
                    </>
                  )}
                </motion.button>
                
                {validProfilesCount < 3 && (
                  <p className="text-sm text-gray-500 text-center mt-3">
                    最低3人のプロフィールが必要です
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}