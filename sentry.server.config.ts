import * as Sentry from '@sentry/nextjs';
import { filterSentryError, configureSentryScope, getSentrySampleRate } from '@/lib/sentry-filters';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  const sampleRates = getSentrySampleRate();
  
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: sampleRates.tracesSampleRate,
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    // Use common error filtering
    beforeSend: filterSentryError,
    
    // Configure scope with additional context
    initialScope: (scope) => {
      configureSentryScope(scope);
      return scope;
    },
  });
}