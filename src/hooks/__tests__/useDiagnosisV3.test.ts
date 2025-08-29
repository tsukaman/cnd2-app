import { renderHook, act, waitFor } from '@testing-library/react';
import { useDiagnosisV3 } from '../useDiagnosisV3';
import { apiClient } from '@/lib/api-client-v3';

jest.mock('@/lib/api-client-v3');

describe('useDiagnosisV3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useDiagnosisV3());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  describe('generateDiagnosis', () => {
    const mockProfiles = [
      {
        basic: { name: 'User 1', url: 'https://prairie.cards/user1' },
        details: { skills: ['React'] },
      },
      {
        basic: { name: 'User 2', url: 'https://prairie.cards/user2' },
        details: { skills: ['Vue'] },
      },
    ] as any;

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
        participants: mockProfiles,
        createdAt: new Date().toISOString(),
      };

      (apiClient.diagnosis.generateV3 as jest.Mock).mockResolvedValue({
        success: true,
        data: { result: mockResult },
      });

      const { result } = renderHook(() => useDiagnosisV3());
      
      let diagnosisResult: any;
      await act(async () => {
        diagnosisResult = await result.current.generateDiagnosis(mockProfiles, 'duo');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toEqual(mockResult);
      expect(diagnosisResult).toEqual(mockResult);
    });

    it('診断中はローディング状態になる', async () => {
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiClient.diagnosis.generateV3 as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useDiagnosisV3());
      
      act(() => {
        result.current.generateDiagnosis(mockProfiles, 'duo');
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolvePromise({
          success: true,
          data: { result: { id: 'test' } },
        });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('エラーをハンドリングする', async () => {
      const errorMessage = 'Failed to generate diagnosis';
      
      (apiClient.diagnosis.generateV3 as jest.Mock).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useDiagnosisV3());
      
      let diagnosisResult: any;
      await act(async () => {
        diagnosisResult = await result.current.generateDiagnosis(mockProfiles, 'duo');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.result).toBeNull();
      expect(diagnosisResult).toBeNull();
    });

    it('ネットワークエラーをハンドリングする', async () => {
      (apiClient.diagnosis.generateV3 as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useDiagnosisV3());
      
      let diagnosisResult: any;
      await act(async () => {
        diagnosisResult = await result.current.generateDiagnosis(mockProfiles, 'duo');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('診断の生成に失敗しました。');
      expect(result.current.result).toBeNull();
      expect(diagnosisResult).toBeNull();
    });

    it('Prairie Card URLが不足している場合はエラーを返す', async () => {
      const invalidProfiles = [
        {
          basic: { name: 'User 1' }, // URL missing
          details: { skills: ['React'] },
        },
        {
          basic: { name: 'User 2', url: 'https://prairie.cards/user2' },
          details: { skills: ['Vue'] },
        },
      ] as any;

      const { result } = renderHook(() => useDiagnosisV3());
      
      let diagnosisResult: any;
      await act(async () => {
        diagnosisResult = await result.current.generateDiagnosis(invalidProfiles, 'duo');
      });

      expect(result.current.error).toBe('Prairie Card URLが不足しています。');
      expect(diagnosisResult).toBeNull();
    });

    it('グループ診断モードで動作する', async () => {
      const groupProfiles = [
        ...mockProfiles,
        {
          basic: { name: 'User 3', url: 'https://prairie.cards/user3' },
          details: { skills: ['Angular'] },
        },
      ] as any;

      const mockResult = {
        id: 'group-123',
        compatibility: 75,
        summary: 'Good team',
        mode: 'group' as const,
        participants: groupProfiles,
      };

      (apiClient.diagnosis.generateV3 as jest.Mock).mockResolvedValue({
        success: true,
        data: { result: mockResult },
      });

      const { result } = renderHook(() => useDiagnosisV3());
      
      let diagnosisResult: any;
      await act(async () => {
        diagnosisResult = await result.current.generateDiagnosis(groupProfiles, 'group');
      });

      expect(result.current.result?.mode).toBe('group');
      expect(result.current.result?.participants).toHaveLength(3);
      expect(diagnosisResult).toEqual(mockResult);
    });
  });

  describe('clearError', () => {
    it('エラーをクリアする', async () => {
      (apiClient.diagnosis.generateV3 as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.generateDiagnosis([], 'duo');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('すべての状態をリセットする', async () => {
      const mockResult = {
        id: 'test-123',
        compatibility: 80,
        summary: 'Good match',
      };

      (apiClient.diagnosis.generateV3 as jest.Mock).mockResolvedValue({
        success: true,
        data: { result: mockResult },
      });

      const { result } = renderHook(() => useDiagnosisV3());
      
      await act(async () => {
        await result.current.generateDiagnosis([
          { basic: { url: 'https://prairie.cards/1' } },
          { basic: { url: 'https://prairie.cards/2' } },
        ] as any, 'duo');
      });

      expect(result.current.result).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });
});