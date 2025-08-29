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
      const data = await apiClient.prairie.fetch(url);
      
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
          avatar: data.avatar,
        },
        details: {
          tags: data.tags || [],
          skills: data.skills || [],
          interests: data.interests || [],
          certifications: data.certifications || [],
          communities: data.communities || [],
          motto: data.motto,
        },
        social: {
          twitter: data.twitter,
          github: data.github,
          linkedin: data.linkedin,
          website: data.website,
          blog: data.blog,
          qiita: data.qiita,
          zenn: data.zenn,
        },
        custom: data.custom || {},
        meta: {
          createdAt: data.createdAt || undefined,
          updatedAt: data.updatedAt || undefined,
          connectedBy: data.connectedBy,
          hashtag: data.hashtag,
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