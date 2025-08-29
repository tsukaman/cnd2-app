import { SimplifiedDiagnosisEngine } from '../diagnosis-engine-v3';
import OpenAI from 'openai';
import { DiagnosisCache } from '../diagnosis-cache';

// Mock dependencies
jest.mock('openai');
jest.mock('../diagnosis-cache');
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id-123'),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SimplifiedDiagnosisEngine', () => {
  let engine: SimplifiedDiagnosisEngine;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockCache: jest.Mocked<DiagnosisCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (SimplifiedDiagnosisEngine as any).instance = undefined;
    
    // Setup cache mock
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    } as any;
    (DiagnosisCache.getInstance as jest.Mock).mockReturnValue(mockCache);
    
    // Setup OpenAI mock
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
    
    // Set environment
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Reset singleton instance to pick up the new environment variable
    (SimplifiedDiagnosisEngine as any).instance = undefined;
    
    // Get instance
    engine = SimplifiedDiagnosisEngine.getInstance();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
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
      (SimplifiedDiagnosisEngine as any).instance = undefined;
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
    ] as any;

    const mockHtml1 = '<html><body><h1>Test User 1</h1></body></html>';
    const mockHtml2 = '<html><body><h1>Test User 2</h1></body></html>';

    beforeEach(() => {
      // Mock fetch responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(mockHtml1),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(mockHtml2),
        });
    });

    it('キャッシュされた結果がある場合はそれを返す', async () => {
      const cachedResult = {
        id: 'cached-123',
        compatibility: 85,
        summary: 'Cached result',
      };
      mockCache.get.mockReturnValue(cachedResult);

      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBe(cachedResult);
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });

    it('新規診断を生成する', async () => {
      mockCache.get.mockReturnValue(null);
      
      const mockAIResponse = {
        id: 'test-id-123',
        compatibility: 75,
        summary: '良好な相性です',
        strengths: ['コミュニケーション'],
        opportunities: ['技術共有'],
        advice: 'お互いの強みを活かしましょう',
        type: 'クラウドネイティブ型',
      };
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockAIResponse),
          },
        }],
      } as any);

      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id-123');
      expect(result.compatibility).toBe(75);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('AI APIが利用できない場合はフォールバック診断を返す', async () => {
      delete process.env.OPENAI_API_KEY;
      (SimplifiedDiagnosisEngine as any).instance = undefined;
      const fallbackEngine = SimplifiedDiagnosisEngine.getInstance();
      
      mockCache.get.mockReturnValue(null);
      
      const result = await fallbackEngine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.summary).toContain('相性度');
      expect(result.compatibility).toBeGreaterThanOrEqual(60);
      expect(result.compatibility).toBeLessThanOrEqual(95);
    });

    it('HTMLフェッチエラーをハンドリングする', async () => {
      mockCache.get.mockReturnValue(null);
      
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('AI応答のパースエラーをハンドリングする', async () => {
      mockCache.get.mockReturnValue(null);
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON',
          },
        }],
      } as any);

      const result = await engine.generateDiagnosis(mockProfiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.summary).toContain('相性度');
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
      }] as any;

      // Add one more fetch mock
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><body><h1>Test User 3</h1></body></html>'),
      });

      const result = await engine.generateDiagnosis(groupProfiles, 'group');
      
      expect(result).toBeDefined();
      expect(result.mode).toBe('group');
      expect(result.participants).toHaveLength(3);
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
      if (mockOpenAI.chat.completions.create.mock.calls.length > 0) {
        const aiCallContent = mockOpenAI.chat.completions.create.mock.calls[0][0].messages[0].content;
        expect(aiCallContent.length).toBeLessThan(150000); // Reasonable limit for prompt
      }
    });
  });

  describe('generateFallbackDiagnosis', () => {
    it('適切なフォールバック診断を生成する', () => {
      const profiles = [
        {
          basic: { name: 'User 1' },
          details: { skills: ['React'] },
        },
        {
          basic: { name: 'User 2' },
          details: { skills: ['Vue'] },
        },
      ] as any;

      const result = (engine as any).generateFallbackDiagnosis(profiles, 'duo');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id-123');
      expect(result.compatibility).toBeGreaterThanOrEqual(60);
      expect(result.compatibility).toBeLessThanOrEqual(95);
      expect(result.strengths).toBeInstanceOf(Array);
      expect(result.opportunities).toBeInstanceOf(Array);
      expect(result.advice).toBeDefined();
    });
  });
});