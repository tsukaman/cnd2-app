export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private windowStartTime: number = Date.now();
  private readonly requestsPerSecond: number;
  private readonly requestsPerMinute: number;

  constructor(requestsPerSecond: number = 2, requestsPerMinute: number = 30) {
    this.requestsPerSecond = requestsPerSecond;
    this.requestsPerMinute = requestsPerMinute;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    
    // 分単位のレート制限チェック
    if (now - this.windowStartTime >= 60000) {
      // 1分経過したらリセット
      this.windowStartTime = now;
      this.requestCount = 0;
    }
    
    // 分単位の制限チェック
    if (this.requestCount >= this.requestsPerMinute) {
      const waitTime = 60000 - (now - this.windowStartTime);
      if (waitTime > 0) {
        console.log(`[CND²] レート制限: ${waitTime}ms待機中...`);
        await this.sleep(waitTime);
        this.windowStartTime = Date.now();
        this.requestCount = 0;
      }
    }
    
    // 秒単位のレート制限
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.requestsPerSecond;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`[CND²] レート調整: ${Math.round(waitTime)}ms待機`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.windowStartTime = Date.now();
  }
}