/**
 * Global type declarations for external libraries and window objects
 */

// Sentry error tracking
interface SentryInterface {
  captureException: (error: Error, context?: {
    contexts?: {
      react?: {
        componentStack?: string;
      };
    };
  }) => void;
}

// Global window interface extensions
declare global {
  interface Window {
    Sentry?: SentryInterface;
  }
}

// Make this file a module to avoid global scope pollution
export {};