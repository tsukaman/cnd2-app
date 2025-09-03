import { AstrologicalDiagnosisEngineV4 } from '../diagnosis-engine-v4-openai';
import { PrairieProfile } from '@/types';

// Test constants
const TEST_CONSTANTS = {
  OPENAI_API_KEY: 'test-api-key',
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_TEMPERATURE: 0.9,
  OPENAI_MAX_TOKENS: 2000,
} as const;

describe('AstrologicalDiagnosisEngineV4', () => {
  let engine: AstrologicalDiagnosisEngineV4;
  let originalFetch: typeof global.fetch;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    AstrologicalDiagnosisEngineV4.resetInstance();
    
    // Save original fetch
    originalFetch = global.fetch;
    
    // Set environment
    process.env.OPENAI_API_KEY = TEST_CONSTANTS.OPENAI_API_KEY;
  });
  
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    // Restore original fetch
    global.fetch = originalFetch;
  });
  
  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = AstrologicalDiagnosisEngineV4.getInstance();
      const instance2 = AstrologicalDiagnosisEngineV4.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('isConfigured', () => {
    it('returns true when API key is set', () => {
      const engine = AstrologicalDiagnosisEngineV4.getInstance();
      expect(engine.isConfigured()).toBe(true);
    });
    
    it('returns false when API key is not set', () => {
      delete process.env.OPENAI_API_KEY;
      const engine = AstrologicalDiagnosisEngineV4.getInstance();
      expect(engine.isConfigured()).toBe(false);
    });
  });
  
  describe('generateDuoDiagnosis', () => {
    const mockProfile1: PrairieProfile = {
      basic: {
        name: 'テストユーザー1',
        title: 'エンジニア',
        company: 'テック社',
        bio: 'クラウドネイティブエンジニア',
      },
      details: {
        tags: ['cloud'],
        skills: ['Kubernetes', 'Docker'],
        interests: ['DevOps'],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    };
    
    const mockProfile2: PrairieProfile = {
      basic: {
        name: 'テストユーザー2',
        title: 'デザイナー',
        company: 'デザイン社',
        bio: 'UXデザイナー',
      },
      details: {
        tags: ['design'],
        skills: ['Figma', 'Sketch'],
        interests: ['UI/UX'],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    };
    
    it('generates diagnosis with OpenAI when configured', async () => {
      const mockResponse = {
        type: '運命のCloud Nativeパートナー',
        compatibility: 92,
        summary: 'テストユーザー1さんとテストユーザー2さんの技術的な波動が共鳴しています。',
        astrologicalAnalysis: '二人のエンジニアリング・エナジーが美しく調和しています。',
        techStackCompatibility: 'お互いの技術スタックが素晴らしい相性を示しています。',
        conversationTopics: ['クラウドアーキテクチャ'],
        strengths: ['技術力', '創造性'],
        opportunities: ['協業の可能性'],
        advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
        luckyItem: '🎧 ノイズキャンセリングヘッドフォン',
        luckyAction: '🎯 一緒にハッカソンに参加する',
      };
      
      // Mock fetch for OpenAI API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse),
            },
          }],
          usage: {
            prompt_tokens: 500,
            completion_tokens: 300,
            total_tokens: 800,
          },
        }),
      } as Response);
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('運命のCloud Nativeパートナー');
      expect(result.compatibility).toBe(92);
      expect(result.summary).toBe('テストユーザー1さんとテストユーザー2さんの技術的な波動が共鳴しています。');
      expect(result.participants).toEqual([mockProfile1, mockProfile2]);
      expect(result.aiPowered).toBe(true);
      
      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_CONSTANTS.OPENAI_API_KEY}`,
          }),
        })
      );
    });
    
    it('falls back to rule-based diagnosis when not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      expect(result).toBeDefined();
      // The type varies based on compatibility score
      expect(result.type).toMatch(/運命のCloud Nativeパートナー|Container Orchestrationの調和|DevOps Journeyの同志/);
      expect(result.compatibility).toBeGreaterThanOrEqual(70);
      expect(result.compatibility).toBeLessThanOrEqual(100);
      expect(result.astrologicalAnalysis).toBeDefined();
      expect(result.aiPowered).toBe(false);
    });
    
    it('handles OpenAI API errors gracefully', async () => {
      // Mock fetch to reject
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      // Should fall back to rule-based
      expect(result).toBeDefined();
      expect(result.type).toMatch(/運命のCloud Nativeパートナー|Container Orchestrationの調和|DevOps Journeyの同志/);
      expect(result.astrologicalAnalysis).toBeDefined();
      expect(result.aiPowered).toBe(false);
    });
    
    it('handles invalid JSON response from OpenAI', async () => {
      // Mock fetch to return invalid JSON
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Invalid JSON',
            },
          }],
        }),
      } as Response);
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      // Should fall back to rule-based
      expect(result).toBeDefined();
      expect(result.type).toMatch(/運命のCloud Nativeパートナー|Container Orchestrationの調和|DevOps Journeyの同志/);
      expect(result.astrologicalAnalysis).toBeDefined();
      expect(result.aiPowered).toBe(false);
    });
  });
  
  describe('summarizeProfile', () => {
    it('summarizes profile within token limits', () => {
      const profile: PrairieProfile = {
        basic: {
          name: 'Long Name User',
          title: 'Very Long Title That Should Be Truncated',
          company: 'Very Long Company Name That Should Be Truncated As Well',
          bio: 'A'.repeat(300), // Very long bio
        },
        details: {
          tags: [],
          skills: Array(20).fill('skill'), // 20 skills
          interests: Array(10).fill('interest'), // 10 interests
          certifications: [],
          communities: [],
        },
        social: {},
        custom: {},
        meta: {},
      };
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      // プライベートメソッドのテスト
      const summary = (engine as unknown as {
        summarizeProfile: (profile: PrairieProfile) => {
          bio: string;
          skills: string[];
          interests: string[];
        };
      }).summarizeProfile(profile);
      
      expect(summary.bio.length).toBeLessThanOrEqual(200);
      expect(summary.skills.length).toBeLessThanOrEqual(10);
      expect(summary.interests.length).toBeLessThanOrEqual(5);
    });
  });
});