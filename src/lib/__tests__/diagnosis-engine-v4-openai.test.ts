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
        username: 'エンジニア',
        bio: 'クラウドネイティブエンジニア',
      },
      metrics: {
        followers: 100,
        following: 50,
        tweets: 200,
        listed: 5,
      },
      details: {
        topics: ['cloud', 'Kubernetes', 'Docker'],
        hashtags: ['DevOps'],
        recentTweets: [],
        mentionedUsers: [],
      },
      social: {},
      custom: {},
      meta: {},
    };
    
    const mockProfile2: PrairieProfile = {
      basic: {
        name: 'テストユーザー2',
        username: 'デザイナー',
        bio: 'UXデザイナー',
      },
      metrics: {
        followers: 200,
        following: 100,
        tweets: 300,
        listed: 10,
      },
      details: {
        topics: ['design', 'Figma', 'Sketch'],
        hashtags: ['UI/UX'],
        recentTweets: [],
        mentionedUsers: [],
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
          username: 'Very Long Title That Should Be Truncated',
          bio: 'A'.repeat(300), // Very long bio
        },
        metrics: {
          followers: 1000,
          following: 500,
          tweets: 2000,
          listed: 10,
        },
        details: {
          topics: Array(20).fill('topic'), // 20 topics
          hashtags: Array(10).fill('#hashtag'), // 10 hashtags
          recentTweets: [],
          mentionedUsers: [],
        },
        analysis: {
          techStack: Array(10).fill('tech'), // 10 tech items
          interests: Array(10).fill('interest'), // 10 interests
        },
        social: {},
        custom: {},
        meta: {},
      };

      engine = AstrologicalDiagnosisEngineV4.getInstance();
      // プライベートメソッドのテスト
      const summary = (engine as unknown as {
        summarizeProfile: (profile: PrairieProfile) => {
          name: string;
          username: string;
          bio: string;
          location: string;
          topics: string[];
          hashtags: string[];
          techStack: string[];
          interests: string[];
        };
      }).summarizeProfile(profile);

      expect(summary.bio.length).toBeLessThanOrEqual(200);
      expect(summary.topics.length).toBeLessThanOrEqual(10);
      expect(summary.hashtags.length).toBeLessThanOrEqual(5);
      expect(summary.techStack.length).toBeLessThanOrEqual(5);
      expect(summary.interests.length).toBeLessThanOrEqual(5);
    });
  });
});