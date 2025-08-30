import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrairieCard } from '../usePrairieCard';
import { apiClient } from '@/lib/api-client';

// Mock apiClient
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    prairie: {
      fetch: jest.fn(),
    },
  },
}));

describe('usePrairieCard', () => {
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected error scenarios
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    // Set up default successful fetch mock
    // Note: apiClient.prairie.fetch returns the extracted data directly, not the wrapper
    (apiClient.prairie.fetch as jest.Mock).mockResolvedValue({
      basic: {
        name: 'Default User',
        title: 'Developer',
        company: 'Company',
        bio: 'Bio',
      },
      details: {
        skills: [],
        tags: [],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePrairieCard());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('successfully fetches a profile', async () => {
    // Mock data should be in PrairieProfile format (as returned by the API)
    const mockData = {
      basic: {
        name: 'Test User',
        title: 'Developer',
        company: 'Test Company',
        bio: 'Test bio',
        avatar: undefined,
      },
      details: {
        tags: ['dev'],
        skills: ['React', 'TypeScript'],
        interests: ['coding'],
        certifications: [],
        communities: [],
        motto: undefined,
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

    // Expected profile is the same as mock data since no transformation is done
    const expectedProfile = mockData;

    (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://example.com/profile');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.profile).toEqual(expectedProfile);
      expect(fetchedProfile).toEqual(expectedProfile);
    });

    expect(apiClient.prairie.fetch).toHaveBeenCalled();
    expect(apiClient.prairie.fetch).toHaveBeenCalledWith('https://example.com/profile');
  });

  it('handles fetch errors correctly', async () => {
    const errorMessage = 'Prairie Cardの取得に失敗しました';
    
    (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://example.com/profile');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.profile).toBeNull();
      expect(fetchedProfile).toBeNull();
    });
  });

  it('handles network errors correctly', async () => {
    (apiClient.prairie.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://example.com/profile');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.profile).toBeNull();
      expect(fetchedProfile).toBeNull();
    });
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => usePrairieCard());
    
    // Simulate an error state
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles response without basic.name correctly', async () => {
    const mockDataWithoutName = {
      basic: {
        title: 'Developer',
        company: 'Test Company',
      },
      details: {},
      social: {},
      custom: {},
      meta: {},
    };

    (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce(mockDataWithoutName);

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://example.com/profile');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Prairie Cardの取得に失敗しました');
      expect(result.current.profile).toBeNull();
      expect(fetchedProfile).toBeNull();
    });
  });

  it('handles response without basic field correctly', async () => {
    const mockDataWithoutBasic = {
      details: { skills: ['React'] },
      social: {},
      custom: {},
      meta: {},
    };

    (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce(mockDataWithoutBasic);

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://example.com/profile');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Prairie Cardの取得に失敗しました');
      expect(result.current.profile).toBeNull();
      expect(fetchedProfile).toBeNull();
    });
  });

  it('handles complete profile with all optional fields', async () => {
    const completeProfile = {
      basic: {
        name: '＿・）つかまん',
        title: 'フルスタックエンジニア',
        company: 'テック株式会社',
        bio: 'クラウドネイティブ技術に情熱を注ぐエンジニア',
        avatar: 'https://example.com/avatar.jpg',
      },
      details: {
        tags: ['cloud', 'native', 'kubernetes'],
        skills: ['Docker', 'Kubernetes', 'Go', 'TypeScript'],
        interests: ['DevOps', 'SRE', 'Platform Engineering'],
        certifications: ['CKA', 'AWS Solutions Architect'],
        communities: ['CNCF', 'Cloud Native Days'],
        motto: '継続的改善',
      },
      social: {
        twitter: '@tsukaman',
        github: 'tsukaman',
        linkedin: 'tsukaman',
      },
      custom: {
        favoriteTools: ['kubectl', 'terraform'],
      },
      meta: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-08-30T00:00:00Z',
        connectedBy: 'QR Code',
        hashtag: '#CloudNativeDays',
      },
    };

    (apiClient.prairie.fetch as jest.Mock).mockResolvedValueOnce(completeProfile);

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://my.prairie.cards/u/tsukaman');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.profile).toEqual(completeProfile);
      expect(fetchedProfile).toEqual(completeProfile);
    });

    // Verify all fields are preserved
    expect(result.current.profile?.basic.avatar).toBe('https://example.com/avatar.jpg');
    expect(result.current.profile?.details.certifications).toEqual(['CKA', 'AWS Solutions Architect']);
    expect(result.current.profile?.social.github).toBe('tsukaman');
    expect(result.current.profile?.meta.hashtag).toBe('#CloudNativeDays');
  });

  it('handles multiple consecutive fetch calls correctly', async () => {
    const profile1 = {
      basic: { name: 'User 1', title: 'Dev 1', company: 'Company 1', bio: 'Bio 1' },
      details: { tags: [], skills: [], interests: [], certifications: [], communities: [] },
      social: {},
      custom: {},
      meta: {},
    };

    const profile2 = {
      basic: { name: 'User 2', title: 'Dev 2', company: 'Company 2', bio: 'Bio 2' },
      details: { tags: [], skills: [], interests: [], certifications: [], communities: [] },
      social: {},
      custom: {},
      meta: {},
    };

    (apiClient.prairie.fetch as jest.Mock)
      .mockResolvedValueOnce(profile1)
      .mockResolvedValueOnce(profile2);

    const { result } = renderHook(() => usePrairieCard());

    // First fetch
    await act(async () => {
      await result.current.fetchProfile('https://example.com/profile1');
    });

    await waitFor(() => {
      expect(result.current.profile?.basic.name).toBe('User 1');
    });

    // Second fetch should replace the first profile
    await act(async () => {
      await result.current.fetchProfile('https://example.com/profile2');
    });

    await waitFor(() => {
      expect(result.current.profile?.basic.name).toBe('User 2');
    });

    expect(apiClient.prairie.fetch).toHaveBeenCalledTimes(2);
  });
});