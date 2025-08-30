import { AstrologicalDiagnosisEngineV4 } from '../diagnosis-engine-v4-openai';
import OpenAI from 'openai';
import { PrairieProfile } from '@/types';

// Mock OpenAI
jest.mock('openai');

describe('AstrologicalDiagnosisEngineV4', () => {
  let engine: AstrologicalDiagnosisEngineV4;
  let mockOpenAI: jest.Mocked<OpenAI>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (AstrologicalDiagnosisEngineV4 as any).instance = undefined;
    
    // Setup OpenAI mock
    const mockCreate = jest.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any;
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
    
    // Set environment
    process.env.OPENAI_API_KEY = 'test-api-key';
  });
  
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
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
        astrologicalSign: '♈ 牡羊座',
        energyFlow: '火のエレメント',
        cosmicAlignment: '新月のエネルギー',
        soulConnection: '深い魂の共鳴',
        techStackCompatibility: {
          harmony: ['コンテナ技術'],
          challenges: ['フロントエンド'],
          opportunities: ['DevOps文化'],
        },
        conversationTopics: ['クラウドアーキテクチャ'],
        compatibility: 92,
        strengths: ['技術力', '創造性'],
        opportunities: ['協業の可能性'],
        luckyItem: 'キーボード',
        luckyAction: 'ペアプログラミング',
      };
      
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse),
          },
        }],
      });
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('占星術的クラウドネイティブ診断');
      expect(result.astrologicalAnalysis).toEqual(mockResponse);
      expect(result.compatibility).toBe(92);
      expect(result.names).toEqual(['テストユーザー1', 'テストユーザー2']);
      
      // Verify OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.9,
          max_tokens: 2000,
        })
      );
    });
    
    it('falls back to rule-based diagnosis when not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('占星術的クラウドネイティブ診断');
      expect(result.astrologicalAnalysis).toBeDefined();
      expect(result.astrologicalAnalysis?.astrologicalSign).toMatch(/♈|♉|♊|♋|♌|♍|♎|♏|♐|♑|♒|♓/);
      
      // Verify OpenAI was not called
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });
    
    it('handles OpenAI API errors gracefully', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      // Should fall back to rule-based
      expect(result).toBeDefined();
      expect(result.type).toBe('占星術的クラウドネイティブ診断');
      expect(result.astrologicalAnalysis).toBeDefined();
    });
    
    it('handles invalid JSON response from OpenAI', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON',
          },
        }],
      });
      
      engine = AstrologicalDiagnosisEngineV4.getInstance();
      const result = await engine.generateDuoDiagnosis(mockProfile1, mockProfile2);
      
      // Should fall back to rule-based
      expect(result).toBeDefined();
      expect(result.type).toBe('占星術的クラウドネイティブ診断');
      expect(result.astrologicalAnalysis).toBeDefined();
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
      const summary = (engine as any).summarizeProfile(profile);
      
      expect(summary.bio.length).toBeLessThanOrEqual(200);
      expect(summary.skills.length).toBeLessThanOrEqual(10);
      expect(summary.interests.length).toBeLessThanOrEqual(5);
    });
  });
});