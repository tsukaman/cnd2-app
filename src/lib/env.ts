import { z } from 'zod';

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  // Node環境
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('CND²'),
  NEXT_PUBLIC_HASHTAG: z.string().default('#CNDxCnD'),
  NEXT_PUBLIC_CND2_API: z.string().default('/api'),
  
  // Prairie Card API
  PRAIRIE_CARD_BASE_URL: z.string().default('https://prairie-card.cloudnativedays.jp'),
  
  // OpenAI（将来の実装用）
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  
  // Database（将来の実装用）
  DATABASE_URL: z.string().optional(),
  
  // Redis（将来のキャッシュ用）
  REDIS_URL: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('false'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  
  // Security
  API_SECRET_KEY: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  
  // External Services
  PRAIRIE_API_TIMEOUT: z.coerce.number().int().positive().default(10000),
  DIAGNOSIS_TIMEOUT: z.coerce.number().int().positive().default(15000),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('false'),
  ENABLE_CACHE: z.string().transform(val => val === 'true').default('true'),
  
  // Vercel
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

/**
 * 環境変数の型定義
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 環境変数のバリデーションとパース
 */
function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // 本番環境での必須チェック
    if (env.NODE_ENV === 'production') {
      if (!env.NEXT_PUBLIC_APP_URL && !env.VERCEL_URL) {
        throw new Error('NEXT_PUBLIC_APP_URL or VERCEL_URL is required in production');
      }
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Environment validation error: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * バリデート済みの環境変数
 */
export const env = validateEnv();

/**
 * 公開用の環境変数のみを取得
 */
export function getPublicEnv() {
  return {
    NODE_ENV: env.NODE_ENV,
    APP_URL: env.NEXT_PUBLIC_APP_URL || 
             (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000'),
    GA_MEASUREMENT_ID: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
    ENABLE_CACHE: env.ENABLE_CACHE,
  };
}

// Cache parsed CORS origins
const parsedCorsOrigins = env.CORS_ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['*'];

/**
 * API設定を取得
 */
export function getApiConfig() {
  return {
    rateLimiting: {
      enabled: env.RATE_LIMIT_ENABLED,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    timeouts: {
      prairie: env.PRAIRIE_API_TIMEOUT,
      diagnosis: env.DIAGNOSIS_TIMEOUT,
    },
    cors: {
      allowedOrigins: parsedCorsOrigins,
    },
    security: {
      apiKey: env.API_SECRET_KEY,
    },
  };
}

/**
 * 機能フラグを取得
 */
export function getFeatureFlags() {
  return {
    analytics: env.ENABLE_ANALYTICS,
    errorReporting: env.ENABLE_ERROR_REPORTING,
    cache: env.ENABLE_CACHE,
  };
}

/**
 * Get server-only configuration
 * This should NEVER be imported in client components
 */
export function getServerConfig() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerConfig() cannot be called on the client side');
  }
  
  return {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    api: getApiConfig(),
  };
}

/**
 * 開発環境かどうか
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * テスト環境かどうか
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * 本番環境かどうか
 */
export const isProduction = env.NODE_ENV === 'production';