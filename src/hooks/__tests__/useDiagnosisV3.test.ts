import { renderHook, act } from '@testing-library/react';
import { useDiagnosisV3 } from '../useDiagnosisV3';
import { apiClientV3 } from '@/lib/api-client-v3';

jest.mock('@/lib/api-client-v3');

describe('useDiagnosisV3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useDiagnosisV3());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  describe('diagnose', () => {
    const mockUrls: [string, string] = [
      'https://prairie.cards/user1',
      'https://prairie.cards/user2'
    ];

    it('診断を正常に生成する', async () => {
      const mockResult = {
        id: 'test-123',
        compatibility: 80,
        summary: 'Good match',
        strengths: ['Communication'],
        opportunities: ['Learning'],
        advice: 'Work together',
        type: 'Cloud Native',
        mode: 'duo' as const,
        participants: [],
        createdAt: new Date().toISOString(),
      };

      (apiClientV3.diagnosis.generateFromUrls as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.diagnose(mockUrls);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toEqual(mockResult);
          });

    it('診断中はローディング状態になる', async () => {
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiClientV3.diagnosis.generateFromUrls as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useDiagnosisV3());
      
      act(() => {
        result.current.diagnose(mockUrls);
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolvePromise({
          success: true,
          data: { result: { id: 'test' } },
        });
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('エラーをハンドリングする', async () => {
      const errorMessage = 'Failed to generate diagnosis';
      
      (apiClientV3.diagnosis.generateFromUrls as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.diagnose(mockUrls);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to generate diagnosis');
      expect(result.current.result).toBeNull();
    });

    it('ネットワークエラーをハンドリングする', async () => {
      (apiClientV3.diagnosis.generateFromUrls as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.diagnose(mockUrls);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.result).toBeNull();
    });

    it('無効なURLの場合はエラーを返す', async () => {
      const invalidUrls: [string, string] = [
        'invalid-url',
        'https://prairie.cards/user2'
      ];

      (apiClientV3.diagnosis.generateFromUrls as jest.Mock).mockRejectedValue(
        new Error('Invalid URL format')
      );

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.diagnose(invalidUrls);
      });

      expect(result.current.error).toBe('Invalid URL format');
      expect(result.current.result).toBeNull();
    });

    // グループ診断は現在のv3では未実装のため、このテストは削除
  });

  // clearErrorメソッドは存在しないので、resetメソッドのテストに統合

  describe('reset', () => {
    it('すべての状態をリセットする', async () => {
      const mockResult = {
        id: 'test-123',
        compatibility: 80,
        summary: 'Good match',
      };

      (apiClientV3.diagnosis.generateFromUrls as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.diagnose([
          'https://prairie.cards/1',
          'https://prairie.cards/2'
        ]);
      });

      expect(result.current.result).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });
});