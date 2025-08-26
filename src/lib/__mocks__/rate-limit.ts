export const checkRateLimit = jest.fn().mockResolvedValue(undefined);
export const addRateLimitHeaders = jest.fn((response) => response);
export const resetRateLimit = jest.fn();
export const clearAllRateLimits = jest.fn();
export const getRateLimitStatus = jest.fn().mockReturnValue({
  remaining: 100,
  reset: Date.now() + 60000,
  limit: 100,
});