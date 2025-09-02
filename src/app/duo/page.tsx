'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BackgroundEffects } from '@/components/effects/BackgroundEffects';
import PrairieCardInput from '@/components/prairie/PrairieCardInput';
import { usePrairieCard } from '@/hooks/usePrairieCard';
import { useDiagnosis } from '@/hooks/useDiagnosis';
import { RETRY_CONFIG, calculateBackoffDelay } from '@/lib/constants/retry';
import { ANIMATION_DURATIONS } from '@/lib/constants/diagnosis';
import { isProduction } from '@/lib/utils/environment';
import { logger } from '@/lib/logger';
import type { PrairieProfile } from '@/types';

export default function DuoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'first' | 'second' | 'ready'>('first');
  const [profiles, setProfiles] = useState<[PrairieProfile | null, PrairieProfile | null]>([null, null]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { loading: parsingLoading, error: parseError } = usePrairieCard();
  const { generateDiagnosis, loading: diagnosisLoading, error: diagnosisError } = useDiagnosis();

  // 1人目のプロフィール読み込み完了時に自動で2人目へ
  useEffect(() => {
    // Skip if both profiles are already loaded
    if (currentStep !== 2 || !profiles[0] || !profiles[1]) return;

    handleStartDiagnosis();
  }, [currentStep, profiles, handleStartDiagnosis]);