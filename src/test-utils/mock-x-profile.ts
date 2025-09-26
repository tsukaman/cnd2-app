import { XProfile, PrairieProfile } from '@/types';

/**
 * Create a mock X profile for testing
 */
export function createMockXProfile(name: string, overrides?: Partial<XProfile>): XProfile {
  const baseProfile: XProfile = {
    basic: {
      username: name.toLowerCase().replace(/\s+/g, '_'),
      name: name,
      bio: `Bio for ${name}`,
      location: 'Tokyo, Japan',
      website: `https://example.com/${name.toLowerCase()}`,
      avatar: `https://avatar.example.com/${name.toLowerCase()}`,
      verified: false,
      protected: false,
      createdAt: '2020-01-01T00:00:00Z'
    },
    metrics: {
      followers: 1000,
      following: 500,
      tweets: 2500,
      listed: 50
    },
    details: {
      recentTweets: [
        {
          id: '1',
          text: `Recent tweet by ${name}`,
          createdAt: new Date().toISOString(),
          metrics: { likes: 10, retweets: 5, replies: 2 }
        }
      ],
      topics: ['technology', 'coding'],
      hashtags: ['#tech', '#dev'],
      mentionedUsers: ['github', 'twitter'],
      languages: ['en', 'ja'],
      activeHours: [9, 10, 11, 14, 15, 16]
    },
    analysis: {
      techStack: ['JavaScript', 'TypeScript'],
      interests: ['Web Development', 'Cloud'],
      personality: 'Technical collaborator'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  };

  // Apply overrides
  if (overrides) {
    return {
      ...baseProfile,
      ...overrides,
      basic: { ...baseProfile.basic, ...overrides.basic },
      metrics: { ...baseProfile.metrics, ...overrides.metrics },
      details: { ...baseProfile.details, ...overrides.details },
      analysis: { ...baseProfile.analysis, ...overrides.analysis },
      metadata: { ...baseProfile.metadata, ...overrides.metadata }
    };
  }

  return baseProfile;
}

/**
 * Create a mock Prairie profile for testing (extends XProfile)
 */
export function createMockPrairieProfile(name: string, overrides?: Partial<PrairieProfile>): PrairieProfile {
  const xProfile = createMockXProfile(name);

  const prairieProfile: PrairieProfile = {
    ...xProfile,
    social: {
      twitter: `https://twitter.com/${name.toLowerCase()}`,
      github: `https://github.com/${name.toLowerCase()}`,
      website: xProfile.basic.website
    },
    custom: {},
    meta: {
      createdAt: xProfile.metadata?.fetchedAt,
      sourceUrl: `https://prairie.cards/u/${name.toLowerCase()}`,
      hashtag: '#CloudNativeDays',
      isPartialData: false
    }
  };

  // Apply overrides
  if (overrides) {
    return {
      ...prairieProfile,
      ...overrides,
      basic: { ...prairieProfile.basic, ...overrides.basic },
      metrics: { ...prairieProfile.metrics, ...overrides.metrics },
      details: { ...prairieProfile.details, ...overrides.details },
      analysis: { ...prairieProfile.analysis, ...overrides.analysis },
      metadata: { ...prairieProfile.metadata, ...overrides.metadata },
      social: { ...prairieProfile.social, ...overrides.social },
      custom: { ...prairieProfile.custom, ...overrides.custom },
      meta: { ...prairieProfile.meta, ...overrides.meta }
    };
  }

  return prairieProfile;
}