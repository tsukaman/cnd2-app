'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import LoadingAnimation from '@/components/effects/LoadingAnimation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PrairieCardInput from '@/components/prairie/PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import type { PrairieProfile } from '@/types';
import { cnd2Config } from '@/config/cnd2.config';

export default function DuoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profiles, setProfiles] = useState<[PrairieProfile | null, PrairieProfile | null]>([null, null]);
  const { parseProfile, loading: parsingLoading, error: parseError } = usePrairieCard();
  const { generateDuoDiagnosis, loading: diagnosisLoading, error: diagnosisError } = useDiagnosis();

  const handleProfileParsed = (profile: PrairieProfile, index: 0 | 1) => {
    const newProfiles = [...profiles] as [PrairieProfile | null, PrairieProfile | null];
    newProfiles[index] = profile;
    setProfiles(newProfiles);
  };

  const handleNextStep = () => {
    if (step === 1 && profiles[0]) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleStartDiagnosis = async () => {
    if (profiles[0] && profiles[1]) {
      const result = await generateDuoDiagnosis([profiles[0], profiles[1]]);
      if (result) {
        router.push(`/result/${result.id}`);
      }
    }
  };

  const isLoading = parsingLoading || diagnosisLoading;
  const error = parseError || diagnosisError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>���k;�</span>
            </motion.div>
          </Link>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            2�n�':�
          </h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            Prairie CardK��'�:�W~Y
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex-1 h-2 bg-gray-200 rounded-full overflow-hidden`}>
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              1��n���
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              2��n���
            </span>
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-2xl">=d</span>
                  1��nPrairie Card
                </h2>
                
                <PrairieCardInput
                  onProfileParsed={(profile) => handleProfileParsed(profile, 0)}
                  disabled={isLoading}
                />
                
                {profiles[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <p className="text-green-800 font-semibold">
                       {profiles[0].name}U�n��ɒ��~W_
                    </p>
                  </motion.div>
                )}
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <p className="text-red-600">{error}</p>
                  </motion.div>
                )}
                
                <div className="mt-8 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextStep}
                    disabled={!profiles[0] || isLoading}
                    className={`px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${
                      profiles[0] && !isLoading
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    !x
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-2xl">=e</span>
                  2��nPrairie Card
                </h2>
                
                <PrairieCardInput
                  onProfileParsed={(profile) => handleProfileParsed(profile, 1)}
                  disabled={isLoading}
                />
                
                {profiles[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <p className="text-green-800 font-semibold">
                       {profiles[1].name}U�n��ɒ��~W_
                    </p>
                  </motion.div>
                )}
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <p className="text-red-600">{error}</p>
                  </motion.div>
                )}
                
                <div className="mt-8 flex justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-full font-semibold flex items-center gap-2 border-2 border-gray-300 hover:border-gray-400 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    ;�
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartDiagnosis}
                    disabled={!profiles[1] || isLoading}
                    className={`px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all ${
                      profiles[1] && !isLoading
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {diagnosisLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        :�-...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        :���
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Summary Card (Always Visible) */}
        {(profiles[0] || profiles[1]) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">:��a</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${profiles[0] ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-1">1��</p>
                  <p className="font-semibold">
                    {profiles[0] ? profiles[0].name : '*-�'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${profiles[1] ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-1">2��</p>
                  <p className="font-semibold">
                    {profiles[1] ? profiles[1].name : '*-�'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}