/**
 * useDiagnosisV3 Hook
 * 新しいシンプルな診断エンジンv3を使用するためのReact Hook
 */

import { useState, useCallback } from 'react';
import { DiagnosisResult } from '@/types';
import { apiClient } from '@/lib/api-client';

export interface UseDiagnosisV3Result {
  diagnose: (urls: [string, string]) => Promise<void>;
  result: DiagnosisResult | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useDiagnosisV3(): UseDiagnosisV3Result {
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnose = useCallback(async (urls: [string, string]) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('[useDiagnosisV3] Starting diagnosis with URLs:', urls);
      
      // 本番環境と開発環境で異なるエンドポイントを使用
      const endpoint = process.env.NODE_ENV === 'production' 
        ? '/api/diagnosis-v3'  // Cloudflare Pages Function
        : '/api/diagnosis-v3'; // Next.js API Route
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '診断に失敗しました');
      }

      const diagnosisResult = await response.json() as DiagnosisResult;
      
      console.log('[useDiagnosisV3] Diagnosis successful:', {
        id: diagnosisResult.id,
        type: diagnosisResult.type,
        score: diagnosisResult.score
      });
      
      setResult(diagnosisResult);
      
      // localStorageに結果を保存（オプション）
      try {
        const existingResults = JSON.parse(
          localStorage.getItem('cnd2_results_v3') || '{}'
        );
        existingResults[diagnosisResult.id] = {
          ...diagnosisResult,
          urls, // URLも保存しておく
        };
        localStorage.setItem('cnd2_results_v3', JSON.stringify(existingResults));
      } catch (storageError) {
        console.warn('[useDiagnosisV3] Failed to save to localStorage:', storageError);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '診断中にエラーが発生しました';
      console.error('[useDiagnosisV3] Diagnosis error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    diagnose,
    result,
    isLoading,
    error,
    reset,
  };
}

export default useDiagnosisV3;