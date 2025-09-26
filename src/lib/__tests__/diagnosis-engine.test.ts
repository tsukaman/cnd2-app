/**
 * @jest-environment node
 */

import { DiagnosisEngine } from '@/lib/diagnosis-engine';
import { PrairieProfile } from '@/types';

describe('diagnosis-engine', () => {
  let engine: DiagnosisEngine;

  const mockProfile1: PrairieProfile = {
    basic: {
      name: 'Test User 1',
      username: 'Backend Engineer',
      bio: 'Love Kubernetes',
    },
    details: {
      topics: ['#kubernetes', '#go', 'Kubernetes', 'Go', 'Docker'],
      hashtags: ['Cloud Native', 'DevOps'],
    },
    social: {
      twitter: 'test1',
      github: 'test1',
    },
    custom: {},
    meta: {},
  };

  const mockProfile2: PrairieProfile = {
    basic: {
      name: 'Test User 2',
      username: 'Frontend Engineer',
      bio: 'React enthusiast',
    },
    details: {
      topics: ['#react', '#typescript', 'React', 'TypeScript', 'Next.js'],
      hashtags: ['Web Performance', 'UX'],
    },
    social: {
      twitter: 'test2',
      github: 'test2',
    },
    custom: {},
    meta: {},
  };

  beforeEach(() => {
    engine = DiagnosisEngine.getInstance();
  });

  describe('DiagnosisEngine.getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = DiagnosisEngine.getInstance();
      const instance2 = DiagnosisEngine.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('DiagnosisEngine.isConfigured', () => {
    it('returns false when OpenAI API key is not set', () => {
      // In test environment, API key should not be configured
      expect(engine.isConfigured()).toBe(false);
    });
  });

  describe('DiagnosisEngine.generateDuoDiagnosis', () => {
    it('returns mock diagnosis when not configured', async () => {
      const result = await engine.generateDuoDiagnosis([mockProfile1, mockProfile2]);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('mode', 'duo');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('compatibility');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('participants');
      expect(result).toHaveProperty('createdAt');
      
      expect(result.participants).toHaveLength(2);
      expect(typeof result.createdAt).toBe('string');
    });

    it('generates compatibility score between 70 and 99', async () => {
      const result = await engine.generateDuoDiagnosis([mockProfile1, mockProfile2]);
      
      expect(result.compatibility).toBeGreaterThanOrEqual(70);
      expect(result.compatibility).toBeLessThanOrEqual(99);
    });

    it('includes legacy fields for backward compatibility', async () => {
      const result = await engine.generateDuoDiagnosis([mockProfile1, mockProfile2]);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('conversationStarters');
      expect(result).toHaveProperty('hiddenGems');
    });

    it('generates unique IDs for each diagnosis', async () => {
      const result1 = await engine.generateDuoDiagnosis([mockProfile1, mockProfile2]);
      const result2 = await engine.generateDuoDiagnosis([mockProfile1, mockProfile2]);
      
      expect(result1.id).not.toBe(result2.id);
    });

    it('includes all participants in result', async () => {
      const result = await engine.generateDuoDiagnosis([mockProfile1, mockProfile2]);
      
      expect(result.participants[0].basic.name).toBe(mockProfile1.basic.name);
      expect(result.participants[1].basic.name).toBe(mockProfile2.basic.name);
    });
  });

  describe('DiagnosisEngine.generateGroupDiagnosis', () => {
    it('returns mock group diagnosis when not configured', async () => {
      const profiles = [
        mockProfile1,
        mockProfile2,
        { ...mockProfile1, basic: { ...mockProfile1.basic, name: 'Test User 3' } },
      ];
      const result = await engine.generateGroupDiagnosis(profiles);
      
      expect(result.mode).toBe('group');
      expect(result.participants).toHaveLength(3);
      expect(result.type).toMatch(/型$/); // Should end with '型'
      expect(result.compatibility).toBeGreaterThanOrEqual(75);
      expect(result.compatibility).toBeLessThanOrEqual(99);
    });

    it('generates appropriate summary for group size', async () => {
      const profiles = [mockProfile1, mockProfile2, mockProfile1, mockProfile2];
      const result = await engine.generateGroupDiagnosis(profiles);
      
      expect(result.summary).toContain('4人');
      expect(result.message).toContain('4人');
      expect(result.message).toContain('4² = 16');
    });


  });
});