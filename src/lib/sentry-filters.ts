import * as Sentry from '@sentry/nextjs';

/**
 * Common error filtering logic for Sentry
 * Filters out non-critical errors and noise
 */
export function filterSentryError(
  event: Sentry.Event,
  hint: Sentry.EventHint
): Sentry.Event | null {
  // Get the original exception
  const error = hint.originalException || hint.syntheticException;
  const errorMessage = error?.toString() || '';

  // Filter out network errors from external services
  if (event.exception && event.exception.values) {
    const exception = event.exception.values[0];
    
    // Filter Prairie Card network errors
    if (
      (exception.type === 'NetworkError' || exception.type === 'FetchError') &&
      exception.value?.includes('my.prairie.cards')
    ) {
      return null;
    }

    // Filter browser extension errors
    if (exception.value?.includes('extension://')) {
      return null;
    }

    // Filter chunk load errors (usually from ad blockers or network issues)
    if (
      exception.type === 'ChunkLoadError' ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('Failed to fetch')
    ) {
      return null;
    }

    // Filter ENOTFOUND DNS errors
    if (errorMessage.includes('ENOTFOUND')) {
      return null;
    }

    // Filter rate limit errors (these are expected)
    if (exception.value?.includes('rate limit')) {
      return null;
    }

    // Filter AbortController errors (user navigation)
    if (
      exception.type === 'AbortError' ||
      errorMessage.includes('AbortError') ||
      errorMessage.includes('The user aborted a request')
    ) {
      return null;
    }

    // Filter ResizeObserver errors (browser quirk, not actual error)
    if (errorMessage.includes('ResizeObserver loop limit exceeded')) {
      return null;
    }

    // Filter non-Error objects (often from third-party scripts)
    if (exception.value === 'Non-Error exception captured') {
      return null;
    }
  }

  // Log errors to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry Filtered]', error);
  }

  return event;
}

/**
 * Configure Sentry scope with additional context
 */
export function configureSentryScope(scope: Sentry.Scope): void {
  // Add custom tags
  scope.setTag('app', 'cnd2');
  scope.setTag('version', process.env.NEXT_PUBLIC_VERSION || 'unknown');
  
  // Add user context if available (from localStorage or session)
  if (typeof window !== 'undefined') {
    const sessionId = window.sessionStorage?.getItem('cnd2_session_id');
    if (sessionId) {
      scope.setUser({ id: sessionId });
    }
  }
  
  // Add custom context
  scope.setContext('app', {
    name: 'CND² App',
    environment: process.env.NODE_ENV,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
  });
}

/**
 * Sentry sampling configuration based on environment and error type
 */
export function getSentrySampleRate(): {
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
} {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Performance monitoring sample rate
    tracesSampleRate: isDevelopment ? 1.0 : isProduction ? 0.1 : 0.5,
    
    // Session replay sample rates
    replaysSessionSampleRate: isProduction ? 0.1 : 0,
    replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
  };
}