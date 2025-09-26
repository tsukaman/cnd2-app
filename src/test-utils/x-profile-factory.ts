import { XProfile } from '@/types';

/**
 * Factory for creating XProfile test data
 * Provides consistent test data with sensible defaults
 */
export class XProfileFactory {
  /**
   * Create a minimal valid XProfile
   */
  static createMinimal(overrides?: Partial<XProfile>): XProfile {
    return {
      basic: {
        id: '123456789',
        username: 'testuser',
        name: 'Test User',
        bio: 'Test bio',
        location: 'Tokyo, Japan',
        website: 'https://example.com',
        avatar: 'https://example.com/avatar.jpg',
        verified: false,
        protected: false,
        createdAt: '2020-01-01T00:00:00.000Z',
        ...overrides?.basic,
      },
      metrics: {
        followers: 1000,
        following: 500,
        tweets: 2000,
        listed: 10,
        ...overrides?.metrics,
      },
      details: {
        recentTweets: [],
        topics: [],
        hashtags: [],
        mentionedUsers: [],
        languages: ['ja', 'en'],
        activeHours: [9, 10, 11],
        ...overrides?.details,
      },
      analysis: {
        techStack: [],
        interests: [],
        personality: 'Default personality',
        ...overrides?.analysis,
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        cacheAge: 3600,
        embedAvailable: true,
        scrapingAvailable: true,
        ...overrides?.metadata,
      },
    };
  }

  /**
   * Create a developer profile
   */
  static createDeveloper(name = 'Developer'): XProfile {
    return {
      basic: {
        id: '123456789',
        username: name.toLowerCase().replace(/\s/g, '_'),
        name,
        bio: 'Full Stack Developer | React, TypeScript, Node.js',
        location: 'Tokyo, Japan',
        website: 'https://github.com/' + name.toLowerCase(),
        avatar: 'https://example.com/avatar-dev.jpg',
        verified: true,
        protected: false,
        createdAt: '2019-01-01T00:00:00.000Z',
      },
      metrics: {
        followers: 5000,
        following: 300,
        tweets: 10000,
        listed: 50,
      },
      details: {
        recentTweets: [
          {
            id: 'tweet_1',
            text: 'Just shipped a new feature using Next.js and TypeScript!',
            createdAt: new Date().toISOString(),
            metrics: { likes: 100, retweets: 20, replies: 5 }
          }
        ],
        topics: ['react', 'typescript', 'nodejs', 'webdev'],
        hashtags: ['#react', '#typescript', '#coding'],
        mentionedUsers: ['vercel', 'reactjs'],
        languages: ['en', 'ja'],
        activeHours: [9, 10, 11, 14, 15, 16],
      },
      analysis: {
        techStack: ['React', 'TypeScript', 'Node.js', 'Next.js'],
        interests: ['web development', 'open source', 'cloud native'],
        personality: 'Technical innovator with deep expertise',
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        cacheAge: 3600,
        embedAvailable: true,
        scrapingAvailable: true,
      },
    };
  }

  /**
   * Create a designer profile
   */
  static createDesigner(name = 'Designer'): XProfile {
    return {
      basic: {
        id: '987654321',
        username: name.toLowerCase().replace(/\s/g, '_'),
        name,
        bio: 'UI/UX Designer | Figma, Design Systems, User Research',
        location: 'Osaka, Japan',
        website: 'https://dribbble.com/' + name.toLowerCase(),
        avatar: 'https://example.com/avatar-design.jpg',
        verified: false,
        protected: false,
        createdAt: '2018-06-01T00:00:00.000Z',
      },
      metrics: {
        followers: 3000,
        following: 800,
        tweets: 5000,
        listed: 30,
      },
      details: {
        recentTweets: [
          {
            id: 'tweet_1',
            text: 'New design system components released! Check them out.',
            createdAt: new Date().toISOString(),
            metrics: { likes: 200, retweets: 50, replies: 10 }
          }
        ],
        topics: ['design', 'ux', 'ui', 'figma'],
        hashtags: ['#design', '#ux', '#figma'],
        mentionedUsers: ['figma', 'dribbble'],
        languages: ['ja'],
        activeHours: [10, 11, 14, 15, 16],
      },
      analysis: {
        techStack: ['Figma', 'Sketch', 'Adobe XD'],
        interests: ['user experience', 'design systems', 'accessibility'],
        personality: 'Creative visionary with attention to detail',
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        cacheAge: 3600,
        embedAvailable: true,
        scrapingAvailable: true,
      },
    };
  }

  /**
   * Create a tech lead profile
   */
  static createTechLead(name = 'Tech Lead'): XProfile {
    return {
      basic: {
        id: '555666777',
        username: name.toLowerCase().replace(/\s/g, '_'),
        name,
        bio: 'Tech Lead | Architecture, Team Building, Cloud Native',
        location: 'San Francisco, CA',
        website: 'https://linkedin.com/in/' + name.toLowerCase(),
        avatar: 'https://example.com/avatar-lead.jpg',
        verified: true,
        protected: false,
        createdAt: '2015-03-01T00:00:00.000Z',
      },
      metrics: {
        followers: 15000,
        following: 1000,
        tweets: 20000,
        listed: 200,
      },
      details: {
        recentTweets: [
          {
            id: 'tweet_1',
            text: 'Great article on microservices architecture patterns',
            createdAt: new Date().toISOString(),
            metrics: { likes: 500, retweets: 100, replies: 20 }
          }
        ],
        topics: ['architecture', 'leadership', 'cloud', 'kubernetes'],
        hashtags: ['#cloudnative', '#kubernetes', '#devops'],
        mentionedUsers: ['kubernetes', 'cncf', 'docker'],
        languages: ['en'],
        activeHours: [8, 9, 10, 11, 14, 15, 16, 17],
      },
      analysis: {
        techStack: ['Kubernetes', 'Docker', 'AWS', 'Go', 'Python'],
        interests: ['distributed systems', 'team leadership', 'architecture'],
        personality: 'Strategic leader with deep technical knowledge',
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        cacheAge: 3600,
        embedAvailable: true,
        scrapingAvailable: true,
      },
    };
  }

  /**
   * Create a data scientist profile
   */
  static createDataScientist(name = 'Data Scientist'): XProfile {
    return {
      basic: {
        id: '111222333',
        username: name.toLowerCase().replace(/\s/g, '_'),
        name,
        bio: 'Data Scientist | Machine Learning, Python, Statistics',
        location: 'Remote',
        website: 'https://kaggle.com/' + name.toLowerCase(),
        avatar: 'https://example.com/avatar-data.jpg',
        verified: false,
        protected: false,
        createdAt: '2017-09-01T00:00:00.000Z',
      },
      metrics: {
        followers: 8000,
        following: 600,
        tweets: 12000,
        listed: 80,
      },
      details: {
        recentTweets: [
          {
            id: 'tweet_1',
            text: 'Interesting findings from our latest ML model performance analysis',
            createdAt: new Date().toISOString(),
            metrics: { likes: 300, retweets: 60, replies: 15 }
          }
        ],
        topics: ['machinelearning', 'datascience', 'python', 'ai'],
        hashtags: ['#ml', '#datascience', '#python'],
        mentionedUsers: ['pytorch', 'tensorflow', 'huggingface'],
        languages: ['en', 'ja'],
        activeHours: [10, 11, 12, 15, 16, 17],
      },
      analysis: {
        techStack: ['Python', 'PyTorch', 'TensorFlow', 'Pandas', 'Scikit-learn'],
        interests: ['machine learning', 'data analysis', 'statistics'],
        personality: 'Analytical thinker with research mindset',
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        cacheAge: 3600,
        embedAvailable: true,
        scrapingAvailable: true,
      },
    };
  }

  /**
   * Create multiple profiles for testing
   */
  static createMultiple(count: number): XProfile[] {
    const creators = [
      this.createDeveloper,
      this.createDesigner,
      this.createTechLead,
      this.createDataScientist,
    ];

    return Array.from({ length: count }, (_, i) => {
      const creator = creators[i % creators.length];
      return creator(`User ${i + 1}`);
    });
  }
}