import { useState, useCallback } from 'react';
import { XProfile } from '@/types';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { getSampleXProfile } from '@/lib/constants/sample-x-profiles';
import { toast, type ExternalToast } from 'sonner';

interface UseXProfileReturn {
  loading: boolean;
  error: string | null;
  profile: XProfile | null;
  retryAttempt: number;
  isRetrying: boolean;
  fetchProfile: (username: string) => Promise<XProfile | null>;
  clearError: () => void;
  useSampleData: () => void;
}

export function useXProfile(): UseXProfileReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const useSampleData = useCallback(() => {
    const sampleUsernames = ['elonmusk', 'naval', 'paul_graham'];
    const randomUsername = sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)];
    const sampleProfile = getSampleXProfile(randomUsername);

    if (sampleProfile) {
      setProfile(sampleProfile);
      setError(null);
      toast.success('サンプルデータを読み込みました', {
        description: `@${sampleProfile.basic.username} のプロフィールを使用します`
      });
    }
  }, []);

  const fetchProfile = useCallback(async (username: string): Promise<XProfile | null> => {
    setLoading(true);
    setError(null);
    setRetryAttempt(0);

    try {
      // Clean username (remove @ if present)
      const cleanUsername = username.replace(/^@/, '');

      // Check for sample data first (development only)
      if (process.env.NODE_ENV === 'development') {
        const sampleProfile = getSampleXProfile(cleanUsername);
        if (sampleProfile) {
          toast.success('サンプルデータを使用します', {
            description: 'テスト用のX プロフィールデータを読み込みました'
          });
          setProfile(sampleProfile);
          return sampleProfile;
        }
      }

      // Fetch with retry logic
      const response = await apiClient.xProfile.fetch(cleanUsername, {
        enableRetry: true,
        onRetry: (attempt) => {
          setRetryAttempt(attempt);
          setIsRetrying(true);
          toast.info(`再試行中... (${attempt}/3)`, {
            description: 'X プロフィールを取得しています'
          });
        }
      }) as XProfile;

      // Check if response has the expected structure
      if (!response || !response.basic || !response.basic.username) {
        throw new Error('X プロフィールのデータ形式が正しくありません');
      }

      setProfile(response);
      setIsRetrying(false);
      toast.success('X プロフィールを読み込みました', {
        description: `@${response.basic.username} のプロフィール`
      });
      return response;
    } catch (err) {
      setIsRetrying(false);

      let errorMessage = 'X プロフィールの取得中にエラーが発生しました';
      let errorDescription = '';

      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        // Provide specific error messages
        if (message.includes('not found') || message.includes('404')) {
          errorMessage = 'ユーザーが見つかりません';
          errorDescription = 'ユーザー名を確認してください';
        } else if (message.includes('protected')) {
          errorMessage = '非公開アカウントです';
          errorDescription = 'このアカウントの情報は取得できません';
        } else if (message.includes('suspended')) {
          errorMessage = 'アカウントが停止されています';
          errorDescription = 'このアカウントは利用できません';
        } else if (message.includes('network')) {
          errorMessage = 'ネットワーク接続エラー';
          errorDescription = 'インターネット接続を確認してください';
        } else if (message.includes('timeout')) {
          errorMessage = '接続がタイムアウトしました';
          errorDescription = 'もう一度お試しください';
        } else if (message.includes('rate')) {
          errorMessage = 'レート制限に達しました';
          errorDescription = 'しばらく待ってから再度お試しください';
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

      logger.error('[useXProfile] エラー', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [useSampleData]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryAttempt(0);
    setIsRetrying(false);
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