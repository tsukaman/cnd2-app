import { NextRequest } from 'next/server';
import { ApiError, ApiErrorCode } from './api-errors';
import { getApiConfig } from './env';

interface RateLimitStore {
  attempts: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP or fall back to a default
  const ip = forwardedFor?.split(',')[0].trim() || 
             realIp || 
             cfConnectingIp || 
             'unknown';
  
  // Combine IP with user agent for better identification
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Check if request should be rate limited
 */
export async function checkRateLimit(request: NextRequest): Promise<void> {
  const config = getApiConfig();
  const clientId = getClientId(request);
  const now = Date.now();
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupExpiredEntries();
  }
  
  const existing = rateLimitStore.get(clientId);
  
  if (!existing || existing.resetTime < now) {
    // Create new rate limit window
    rateLimitStore.set(clientId, {
      attempts: 1,
      resetTime: now + (config.rateLimitWindow * 1000),
    });
    return;
  }
  
  // Check if limit exceeded
  if (existing.attempts >= config.rateLimit) {
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    throw new ApiError(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      ApiErrorCode.RATE_LIMIT_ERROR,
      429,
      { retryAfter }
    );
  }
  
  // Increment attempts
  existing.attempts++;
  rateLimitStore.set(clientId, existing);
}

/**
 * Reset rate limit for a client (useful for testing)
 */
export function resetRateLimit(clientId: string): void {
  rateLimitStore.delete(clientId);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(request: NextRequest): {
  remaining: number;
  reset: number;
  limit: number;
} {
  const config = getApiConfig();
  const clientId = getClientId(request);
  const now = Date.now();
  
  const existing = rateLimitStore.get(clientId);
  
  if (!existing || existing.resetTime < now) {
    return {
      remaining: config.rateLimit,
      reset: Math.floor((now + config.rateLimitWindow * 1000) / 1000),
      limit: config.rateLimit,
    };
  }
  
  return {
    remaining: Math.max(0, config.rateLimit - existing.attempts),
    reset: Math.floor(existing.resetTime / 1000),
    limit: config.rateLimit,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  request: NextRequest
): Response {
  const status = getRateLimitStatus(request);
  
  response.headers.set('X-RateLimit-Limit', status.limit.toString());
  response.headers.set('X-RateLimit-Remaining', status.remaining.toString());
  response.headers.set('X-RateLimit-Reset', status.reset.toString());
  
  return response;
}