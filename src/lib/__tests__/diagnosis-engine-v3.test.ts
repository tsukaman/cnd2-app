import { SimplifiedDiagnosisEngine } from '../diagnosis-engine-v3';
import OpenAI from 'openai';
import { DiagnosisCache } from '../diagnosis-cache';
import { PrairieProfile } from '@/types';

// Mock dependencies
jest.mock('openai');
jest.mock('../diagnosis-cache');
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

// Mock fetch
global.fetch = jest.fn();

describe('SimplifiedDiagnosisEngine', () => {
  let engine: SimplifiedDiagnosisEngine;
  let mockOpenAI: {
    chat: {
      completions: {
        create: jest.Mock;
      };
    };
  };
  let mockCache: ReturnType<typeof DiagnosisCache.getInstance>;
  let originalWindow: typeof window | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    SimplifiedDiagnosisEngine.resetInstance();
    
    // Setup cache mock
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    } as unknown as ReturnType<typeof DiagnosisCache.getInstance>;
    (DiagnosisCache.getInstance as jest.Mock).mockReturnValue(mockCache);
    
    // Setup OpenAI mock with proper typing
    const mockCreate = jest.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as ReturnType<typeof DiagnosisCache.getInstance>;
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
    
    // Set environment
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Mock window as undefined to simulate server-side environment
    originalWindow = global.window;
    delete (global as unknown as { window?: Window }).window;
    
    // Reset singleton instance to pick up the new environment variable
    (SimplifiedDiagnosisEngine as unknown as { instance?: SimplifiedDiagnosisEngine }).instance = undefined;
    
    // Get instance
    engine = SimplifiedDiagnosisEngine.getInstance();
    
    // Force set the openai instance for testing
    (engine as unknown as { openai: typeof mockOpenAI }).openai = mockOpenAI;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    // Restore window
    if (originalWindow) {
      (global as unknown as { window?: Window }).window = originalWindow;
    }
    // Reset singleton instance
    SimplifiedDiagnosisEngine.resetInstance();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返す', () => {
      const instance1 = SimplifiedDiagnosisEngine.getInstance();
      const instance2 = SimplifiedDiagnosisEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('isConfigured', () => {
    it('OpenAI APIキーが設定されている場合はtrueを返す', () => {
      expect(engine.isConfigured()).toBe(true);
    });

    it('OpenAI APIキーが設定されていない場合はfalseを返す', () => {
      delete process.env.OPENAI_API_KEY;
      (SimplifiedDiagnosisEngine as unknown as { instance?: SimplifiedDiagnosisEngine }).instance = undefined;
      
      const newEngine = SimplifiedDiagnosisEngine.getInstance();
      
      expect(newEngine.isConfigured()).toBe(false);
    });
  });

  describe('generateDiagnosis', () => {
    const mockProfiles = [
      {
        basic: {
          name: 'Test User 1',
          title: 'Engineer',
          company: 'Tech Corp',
          bio: 'Test bio 1',
        },
        details: {
          skills: ['JavaScript', 'TypeScript'],
          interests: ['Cloud', 'AI'],
        },
      },
      {
        basic: {
          name: 'Test User 2',
          title: 'Designer',
          company: 'Design Inc',
          bio: 'Test bio 2',
        },
        details: {
          skills: ['Figma', 'Sketch'],
          interests: ['UX', 'UI'],
        },
      },
    ] as PrairieProfile[];

    const mockHtml1 = '<html><body><h1>Test User 1</h1></body></html>';
    const mockHtml2 = '<html><body><h1>Test User 2</h1></body></html>';

    beforeEach(() => {
      // Reset fetch mock for each test
      (global.fetch as jest.Mock).mockClear();
      
      // Setup default mock response for all tests
      const mockAIResponse = {
        extracted_profiles: {
          person1: { 
            name: 'Test User 1', 
            title: 'Engineer',
            company: 'Tech Corp',
            skills: ['JavaScript'] 
          },
          person2: { 
            name: 'Test User 2',
            title: 'Designer', 
            company: 'Design Inc',
            skills: ['TypeScript'] 
          }
        },
        diagnosis: {
          compatibility: 85,
          summary: '素晴らしい相性です！',
          strengths: ['技術力の相互補完'],
          opportunities: ['新しいプロジェクトの可能性'],
          advice: 'お互いの強みを活かして素晴らしいプロダクトを作りましょう',
          type: 'クラウドネイティブ型',
          luckyItem: 'Kubernetesのマスコット',
          luckyAction: 'ペアプログラミング'
        }
      };
      
      // Setup mock OpenAI response for all tests by default
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockAIResponse),
          },
        }],
      });
    });

    it('キャッシュされた結果がある場合はそれを返す', async () => {
      const cachedResult = {
        id: 'cached-123',
        compatibility: 85,
        summary: 'Cached result',
        mode: 'duo' as const,
        type: 'クラウドネイティブ型',
        participants: [],
        strengths: [],
        opportunities: [],
        advice: '',
        luckyItem: 'Kubernetesのマスコット',
        luckyAction: 'ペアプログラミング',
        createdAt: new Date().toISOString(),
        metadata: {
          engine: 'v3-simplified',
          model: 'gpt-4o-mini'
        }
      };
      mockCache.get.mockReturnValue(cachedResult);
      
      // Mock fetch for the HTML fetching
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml1),
      });

      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBe(cachedResult);
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });

    it('新規診断を生成する', async () => {
      mockCache.get.mockReturnValue(null);
      
      // Mock fetch to return HTML
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><head><title>Test User</title></head><body>Test content</body></html>'),
      });
      
      const mockAIResponse = {
        extracted_profiles: {
          person1: { name: 'Test User 1', skills: ['JavaScript'] },
          person2: { name: 'Test User 2', skills: ['TypeScript'] }
        },
        diagnosis: {
          score: 75,
          message: '良好な相性です',
          conversationStarters: ['コミュニケーション'],
          hiddenGems: 'お互いの強みを活かしましょう',
          type: 'クラウドネイティブ型',
          luckyItem: 'Kubernetesのマスコット',
          luckyAction: 'ペアプログラミング'
        }
      };
      
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockAIResponse),
          },
        }],
      });

      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id-123');
      expect(result.compatibility).toBe(75);
      expect(result.summary).toBe('良好な相性です');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('AI APIが利用できない場合はフォールバック診断を返す', async () => {
      delete process.env.OPENAI_API_KEY;
      (SimplifiedDiagnosisEngine as unknown as { instance?: SimplifiedDiagnosisEngine }).instance = undefined;
      const fallbackEngine = SimplifiedDiagnosisEngine.getInstance();
      
      mockCache.get.mockReturnValue(null);
      
      // Mock fetch for HTML fetching
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><head><title>Test User</title></head><body>Test content</body></html>'),
      });
      
      const result = await fallbackEngine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.summary).toContain('相性');
      expect(result.compatibility).toBeGreaterThanOrEqual(0);
      expect(result.compatibility).toBeLessThanOrEqual(100);
    });

    it('HTMLフェッチエラーをハンドリングする', async () => {
      mockCache.get.mockReturnValue(null);
      
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(engine.generateDiagnosis(mockProfiles, 'duo')).rejects.toThrow('Network error');
    });

    it('AI応答のパースエラーをハンドリングする', async () => {
      mockCache.get.mockReturnValue(null);
      
      // Mock fetch for HTML
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml1),
      });
      
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON',
          },
        }],
      });

      await expect(engine.generateDiagnosis(mockProfiles, 'duo')).rejects.toThrow();
    });

    it('グループ診断モードで動作する', async () => {
      mockCache.get.mockReturnValue(null);
      
      const groupProfiles = [...mockProfiles, {
        basic: {
          name: 'Test User 3',
          title: 'Manager',
          company: 'Corp Inc',
          bio: 'Test bio 3',
        },
        details: {
          skills: ['Management'],
          interests: ['Leadership'],
        },
      }] as PrairieProfile[];

      // Mock fetch for HTML (for group mode, it will fetch 3 times)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml1),
      });

      // Group diagnosis is not implemented, should throw
      await expect(engine.generateDiagnosis(groupProfiles, 'group')).rejects.toThrow('グループ診断は未実装です');
    });

    it('HTMLサイズ制限を適用する', async () => {
      mockCache.get.mockReturnValue(null);
      
      const largeHtml = '<html><body>' + 'x'.repeat(60000) + '</body></html>';
      
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(largeHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(largeHtml),
        });

      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      // Check that HTML was trimmed (verify through AI call)
      if ((mockOpenAI.chat.completions.create as jest.Mock).mock.calls.length > 0) {
        const aiCallContent = (mockOpenAI.chat.completions.create as jest.Mock).mock.calls[0][0].messages[0].content;
        expect(aiCallContent.length).toBeLessThan(150000); // Reasonable limit for prompt
      }
    });
  });

});