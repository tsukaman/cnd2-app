import { useState, useCallback } from 'react';
import { PrairieProfile } from '@/types';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

interface UsePrairieCardReturn {
  loading: boolean;
  error: string | null;
  profile: PrairieProfile | null;
  fetchProfile: (url: string) => Promise<PrairieProfile | null>;
  clearError: () => void;
}

export function usePrairieCard(): UsePrairieCardReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PrairieProfile | null>(null);

  const fetchProfile = useCallback(async (url: string): Promise<PrairieProfile | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.prairie.fetch(url) as PrairieProfile;
      
      // Check if response has the expected structure
      if (!response || !response.basic || !response.basic.name) {
        throw new Error('Prairie Cardの取得に失敗しました');
      }

      // The response is already in PrairieProfile format from the API
      const prairieProfile: PrairieProfile = response;

      setProfile(prairieProfile);
      return prairieProfile;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Prairie Cardの取得中にエラーが発生しました';
      
      setError(errorMessage);
      logger.error('[usePrairieCard] エラー', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    profile,
    fetchProfile,
    clearError,
  };
}