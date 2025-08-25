import { getPublicEnv, getApiConfig, getFeatureFlags } from './env';

const publicEnv = getPublicEnv();
const apiConfig = getApiConfig();
const features = getFeatureFlags();

/**
 * アプリケーション設定
 */
export const CND2_CONFIG = {
  // アプリ基本情報
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'CND²',
    url: publicEnv.APP_URL,
    hashtag: process.env.NEXT_PUBLIC_HASHTAG || '#CNDxCnD',
  },
  
  // Prairie Card API設定
  prairie: {
    baseUrl: process.env.PRAIRIE_CARD_BASE_URL || 'https://prairie-card.cloudnativedays.jp',
    cacheTime: features.cache ? 5 * 60 * 1000 : 0, // 5分（キャッシュ有効時）
    maxCacheSize: 100,
    timeout: apiConfig.timeouts.prairie,
  },
  
  // 診断設定
  diagnosis: {
    timeout: apiConfig.timeouts.diagnosis,
    resultExpiryDays: 7,
    modes: {
      duo: {
        minParticipants: 2,
        maxParticipants: 2,
      },
      group: {
        minParticipants: 3,
        maxParticipants: 6,
      },
    },
  },
  
  // API設定
  api: {
    rateLimiting: apiConfig.rateLimiting,
    cors: apiConfig.cors,
    security: apiConfig.security,
  },
  
  // 機能フラグ
  features: {
    analytics: features.analytics,
    errorReporting: features.errorReporting,
    cache: features.cache,
  },
  
  // アニメーション設定
  animation: {
    duration: {
      fast: 200,
      normal: 400,
      slow: 600,
    },
    easing: {
      default: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // ソーシャルシェア
  social: {
    twitter: {
      shareUrl: 'https://twitter.com/intent/tweet',
      maxLength: 280,
    },
    bluesky: {
      shareUrl: 'https://bsky.app/intent/compose',
      maxLength: 300,
    },
    facebook: {
      shareUrl: 'https://www.facebook.com/sharer/sharer.php',
    },
    linkedin: {
      shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
    },
  },
  
  // エラーハンドリング
  errorHandling: {
    retryCount: 3,
    retryDelay: 1000,
    showDetailInDev: true,
  },
  
  // ロギング
  logging: {
    enabled: process.env.NODE_ENV !== 'test',
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  },
};