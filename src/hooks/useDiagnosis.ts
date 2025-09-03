import { useState, useCallback } from 'react';
import { PrairieProfile, DiagnosisResult } from '@/types';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

interface UseDiagnosisReturn {
  loading: boolean;
  error: string | null;
  result: DiagnosisResult | null;
  generateDiagnosis: (profiles: PrairieProfile[], mode: 'duo' | 'group') => Promise<DiagnosisResult | null>;
  clearError: () => void;
  clearResult: () => void;
}

export function useDiagnosis(): UseDiagnosisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const generateDiagnosis = useCallback(async (
    profiles: PrairieProfile[], 
    mode: 'duo' | 'group'
  ): Promise<DiagnosisResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.diagnosis.generate(profiles, mode);
      
      // APIレスポンスから実際の診断結果を取得
      // レスポンス構造: { result: DiagnosisResult } または DiagnosisResult
      const result = (response as { result?: DiagnosisResult })?.result || response as DiagnosisResult;
      
      if (!result || !result.id) {
        throw new Error('診断の生成に失敗しました');
      }

      setResult(result);
      
      // 結果を保存（クライアント側）
      try {
        const stored = localStorage.getItem('cnd2_results') || '{}';
        const results = JSON.parse(stored);
        results[result.id] = {
          ...result,
          createdAt: result.createdAt,
        };
        localStorage.setItem('cnd2_results', JSON.stringify(results));
      } catch (storageError) {
        logger.warn('[useDiagnosis] 結果保存エラー', storageError);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : '診断中にエラーが発生しました';
      
      setError(errorMessage);
      logger.error('[useDiagnosis] エラー', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    loading,
    error,
    result,
    generateDiagnosis,
    clearError,
    clearResult,
  };
}