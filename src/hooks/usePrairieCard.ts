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

      // APIレスポンスをPrairieProfile形式に変換
      const prairieProfile: PrairieProfile = {
        basic: {
          name: data.data.name || '名前未設定',
          title: data.data.title || '',
          company: data.data.company || '',
          bio: data.data.bio || '',
          avatar: data.data.avatar,
        },
        details: {
          tags: data.data.tags || [],
          skills: data.data.skills || [],
          interests: data.data.interests || [],
          certifications: data.data.certifications || [],
          communities: data.data.communities || [],
          motto: data.data.motto,
        },
        social: {
          twitter: data.data.twitter,
          github: data.data.github,
          linkedin: data.data.linkedin,
          website: data.data.website,
          blog: data.data.blog,
          qiita: data.data.qiita,
          zenn: data.data.zenn,
        },
        custom: data.data.custom || {},
        meta: {
          createdAt: data.data.createdAt ? new Date(data.data.createdAt) : undefined,
          updatedAt: data.data.updatedAt ? new Date(data.data.updatedAt) : undefined,
          connectedBy: data.data.connectedBy,
          hashtag: data.data.hashtag,
        },
      };

      setProfile(prairieProfile);
      return prairieProfile;
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