/**
 * スコアリング関連の定数
 */

// HTMLサイズ制限（15KB - レビューで推奨された値）
export const HTML_SIZE_LIMIT = 15000;

// スコア分布の定義
export const SCORE_DISTRIBUTION = {
  RARE: {
    threshold: 0.05,
    range: [0, 19] as const,
    percentage: 5,
    description: '奇跡のレアケース'
  },
  CHALLENGING: {
    threshold: 0.15,
    range: [20, 39] as const,
    percentage: 10,
    description: 'チャレンジング'
  },
  GROWING: {
    threshold: 0.35,
    range: [40, 59] as const,
    percentage: 20,
    description: '成長の余地あり'
  },
  BALANCED: {
    threshold: 0.65,
    range: [60, 79] as const,
    percentage: 30,
    description: 'バランス良好'
  },
  EXCELLENT: {
    threshold: 0.90,
    range: [80, 94] as const,
    percentage: 25,
    description: '素晴らしい相性'
  },
  PERFECT: {
    threshold: 1.00,
    range: [95, 99] as const,
    percentage: 10,
    description: '完璧な相性'
  }
} as const;

// スコアリング要素の最大値
export const SCORING_ELEMENTS = {
  TECHNICAL: {
    max: 35,
    levels: {
      HIGH: { min: 5, score: [30, 35], label: '奇跡的な技術スタック一致！' },
      MEDIUM_HIGH: { min: 3, score: [20, 30], label: '高度な技術的共鳴' },
      MEDIUM: { min: 1, score: [10, 20], label: '基本的な技術理解の共有' },
      LOW: { min: 0, score: [0, 10], label: '新しい学びの機会！' }
    },
    bonus: {
      complementary: 5
    }
  },
  COMMUNICATION: {
    max: 25,
    levels: {
      ACTIVE: { score: [20, 25], label: '賑やかで楽しい関係！' },
      BALANCED: { score: [15, 20], label: 'バランスの良い対話' },
      QUIET: { score: [5, 15], label: '落ち着いた深い繋がり' }
    },
    bonus: {
      ossActivity: 5
    }
  },
  VALUES: {
    max: 20,
    levels: {
      HIGH: { min: 3, score: [15, 20], label: '運命的な共通点！' },
      MEDIUM: { min: 1, score: [10, 15], label: '楽しい発見がある' },
      LOW: { min: 0, score: [5, 10], label: 'お互いの世界が広がる！' }
    }
  },
  GROWTH: {
    max: 20,
    levels: {
      COMPLEMENTARY: { score: [15, 20], label: '最高の学習パートナー' },
      MENTORING: { score: [10, 15], label: 'メンタリングの機会' },
      PEER: { score: [5, 10], label: '切磋琢磨できる関係' }
    }
  }
} as const;

// タイムアウト値
export const TIMEOUTS = {
  PRAIRIE_FETCH: 5000,
  AI_GENERATION: 30000
} as const;