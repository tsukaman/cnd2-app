import { env, getPublicEnv, getApiConfig, getFeatureFlags } from '@/lib/env';

const publicEnv = getPublicEnv();
const apiConfig = getApiConfig();
const features = getFeatureFlags();

export const CND2_CONFIG = {
  app: {
    name: 'CND²',
    displayName: 'CND Squared',
    version: '4.0.0',
    tagline: 'CND × CnD = Your Connection²',
    hashtag: '#CNDxCnD',
    hashtagRaw: 'CNDxCnD',
    poweredBy: 'Prairie Card'
  },
  
  domains: {
    development: 'http://localhost:3000',
    staging: 'https://dev.tsukaman.com/cnd2',
    production: publicEnv.APP_URL || 'https://cdn2.cloudnativedays.jp'
  },
  
  api: {
    openai: env.OPENAI_API_KEY,
    prairieCard: process.env.PRAIRIE_CARD_BASE_URL || 'https://prairie-card.cloudnativedays.jp',
    cnd2Endpoint: process.env.NEXT_PUBLIC_CND2_API || '/api',
    timeouts: apiConfig.timeouts,
    rateLimiting: apiConfig.rateLimiting,
    cors: apiConfig.cors,
    security: apiConfig.security
  },
  
  features: {
    enableNFC: true,
    enableQR: true,
    enableGroupDiagnosis: true,
    maxGroupSize: 6,  // 6² = 36の相性
    enableSquaredEffects: true,
    analytics: features.analytics,
    errorReporting: features.errorReporting,
    cache: features.cache
  },
  
  cache: {
    enabled: features.cache,
    ttl: {
      memory: features.cache ? 3600 : 0,      // 1時間
      browser: features.cache ? 7200 : 0,     // 2時間（二乗っぽく）
      kv: features.cache ? 604800 : 0        // 7日間
    }
  },
  
  rateLimit: {
    prairie: {
      requestsPerSecond: 2,
      requestsPerMinute: 3
    },
    api: {
      requestsPerMinute: 60
    }
  },

  colors: {
    primary: {
      cnd: "#326CE5",      // CloudNative Days Blue
      squared: "#9B59B6",  // 二乗パープル
      connect: "#00D4FF"   // コネクションシアン
    },
    gradient: {
      main: "from-blue-600 via-purple-600 to-cyan-500",
      squared: "from-purple-500 to-pink-500",
      accent: "from-green-400 to-blue-500"
    },
    glass: {
      background: "bg-white/10 backdrop-blur-xl",
      border: "border-white/20"
    }
  },
  
  animations: {
    entrance: "scale from 0 to 1 to 1.1 to 1",
    loading: "rotating-squared-loader",
    success: "explosion-squared-effect",
    particles: "floating ² symbols"
  }
};