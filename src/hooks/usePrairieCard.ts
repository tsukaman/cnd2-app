import { useState, useCallback } from 'react';
import { PrairieProfile } from '@/types';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { MinimalProfile } from '@/lib/prairie-profile-extractor';

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
      const data: MinimalProfile = await apiClient.prairie.fetch(url);
      
      if (!data || !data.name) {
        throw new Error('Prairie Cardの取得に失敗しました');
      }

      // APIレスポンスをPrairieProfile形式に変換
      const prairieProfile: PrairieProfile = {
        basic: {
          name: data.name || '名前未設定',
          title: data.title || '',
          company: data.company || '',
          bio: data.bio || '',
          avatar: undefined,
        },
        details: {
          tags: [],
          skills: data.skills || [],
          interests: data.interests || [],
          certifications: [],
          communities: [],
          motto: data.motto,
        },
        social: {},
        custom: {},
        meta: {
          createdAt: undefined,
          updatedAt: undefined,
          connectedBy: undefined,
          hashtag: undefined,
        },
      };

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