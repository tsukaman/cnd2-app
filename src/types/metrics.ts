/**
 * Metrics Types
 * Common type definitions for application metrics
 */

export interface Metrics {
  prairie: {
    success: number;
    error: number;
    successRate: number;
  };
  diagnosis: {
    success: number;
    error: number;
    successRate: number;
  };
  cache: {
    hit: number;
    miss: number;
    hitRate: number;
  };
  timestamp: string;
}

export interface MetricsApiResponse {
  success: boolean;
  data?: Metrics;
  error?: string;
}

export interface MetricCategory {
  success: number;
  error: number;
  successRate: number;
}

export interface CacheMetric {
  hit: number;
  miss: number;
  hitRate: number;
}