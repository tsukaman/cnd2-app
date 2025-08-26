import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrairieCard } from '../usePrairieCard';

// Mock fetch
global.fetch = jest.fn();

describe('usePrairieCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePrairieCard());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('successfully fetches a profile', async () => {
    const mockProfile = {
      name: 'Test User',
      title: 'Developer',
      skills: ['React', 'TypeScript'],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        profile: mockProfile,
      }),
    });

    const { result } = renderHook(() => usePrairieCard());

    let fetchedProfile: any;
    await act(async () => {
      fetchedProfile = await result.current.fetchProfile('https://example.com/profile');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.profile).toEqual(mockProfile);
      expect(fetchedProfile).toEqual(mockProfile);
    });

    expect(fetch).toHaveBeenCalledWith('/api/prairie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com/profile' }),
    });
  });

  it('handles fetch errors correctly', async () => {
    const errorMessage = 'Prairie Cardの取得に失敗しました';
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: errorMessage,
      }),
    });

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
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

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