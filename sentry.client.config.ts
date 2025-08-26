import * as Sentry from '@sentry/nextjs';
import { filterSentryError, configureSentryScope, getSentrySampleRate } from '@/lib/sentry-filters';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  const sampleRates = getSentrySampleRate();
  
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: sampleRates.tracesSampleRate,
    
    // Session Replay
    replaysSessionSampleRate: sampleRates.replaysSessionSampleRate,
    replaysOnErrorSampleRate: sampleRates.replaysOnErrorSampleRate,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Use common error filtering
    beforeSend: filterSentryError,
    
    // Configure scope with additional context
    initialScope: (scope) => {
      configureSentryScope(scope);
      return scope;
    },
  });
}