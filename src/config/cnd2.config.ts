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
    production: 'https://cdn2.cloudnativedays.jp'
  },
  
  api: {
    openai: process.env.OPENAI_API_KEY,
    prairieCard: process.env.NEXT_PUBLIC_PRAIRIE_URL || 'https://my.prairie.cards',
    cnd2Endpoint: process.env.NEXT_PUBLIC_CND2_API || '/api'
  },
  
  features: {
    enableNFC: true,
    enableQR: true,
    enableGroupDiagnosis: true,
    maxGroupSize: 6,  // 6² = 36の相性
    enableSquaredEffects: true
  },
  
  cache: {
    ttl: {
      memory: 3600,      // 1時間
      browser: 7200,     // 2時間（二乗っぽく）
      kv: 604800        // 7日間
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