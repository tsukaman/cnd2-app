/**
 * Development API Route for Metrics
 * This route is only used in development environment to provide metrics endpoint
 * In production, Cloudflare Functions handles this endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Metrics } from '@/types/metrics';

// Mock metrics data for development
const getMockMetrics = (): Metrics => {
  const now = new Date();
  
  // Generate realistic but random metrics
  const prairieSuccess = Math.floor(Math.random() * 900) + 100;
  const prairieError = Math.floor(Math.random() * 50) + 5;
  const diagnosisSuccess = Math.floor(Math.random() * 500) + 50;
  const diagnosisError = Math.floor(Math.random() * 30) + 2;
  const cacheHit = Math.floor(Math.random() * 1000) + 200;
  const cacheMiss = Math.floor(Math.random() * 200) + 20;

  return {
    prairie: {
      success: prairieSuccess,
      error: prairieError,
      successRate: prairieSuccess / (prairieSuccess + prairieError),
    },
    diagnosis: {
      success: diagnosisSuccess,
      error: diagnosisError,
      successRate: diagnosisSuccess / (diagnosisSuccess + diagnosisError),
    },
    cache: {
      hit: cacheHit,
      miss: cacheMiss,
      hitRate: cacheHit / (cacheHit + cacheMiss),
    },
    timestamp: now.toISOString(),
  };
};

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 404 }
    );
  }

  // Simulate authentication check (always pass in dev)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && !authHeader.includes('Bearer')) {
    return NextResponse.json(
      { error: 'Invalid authorization header' },
      { status: 401 }
    );
  }

  // Simulate random failures (5% chance)
  if (Math.random() < 0.05) {
    return NextResponse.json(
      { error: 'Random failure for testing error handling' },
      { status: 500 }
    );
  }

  // Simulate latency (100-500ms)
  await new Promise((resolve) => 
    setTimeout(resolve, Math.floor(Math.random() * 400) + 100)
  );

  const metrics = getMockMetrics();

  // Simulate partial data warning (10% chance)
  if (Math.random() < 0.1) {
    (metrics as any).warning = 'Partial data: Some metrics could not be retrieved (development mode)';
  }

  return NextResponse.json({
    success: true,
    data: metrics,
  });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}