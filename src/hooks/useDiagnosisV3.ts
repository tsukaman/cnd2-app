/**
 * useDiagnosisV3 Hook
 * 新しいシンプルな診断エンジンv3を使用するためのReact Hook
 */

import { useState, useCallback } from 'react';
import { DiagnosisResult } from '@/types';
import { apiClientV3 } from '@/lib/api-client-v3';

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
      console.log('[useDiagnosisV3] Session ID:', apiClientV3.session.getId());
      
      // v3 APIクライアントを使用（セッションID付きリクエスト）
      const diagnosisResult = await apiClientV3.diagnosis.generateFromUrls(urls);
      
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
      
    } catch (_err) {
      const errorMessage = err instanceof Error ? err.message : '診断中にエラーが発生しました';
      if (process.env.NODE_ENV !== 'test') {
        console.error('[useDiagnosisV3] Diagnosis error:', err);
      }
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