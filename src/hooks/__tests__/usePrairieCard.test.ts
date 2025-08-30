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
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default successful fetch mock
    (apiClient.prairie.fetch as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: 'Default User',
        title: 'Developer',
        company: 'Company',
        bio: 'Bio',
        skills: [],
        tags: [],
        interests: [],
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePrairieCard());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('successfully fetches a profile', async () => {
    const mockData = {
      name: 'Test User',
      title: 'Developer',
      company: 'Test Company',
      bio: 'Test bio',
      skills: ['React', 'TypeScript'],
      tags: ['dev'],
      interests: ['coding'],
    };

    const expectedProfile = {
      basic: {
        name: 'Test User',
        title: 'Developer',
        company: 'Test Company',
        bio: 'Test bio',
        avatar: undefined,
      },
      details: {
        tags: [],
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
});