import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    // Filter out non-critical errors
    beforeSend(event, hint) {
      // Log errors to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry]', hint.originalException || hint.syntheticException);
      }
      
      // Filter out specific errors
      if (event.exception && event.exception.values) {
        const error = event.exception.values[0];
        
        // Ignore specific API errors
        if (error.type === 'ApiError' && error.value) {
          // Don't send rate limit errors
          if (error.value.includes('rate limit')) {
            return null;
          }
        }
      }
      
      return event;
    },
  });
}