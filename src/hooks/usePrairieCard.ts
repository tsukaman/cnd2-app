import { useState, useCallback } from 'react';
import { PrairieProfile } from '@/types';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { getSampleProfile } from '@/lib/constants/sample-profiles';
import { toast, type ExternalToast } from 'sonner';

interface UsePrairieCardReturn {
  loading: boolean;
  error: string | null;
  profile: PrairieProfile | null;
  retryAttempt: number;
  isRetrying: boolean;
  fetchProfile: (url: string) => Promise<PrairieProfile | null>;
  clearError: () => void;
  useSampleData: () => void;
}

export function usePrairieCard(): UsePrairieCardReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PrairieProfile | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchProfile = useCallback(async (url: string): Promise<PrairieProfile | null> => {
    setLoading(true);
    setError(null);
    setRetryAttempt(0);
    
    try {
      // Check for sample/demo URLs first (development only)
      if (process.env.NODE_ENV === 'development') {
        const sampleProfile = getSampleProfile(url);
        if (sampleProfile) {
          toast.success('サンプルデータを使用します', {
            description: 'テスト用のPrairie Cardデータを読み込みました'
          });
          setProfile(sampleProfile);
          return sampleProfile;
        }
      }
      
      // Fetch with retry logic
      const response = await apiClient.prairie.fetch(url, {
        enableRetry: true,
        onRetry: (attempt) => {
          setRetryAttempt(attempt);
          setIsRetrying(true);
          toast.info(`再試行中... (${attempt}/3)`, {
            description: 'Prairie Card APIに接続しています'
          });
        }
      }) as PrairieProfile;
      
      // Check if response has the expected structure
      if (!response || !response.basic || !response.basic.name) {
        throw new Error('Prairie Cardのデータ形式が正しくありません');
      }

      // The response is already in PrairieProfile format from the API
      const prairieProfile: PrairieProfile = response;

      setProfile(prairieProfile);
      setIsRetrying(false);
      toast.success('Prairie Cardを読み込みました');
      return prairieProfile;
    } catch (err) {
      setIsRetrying(false);
      
      let errorMessage = 'Prairie Cardの取得中にエラーが発生しました';
      let errorDescription = '';
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        // Provide specific error messages
        if (message.includes('502') || message.includes('503')) {
          errorMessage = 'Prairie Card APIが一時的に利用できません';
          errorDescription = process.env.NODE_ENV === 'development' 
            ? 'サーバーが応答していません。サンプルデータで試すか、しばらくしてからお試しください。'
            : 'サーバーが応答していません。しばらくしてから再度お試しください。';
        } else if (message.includes('network')) {
          errorMessage = 'ネットワーク接続エラー';
          errorDescription = 'インターネット接続を確認してください。';
        } else if (message.includes('timeout')) {
          errorMessage = '接続がタイムアウトしました';
          errorDescription = 'サーバーの応答が遅いようです。もう一度お試しください。';
        } else if (message.includes('形式')) {
          errorMessage = 'Prairie Cardのデータ形式エラー';
          errorDescription = 'URLが正しいPrairie Cardのものか確認してください。';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Show error toast with actionable guidance
      const toastOptions: ExternalToast = {
        description: errorDescription
      };
      
      // Only show sample data action in development
      if (process.env.NODE_ENV === 'development') {
        toastOptions.action = {
          label: 'サンプルデータを使用',
          onClick: () => {
            useSampleData();
          }
        };
      }
      
      toast.error(errorMessage, toastOptions);
      
      logger.error('[usePrairieCard] エラー', err);
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetryAttempt(0);
    setIsRetrying(false);
  }, []);

  const useSampleData = useCallback(() => {
    const sampleNames = ['alice', 'bob', 'charlie'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const sampleProfile = getSampleProfile(randomName);
    
    if (sampleProfile) {
      setProfile(sampleProfile);
      setError(null);
      toast.success('サンプルデータを読み込みました', {
        description: `${sampleProfile.basic.name}のプロフィールを使用します`
      });
    }
  }, []);

  return {
    loading,
    error,
    profile,
    retryAttempt,
    isRetrying,
    fetchProfile,
    clearError,
    useSampleData,
  };
}