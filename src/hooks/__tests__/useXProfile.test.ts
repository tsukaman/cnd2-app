/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useXProfile } from '../useXProfile';
import { apiClient } from '@/lib/api-client';
import { getSampleXProfile } from '@/lib/constants/sample-x-profiles';
import { toast } from 'sonner';

// Mocks
jest.mock('@/lib/api-client');
jest.mock('@/lib/constants/sample-x-profiles');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useXProfile', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
  const mockGetSampleXProfile = getSampleXProfile as jest.Mock;
  const mockToast = toast as jest.Mocked<typeof toast>;

  const sampleProfile = {
    basic: {
      id: '44196397',
      username: 'elonmusk',
      name: 'Elon Musk',
      bio: '🚀 SpaceX • 🚗 Tesla • 🧠 Neuralink',
      location: 'Mars & Earth',
      website: 'https://tesla.com',
      avatar: 'https://pbs.twimg.com/profile_images/test.jpg',
      verified: true,
      protected: false,
      createdAt: '2009-06-02T20:12:29.000Z'
    },
    metrics: {
      followers: 150000000,
      following: 500,
      tweets: 30000,
      listed: 100000
    },
    details: {
      recentTweets: [],
      topics: ['space', 'ai', 'tesla'],
      hashtags: ['#spacex', '#tesla'],
      mentionedUsers: ['SpaceX', 'Tesla'],
      languages: ['en'],
      activeHours: [8, 9, 10]
    },
    analysis: {
      techStack: ['AI', 'Robotics'],
      interests: ['space exploration', 'artificial intelligence'],
      personality: 'Visionary innovator'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.xProfile = {
      fetch: jest.fn() as jest.Mock
    };
  });

  describe('fetchProfile', () => {
    it('should fetch X profile successfully', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockResolvedValueOnce(sampleProfile);

      const { result } = renderHook(() => useXProfile());

      await waitFor(async () => {
        const profile = await result.current.fetchProfile('elonmusk');
        expect(profile).toEqual(sampleProfile);
      });

      expect(mockApiClient.xProfile.fetch).toHaveBeenCalledWith('elonmusk', {
        enableRetry: true,
        onRetry: expect.any(Function)
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'X プロフィールを読み込みました',
        expect.objectContaining({
          description: '@elonmusk のプロフィール'
        })
      );
    });

    it('should handle @ prefix in username', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockResolvedValueOnce(sampleProfile);

      const { result } = renderHook(() => useXProfile());

      await waitFor(async () => {
        await result.current.fetchProfile('@elonmusk');
      });

      expect(mockApiClient.xProfile.fetch).toHaveBeenCalledWith('elonmusk', expect.any(Object));
    });

    it('should use sample data in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error - NODE_ENV is readonly but we need to test it
      process.env.NODE_ENV = 'development';
      mockGetSampleXProfile.mockReturnValueOnce(sampleProfile);

      const { result } = renderHook(() => useXProfile());

      await waitFor(async () => {
        const profile = await result.current.fetchProfile('elonmusk');
        expect(profile).toEqual(sampleProfile);
      });

      expect(mockGetSampleXProfile).toHaveBeenCalledWith('elonmusk');
      expect(mockApiClient.xProfile.fetch).not.toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        'サンプルデータを使用します',
        expect.objectContaining({
          description: 'テスト用のX プロフィールデータを読み込みました'
        })
      );

      // @ts-expect-error - NODE_ENV is readonly but we need to test it
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle API errors', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockRejectedValueOnce(new Error('User not found'));

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.fetchProfile('unknownuser');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('ユーザーが見つかりません');
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'ユーザーが見つかりません',
        expect.objectContaining({
          description: 'ユーザー名を確認してください'
        })
      );
    });

    it('should handle protected account error', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockRejectedValueOnce(new Error('Account is protected'));

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.fetchProfile('protecteduser');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('非公開アカウントです');
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        '非公開アカウントです',
        expect.objectContaining({
          description: 'このアカウントの情報は取得できません'
        })
      );
    });

    it('should handle rate limit error', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.fetchProfile('user');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('レート制限に達しました');
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'レート制限に達しました',
        expect.objectContaining({
          description: 'しばらく待ってから再度お試しください'
        })
      );
    });

    it('should handle retry attempts', async () => {
      let retryCount = 0;
      (mockApiClient.xProfile.fetch as jest.Mock).mockImplementationOnce((username: string, options: any) => {
        if (options?.onRetry) {
          options.onRetry(++retryCount);
        }
        return Promise.resolve(sampleProfile);
      });

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.fetchProfile('elonmusk');
      });

      await waitFor(() => {
        expect(result.current.retryAttempt).toBe(1);
      });

      expect(mockToast.info).toHaveBeenCalledWith(
        '再試行中... (1/3)',
        expect.objectContaining({
          description: 'X プロフィールを取得しています'
        })
      );
    });

    it('should validate response structure', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockResolvedValueOnce({
        invalid: 'data'
      } as any);

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.fetchProfile('user');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('X プロフィールのデータ形式が正しくありません');
      });
    });
  });

  describe('useSampleData', () => {
    it('should load random sample data', () => {
      mockGetSampleXProfile.mockReturnValueOnce(sampleProfile);

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.useSampleData();
      });

      expect(result.current.profile).toEqual(sampleProfile);
      expect(result.current.error).toBeNull();
      expect(mockToast.success).toHaveBeenCalledWith(
        'サンプルデータを読み込みました',
        expect.objectContaining({
          description: '@elonmusk のプロフィールを使用します'
        })
      );
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      (mockApiClient.xProfile.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useXProfile());

      act(() => {
        result.current.fetchProfile('user');
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.retryAttempt).toBe(0);
      expect(result.current.isRetrying).toBe(false);
    });
  });
});