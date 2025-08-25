import { useState, useCallback } from 'react';
import { PrairieProfile } from '@/types';

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
      const response = await fetch('/api/prairie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Prairie Cardの取得に失敗しました');
      }

      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Prairie Cardの取得中にエラーが発生しました';
      
      setError(errorMessage);
      console.error('[usePrairieCard] エラー:', err);
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