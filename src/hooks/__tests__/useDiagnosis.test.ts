import { renderHook, act, waitFor } from '@testing-library/react';
import { useDiagnosis } from '../useDiagnosis';
import { PrairieProfile } from '@/types';
import { apiClient } from '@/lib/api-client';

// Mock apiClient and localStorage
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    diagnosis: {
      generate: jest.fn(),
    },
  },
}));
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useDiagnosis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('{}');
    // Set up default successful diagnosis mock
    (apiClient.diagnosis.generate as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        result: {
          id: 'test-diagnosis-123',
          mode: 'duo',
          type: 'Compatible',
          compatibility: 85,
          summary: 'Great match!',
          strengths: ['Collaboration'],
          opportunities: ['Growth'],
          advice: 'Keep working together',
          participants: [],
          createdAt: new Date().toISOString(),
        },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockProfiles: PrairieProfile[] = [
    {
      basic: {
        name: 'User 1',
        title: 'Developer',
        company: 'Tech Corp',
        bio: 'Developer bio',
      },
      details: {
        tags: [],
        skills: ['React', 'TypeScript'],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    },
    {
      basic: {
        name: 'User 2',
        title: 'Designer',
        company: 'Design Studio',
        bio: 'Designer bio',
      },
      details: {
        tags: [],
        skills: ['Figma', 'CSS'],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    },
  ];

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useDiagnosis());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('successfully generates a duo diagnosis', async () => {
    const mockResult = {
      id: 'test-id',
      mode: 'duo',
      profiles: mockProfiles,
      compatibility: 85,
      createdAt: new Date().toISOString(),
    };

    (apiClient.diagnosis.generate as jest.Mock).mockResolvedValueOnce({
      success: true,
      result: mockResult,
    });

    const { result } = renderHook(() => useDiagnosis());

    let diagnosis: any;
    await act(async () => {
      diagnosis = await result.current.generateDiagnosis(mockProfiles, 'duo');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toEqual(mockResult);
      expect(diagnosis).toEqual(mockResult);
    });

    expect(apiClient.diagnosis.generate).toHaveBeenCalled();
    expect(apiClient.diagnosis.generate).toHaveBeenCalledWith(mockProfiles, 'duo');

    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cnd2_results',
      expect.stringContaining('test-id')
    );
  });

  it('handles diagnosis errors correctly', async () => {
    const errorMessage = '診断の生成に失敗しました';
    
    (apiClient.diagnosis.generate as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: errorMessage,
    });

    const { result } = renderHook(() => useDiagnosis());

    let diagnosis: any;
    await act(async () => {
      diagnosis = await result.current.generateDiagnosis(mockProfiles, 'duo');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.result).toBeNull();
      expect(diagnosis).toBeNull();
    });
  });

  it('handles localStorage errors gracefully', async () => {
    const mockResult = {
      id: 'test-id',
      mode: 'duo',
      profiles: mockProfiles,
      compatibility: 85,
      createdAt: new Date().toISOString(),
    };

    (apiClient.diagnosis.generate as jest.Mock).mockResolvedValueOnce({
      success: true,
      result: mockResult,
    });

    // Simulate localStorage error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Storage full');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { result } = renderHook(() => useDiagnosis());

    await act(async () => {
      await result.current.generateDiagnosis(mockProfiles, 'duo');
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResult);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useDiagnosis] 結果保存エラー',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useDiagnosis());
    
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('clears result when clearResult is called', () => {
    const { result } = renderHook(() => useDiagnosis());
    
    act(() => {
      result.current.clearResult();
    });

    expect(result.current.result).toBeNull();
  });
});