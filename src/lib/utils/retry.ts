/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Promise with the result or throws after max attempts
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry
  } = options;

  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      // Notify retry callback if provided
      if (onRetry) {
        onRetry(attempt, error as Error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Check if an error is retryable
 * @param error The error to check
 * @returns true if the error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors
    if (message.includes('timeout')) {
      return true;
    }
    
    // Server errors (5xx)
    if (message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
  }
  
  return false;
}