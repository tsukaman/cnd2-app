'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Metrics } from '@/types/metrics';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In development, use relative path for Next.js API Routes
      // In production, fetch from Cloudflare Functions
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? '' // Use relative path for Next.js API Routes
        : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cnd2-app.pages.dev');
      const endpoint = apiUrl ? `${apiUrl}/api/admin/metrics` : '/api/admin/metrics';
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      
      // Handle both direct response and wrapped response
      const metricsData = data.data || data;
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading && !metrics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">エラーが発生しました</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <Button onClick={fetchMetrics} className="mt-4" variant="outline">
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">メトリクスダッシュボード</h1>
        <div className="flex items-center gap-4">
          {metrics && (
            <span className="text-sm text-gray-500">
              更新: {new Date(metrics.timestamp).toLocaleString('ja-JP')}
            </span>
          )}
          <Button
            onClick={fetchMetrics}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Warning message if partial data */}
          {(metrics as any).warning && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ {(metrics as any).warning}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prairie API Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Prairie API</span>
                <Activity className="w-5 h-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">成功率</span>
                    <span className="font-semibold">
                      {formatPercentage(metrics.prairie.successRate)}
                    </span>
                  </div>
                  <Progress value={metrics.prairie.successRate * 100} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">成功</p>
                    <p className="text-lg font-semibold flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      {formatNumber(metrics.prairie.success)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">エラー</p>
                    <p className="text-lg font-semibold flex items-center">
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      {formatNumber(metrics.prairie.error)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis API Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Diagnosis API</span>
                <Activity className="w-5 h-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">成功率</span>
                    <span className="font-semibold">
                      {formatPercentage(metrics.diagnosis.successRate)}
                    </span>
                  </div>
                  <Progress value={metrics.diagnosis.successRate * 100} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">成功</p>
                    <p className="text-lg font-semibold flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      {formatNumber(metrics.diagnosis.success)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">エラー</p>
                    <p className="text-lg font-semibold flex items-center">
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      {formatNumber(metrics.diagnosis.error)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>キャッシュ</span>
                <Activity className="w-5 h-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">ヒット率</span>
                    <span className="font-semibold">
                      {formatPercentage(metrics.cache.hitRate)}
                    </span>
                  </div>
                  <Progress value={metrics.cache.hitRate * 100} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">ヒット</p>
                    <p className="text-lg font-semibold flex items-center">
                      <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                      {formatNumber(metrics.cache.hit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ミス</p>
                    <p className="text-lg font-semibold flex items-center">
                      <TrendingDown className="w-4 h-4 text-orange-500 mr-1" />
                      {formatNumber(metrics.cache.miss)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">メトリクスについて</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Prairie API: Prairie Card取得の成功率を表示</li>
          <li>• Diagnosis API: AI診断実行の成功率を表示</li>
          <li>• キャッシュ: KV Namespaceのキャッシュヒット率を表示</li>
          <li>• データは30秒ごとに自動更新されます</li>
        </ul>
      </div>
    </div>
  );
}