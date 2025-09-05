import { 
  isPrairieProfile, 
  convertToFullProfile, 
  convertProfilesToFullFormat,
  extractMinimalProfile 
} from '../profile-converter';
import type { PrairieProfile } from '@/types';

describe('profile-converter', () => {
  describe('isPrairieProfile', () => {
    it('should return true for valid PrairieProfile format', () => {
      const validProfile: PrairieProfile = {
        basic: {
          name: 'Test User',
          title: 'Developer',
          company: 'Test Company',
          bio: 'Test bio'
        },
        details: {
          tags: [],
          skills: [],
          interests: [],
          certifications: [],
          communities: [],
        },
        social: {},
        custom: {},
        meta: {
          sourceUrl: '',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      expect(isPrairieProfile(validProfile)).toBe(true);
    });

    it('should return false for minimal profile format', () => {
      const minimalProfile = {
        name: 'Test User',
        title: 'Developer',
        skills: ['JavaScript', 'TypeScript']
      };
      
      expect(isPrairieProfile(minimalProfile)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isPrairieProfile(null)).toBe(false);
      expect(isPrairieProfile(undefined)).toBe(false);
    });

    it('should return false for profiles without basic property', () => {
      const invalidProfile = {
        name: 'Test User',
        details: { skills: [] }
      };
      
      expect(isPrairieProfile(invalidProfile)).toBe(false);
    });

    it('should return false for profiles with null basic property', () => {
      const invalidProfile = {
        basic: null,
        details: { skills: [] }
      };
      
      expect(isPrairieProfile(invalidProfile)).toBe(false);
    });
  });

  describe('convertToFullProfile', () => {
    it('should return PrairieProfile unchanged if already in correct format', () => {
      const prairieProfile: PrairieProfile = {
        basic: {
          name: 'Test User',
          title: 'Developer',
          company: 'Test Company',
          bio: 'Test bio'
        },
        details: {
          tags: ['cloud'],
          skills: ['JavaScript'],
          interests: ['AI'],
          certifications: ['AWS'],
          communities: ['CNCF'],
          motto: 'Keep learning'
        },
        social: {
          twitter: '@test',
          github: 'testuser'
        },
        custom: { extra: 'data' },
        meta: {
          sourceUrl: 'https://example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          hashtag: '#test'
        }
      };
      
      const result = convertToFullProfile(prairieProfile);
      expect(result).toBe(prairieProfile); // Should be the same reference
    });

    it('should convert minimal profile to full format', () => {
      const minimalProfile = {
        name: 'Test User',
        title: 'Developer',
        company: 'Test Company',
        bio: 'Test bio',
        skills: ['JavaScript', 'TypeScript'],
        interests: ['Cloud', 'DevOps'],
        tags: ['tech'],
        certifications: ['AWS'],
        communities: ['CNCF'],
        motto: 'Always improving',
        twitter: '@test',
        github: 'testuser',
        website: 'https://example.com'
      };
      
      const result = convertToFullProfile(minimalProfile);
      
      expect(result.basic.name).toBe('Test User');
      expect(result.basic.title).toBe('Developer');
      expect(result.basic.company).toBe('Test Company');
      expect(result.basic.bio).toBe('Test bio');
      expect(result.details.skills).toEqual(['JavaScript', 'TypeScript']);
      expect(result.details.interests).toEqual(['Cloud', 'DevOps']);
      expect(result.details.tags).toEqual(['tech']);
      expect(result.details.certifications).toEqual(['AWS']);
      expect(result.details.communities).toEqual(['CNCF']);
      expect(result.details.motto).toBe('Always improving');
      expect(result.social.twitter).toBe('@test');
      expect(result.social.github).toBe('testuser');
      expect(result.social.website).toBe('https://example.com');
    });

    it('should handle empty minimal profile with defaults', () => {
      const emptyProfile = {};
      const result = convertToFullProfile(emptyProfile);
      
      expect(result.basic.name).toBe('名称未設定');
      expect(result.basic.title).toBe('');
      expect(result.basic.company).toBe('');
      expect(result.basic.bio).toBe('');
      expect(result.details.skills).toEqual([]);
      expect(result.details.interests).toEqual([]);
      expect(result.details.tags).toEqual([]);
      expect(result.social.twitter).toBeUndefined();
      expect(result.custom).toEqual({});
      expect(result.meta.sourceUrl).toBe('');
      expect(result.meta.createdAt).toBeDefined();
      expect(result.meta.updatedAt).toBeDefined();
    });

    it('should handle null profile with defaults', () => {
      const result = convertToFullProfile(null);
      
      expect(result.basic.name).toBe('名称未設定');
      expect(result.basic.title).toBe('');
      expect(result.details.skills).toEqual([]);
    });

    it('should handle undefined profile with defaults', () => {
      const result = convertToFullProfile(undefined);
      
      expect(result.basic.name).toBe('名称未設定');
      expect(result.basic.title).toBe('');
      expect(result.details.skills).toEqual([]);
    });

    it('should preserve custom fields', () => {
      const profileWithCustom = {
        name: 'Test User',
        custom: {
          field1: 'value1',
          field2: { nested: 'value' }
        }
      };
      
      const result = convertToFullProfile(profileWithCustom);
      expect(result.custom).toEqual({
        field1: 'value1',
        field2: { nested: 'value' }
      });
    });

    it('should preserve meta fields from minimal profile', () => {
      const profileWithMeta = {
        name: 'Test User',
        sourceUrl: 'https://example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        connectedBy: 'Test App',
        hashtag: '#test',
        isPartialData: true
      };
      
      const result = convertToFullProfile(profileWithMeta);
      expect(result.meta.sourceUrl).toBe('https://example.com');
      expect(result.meta.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result.meta.updatedAt).toBe('2024-01-02T00:00:00Z');
      expect(result.meta.connectedBy).toBe('Test App');
      expect(result.meta.hashtag).toBe('#test');
      expect(result.meta.isPartialData).toBe(true);
    });
  });

  describe('convertProfilesToFullFormat', () => {
    it('should convert array of profiles', () => {
      const profiles = [
        { name: 'User 1', title: 'Dev 1' },
        { name: 'User 2', title: 'Dev 2' }
      ];
      
      const results = convertProfilesToFullFormat(profiles);
      
      expect(results).toHaveLength(2);
      expect(results[0].basic.name).toBe('User 1');
      expect(results[0].basic.title).toBe('Dev 1');
      expect(results[1].basic.name).toBe('User 2');
      expect(results[1].basic.title).toBe('Dev 2');
    });

    it('should handle empty array', () => {
      const results = convertProfilesToFullFormat([]);
      expect(results).toEqual([]);
    });

    it('should handle non-array input', () => {
      const results = convertProfilesToFullFormat(null as any);
      expect(results).toEqual([]);
    });

    it('should handle undefined input', () => {
      const results = convertProfilesToFullFormat(undefined as any);
      expect(results).toEqual([]);
    });

    it('should handle mixed profile formats', () => {
      const prairieProfile: PrairieProfile = {
        basic: {
          name: 'Prairie User',
          title: 'Developer',
          company: 'Company',
          bio: 'Bio'
        },
        details: {
          tags: [],
          skills: [],
          interests: [],
          certifications: [],
          communities: []
        },
        social: {},
        custom: {},
        meta: {
          sourceUrl: '',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      const profiles = [
        prairieProfile,
        { name: 'Minimal User', title: 'Designer' }
      ];
      
      const results = convertProfilesToFullFormat(profiles);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBe(prairieProfile); // Should be same reference
      expect(results[1].basic.name).toBe('Minimal User');
      expect(results[1].basic.title).toBe('Designer');
    });
  });

  describe('extractMinimalProfile', () => {
    it('should extract minimal info from PrairieProfile', () => {
      const prairieProfile: PrairieProfile = {
        basic: {
          name: 'Test User',
          title: 'Senior Developer',
          company: 'Tech Company',
          bio: 'Experienced developer'
        },
        details: {
          tags: ['cloud', 'devops'],
          skills: ['JavaScript', 'Python', 'Go'],
          interests: ['AI', 'ML', 'Cloud'],
          certifications: ['AWS', 'GCP'],
          communities: ['CNCF', 'OpenSource']
        },
        social: {
          twitter: '@test',
          github: 'testuser'
        },
        custom: {},
        meta: {
          sourceUrl: '',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      const result = extractMinimalProfile(prairieProfile);
      
      expect(result).toEqual({
        name: 'Test User',
        title: 'Senior Developer',
        company: 'Tech Company',
        bio: 'Experienced developer',
        skills: ['JavaScript', 'Python', 'Go'],
        interests: ['AI', 'ML', 'Cloud']
      });
    });

    it('should extract minimal info from minimal profile', () => {
      const minimalProfile = {
        name: 'Test User',
        title: 'Developer',
        company: 'Company',
        bio: 'Bio text',
        skills: ['JS', 'TS'],
        interests: ['Web']
      };
      
      const result = extractMinimalProfile(minimalProfile);
      
      expect(result).toEqual({
        name: 'Test User',
        title: 'Developer',
        company: 'Company',
        bio: 'Bio text',
        skills: ['JS', 'TS'],
        interests: ['Web']
      });
    });

    it('should handle profile without optional fields', () => {
      const profile = {
        name: 'Test User'
      };
      
      const result = extractMinimalProfile(profile);
      
      expect(result).toEqual({
        name: 'Test User',
        title: undefined,
        company: undefined,
        bio: undefined,
        skills: [],
        interests: []
      });
    });

    it('should handle null profile with defaults', () => {
      const result = extractMinimalProfile(null);
      
      expect(result).toEqual({
        name: '名称未設定',
        title: undefined,
        company: undefined,
        bio: undefined,
        skills: [],
        interests: []
      });
    });

    it('should handle undefined profile with defaults', () => {
      const result = extractMinimalProfile(undefined);
      
      expect(result).toEqual({
        name: '名称未設定',
        title: undefined,
        company: undefined,
        bio: undefined,
        skills: [],
        interests: []
      });
    });

    it('should handle PrairieProfile with empty arrays', () => {
      const prairieProfile: PrairieProfile = {
        basic: {
          name: 'Test User',
          title: '',
          company: '',
          bio: ''
        },
        details: {
          tags: [],
          skills: [],
          interests: [],
          certifications: [],
          communities: []
        },
        social: {},
        custom: {},
        meta: {
          sourceUrl: '',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };
      
      const result = extractMinimalProfile(prairieProfile);
      
      expect(result).toEqual({
        name: 'Test User',
        title: '',
        company: '',
        bio: '',
        skills: [],
        interests: []
      });
    });
  });
});