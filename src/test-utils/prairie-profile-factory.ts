import { PrairieProfile } from '@/types';

/**
 * Factory for creating PrairieProfile test data
 * Provides consistent test data with sensible defaults
 */
export class PrairieProfileFactory {
  /**
   * Create a minimal valid PrairieProfile
   */
  static createMinimal(overrides?: Partial<PrairieProfile>): PrairieProfile {
    return {
      basic: {
        name: 'Test User',
        title: 'Developer',
        company: 'Test Company',
        bio: 'Test bio',
        ...overrides?.basic,
      },
      details: {
        tags: [],
        skills: [],
        interests: [],
        certifications: [],
        communities: [],
        ...overrides?.details,
      },
      social: {
        ...overrides?.social,
      },
      custom: {
        ...overrides?.custom,
      },
      meta: {
        ...overrides?.meta,
      },
    };
  }

  /**
   * Create a complete PrairieProfile with all fields populated
   */
  static createComplete(overrides?: Partial<PrairieProfile>): PrairieProfile {
    return {
      basic: {
        name: '＿・）つかまん',
        title: 'フルスタックエンジニア',
        company: 'テック株式会社',
        bio: 'クラウドネイティブ技術に情熱を注ぐエンジニア',
        avatar: 'https://example.com/avatar.jpg',
        ...overrides?.basic,
      },
      details: {
        tags: ['cloud', 'native', 'kubernetes'],
        skills: ['Docker', 'Kubernetes', 'Go', 'TypeScript'],
        interests: ['DevOps', 'SRE', 'Platform Engineering'],
        certifications: ['CKA', 'AWS Solutions Architect'],
        communities: ['CNCF', 'Cloud Native Days'],
        motto: '継続的改善',
        ...overrides?.details,
      },
      social: {
        twitter: '@tsukaman',
        github: 'tsukaman',
        linkedin: 'tsukaman',
        ...overrides?.social,
      },
      custom: {
        favoriteTools: ['kubectl', 'terraform'],
        ...overrides?.custom,
      },
      meta: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-08-30T00:00:00Z',
        connectedBy: 'QR Code',
        hashtag: '#CloudNativeDays',
        ...overrides?.meta,
      },
    };
  }

  /**
   * Create a PrairieProfile for an engineer
   */
  static createEngineer(name: string = 'Test Engineer'): PrairieProfile {
    return {
      basic: {
        name,
        title: 'エンジニア',
        company: 'テック社',
        bio: 'クラウドネイティブエンジニア',
      },
      details: {
        tags: ['cloud', 'engineering'],
        skills: ['Kubernetes', 'Docker', 'Go'],
        interests: ['DevOps', 'Cloud Native'],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    };
  }

  /**
   * Create a PrairieProfile for a designer
   */
  static createDesigner(name: string = 'Test Designer'): PrairieProfile {
    return {
      basic: {
        name,
        title: 'デザイナー',
        company: 'デザイン社',
        bio: 'UXデザイナー',
      },
      details: {
        tags: ['design', 'ux'],
        skills: ['Figma', 'Sketch', 'Adobe XD'],
        interests: ['UI/UX', 'User Research'],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    };
  }

  /**
   * Create a PrairieProfile without required fields (for error testing)
   */
  static createInvalid(): Partial<PrairieProfile> {
    return {
      details: {
        skills: ['React'],
      },
      social: {},
      custom: {},
      meta: {},
    };
  }

  /**
   * Create a PrairieProfile without name (for error testing)
   */
  static createWithoutName(): PrairieProfile {
    return {
      basic: {
        title: 'Developer',
        company: 'Test Company',
        bio: 'Test bio',
      } as any, // Intentionally invalid
      details: {
        tags: [],
        skills: [],
        interests: [],
        certifications: [],
        communities: [],
      },
      social: {},
      custom: {},
      meta: {},
    };
  }

  /**
   * Create multiple PrairieProfiles for group testing
   */
  static createGroup(count: number = 3): PrairieProfile[] {
    const profiles: PrairieProfile[] = [];
    const roles = ['エンジニア', 'デザイナー', 'プロダクトマネージャー', 'データサイエンティスト'];
    const companies = ['テック社', 'スタートアップ社', 'メガベンチャー社', 'フリーランス'];
    
    for (let i = 0; i < count; i++) {
      profiles.push({
        basic: {
          name: `User ${i + 1}`,
          title: roles[i % roles.length],
          company: companies[i % companies.length],
          bio: `${roles[i % roles.length]}として活動中`,
        },
        details: {
          tags: [`tag${i + 1}`],
          skills: [`skill${i + 1}`],
          interests: [`interest${i + 1}`],
          certifications: [],
          communities: [],
        },
        social: {},
        custom: {},
        meta: {},
      });
    }
    
    return profiles;
  }
}