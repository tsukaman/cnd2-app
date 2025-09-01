/**
 * Constants for diagnosis features
 */

import type { DiagnosisStyle } from '@/lib/diagnosis-engine-unified';

// 診断スタイル定数
export const DIAGNOSIS_STYLES = ['creative', 'astrological', 'fortune', 'technical'] as const satisfies DiagnosisStyle[];

// Processing time estimates
export const PROCESSING_TIME_ESTIMATES = {
  ALL_STYLES: '約2-3秒',
  PARTIAL_STYLES: (count: number) => `${count}つのスタイルで診断します`,
} as const;

// Cleanup intervals
export const CLEANUP_INTERVALS = {
  TTL_HOURS: 24,
  TTL_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Retry configuration for multi-style diagnosis
export const MULTI_STYLE_RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  getDelay: (attempt: number) => MULTI_STYLE_RETRY_CONFIG.BASE_DELAY_MS * attempt,
} as const;

// Style display configuration
export const STYLE_CONFIG = {
  creative: { 
    label: 'クリエイティブ', 
    icon: '🎨', 
    color: 'purple',
    description: '予想外の化学反応'
  },
  astrological: { 
    label: '占星術', 
    icon: '⭐', 
    color: 'blue',
    description: '星が導く運命'
  },
  fortune: { 
    label: '点取り占い', 
    icon: '🔮', 
    color: 'pink',
    description: '運勢を診断'
  },
  technical: { 
    label: '技術分析', 
    icon: '📊', 
    color: 'green',
    description: 'データドリブン'
  }
} as const;

// Color mapping for UI components
export const COLOR_CLASSES = {
  purple: 'bg-purple-600 text-purple-400 border-purple-500',
  blue: 'bg-blue-600 text-blue-400 border-blue-500',
  pink: 'bg-pink-600 text-pink-400 border-pink-500',
  green: 'bg-green-600 text-green-400 border-green-500',
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  TRANSITION_MS: 1500,
  STEP_DELAY_MS: 300,
  BOUNCE_DURATION: 2000,
  ROTATE_DURATION: 4000,
} as const;