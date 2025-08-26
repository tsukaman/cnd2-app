import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filter out non-errors
    beforeSend(event, hint) {
      // Filter out specific errors
      if (event.exception && event.exception.values) {
        const error = event.exception.values[0];
        
        // Ignore network errors from external services
        if (error.type === 'NetworkError' || error.type === 'FetchError') {
          if (error.value && error.value.includes('my.prairie.cards')) {
            return null; // Don't send Prairie Card network errors
          }
        }
        
        // Ignore specific browser extension errors
        if (error.value && error.value.includes('extension://')) {
          return null;
        }
      }
      
      return event;
    },
  });
}