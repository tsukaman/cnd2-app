import { z } from 'zod';

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Client-side environment variables (accessible in browser)
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://cnd2.cloudnativedays.jp'),
  NEXT_PUBLIC_APP_NAME: z.string().default('CND² 相性診断'),
  NEXT_PUBLIC_CND2_API: z.string().default('/api'),
  NEXT_PUBLIC_PRAIRIE_CARD_API: z.string().default('/api/prairie'),
  
  // Server-side environment variables (only accessible on server)
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().default('your-openai-api-key-here'),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  
  // API configuration
  API_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  API_RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60), // seconds
  API_TIMEOUT: z.coerce.number().int().positive().default(30000), // milliseconds
  CORS_ORIGINS: z.string().default('*'),
  PRAIRIE_CARD_BASE_URL: z.string().default('https://prairie-card.cloudnativedays.jp'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (_error) {
    // In test environment, use defaults
    if (process.env.NODE_ENV === 'test') {
      return envSchema.parse({});
    }
    
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      console.error(error.flatten().fieldErrors);
    }
    throw new Error('Failed to parse environment variables');
  }
};

// Export validated environment variables
export const env = parseEnv();

// Type for the environment variables
export type Env = z.infer<typeof envSchema>;

// Cached CORS origins
let cachedCorsOrigins: string[] | null = null;

/**
 * Get API configuration
 */
export function getApiConfig() {
  // Parse CORS origins with caching
  if (cachedCorsOrigins === null) {
    cachedCorsOrigins = env.CORS_ORIGINS === '*' 
      ? ['*'] 
      : env.CORS_ORIGINS.split(',').map(origin => origin.trim());
  }

  return {
    rateLimit: env.API_RATE_LIMIT,
    rateLimitWindow: env.API_RATE_LIMIT_WINDOW,
    timeout: env.API_TIMEOUT,
    corsOrigins: cachedCorsOrigins,
  };
}

/**
 * Get server-only configuration (throws error if called on client)
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