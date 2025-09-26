import { XProfile } from '@/types';

const sampleProfiles: Record<string, XProfile> = {
  elonmusk: {
    basic: {
      id: '44196397',
      username: 'elonmusk',
      name: 'Elon Musk',
      bio: '🚀 SpaceX • 🚗 Tesla • 🧠 Neuralink • 🚇 The Boring Company',
      location: 'Mars & Earth',
      website: 'https://tesla.com',
      avatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg',
      banner: 'https://pbs.twimg.com/profile_banners/44196397/1690621312/1500x500',
      verified: true,
      protected: false,
      createdAt: '2009-06-02T20:12:29.000Z'
    },
    metrics: {
      followers: 150000000,
      following: 500,
      tweets: 30000,
      listed: 100000
    },
    details: {
      recentTweets: [
        {
          id: 'tweet_1',
          text: 'Working on making Starship fully reusable. This is the key to making life multiplanetary.',
          createdAt: new Date().toISOString(),
          metrics: { likes: 250000, retweets: 50000, replies: 10000 }
        },
        {
          id: 'tweet_2',
          text: 'FSD Beta v12 is mind-blowing. The car drives itself with just cameras and neural nets.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metrics: { likes: 180000, retweets: 30000, replies: 8000 }
        },
        {
          id: 'tweet_3',
          text: 'AI development is accelerating. We need to ensure it benefits humanity.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metrics: { likes: 200000, retweets: 40000, replies: 15000 }
        }
      ],
      topics: ['space', 'ai', 'tesla', 'neural networks', 'rockets', 'electric vehicles'],
      hashtags: ['#spacex', '#tesla', '#ai', '#mars', '#neuralink'],
      mentionedUsers: ['SpaceX', 'Tesla', 'neuralink'],
      languages: ['en'],
      activeHours: [8, 9, 10, 14, 15, 16, 20, 21, 22]
    },
    analysis: {
      techStack: ['AI', 'Neural Networks', 'Robotics', 'Space Technology'],
      interests: ['space exploration', 'artificial intelligence', 'sustainable energy', 'neural interfaces'],
      personality: 'Visionary innovator - 革新的なビジョンを追求'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  },

  naval: {
    basic: {
      id: '745273',
      username: 'naval',
      name: 'Naval',
      bio: '📚 How to Get Rich (without getting lucky) • Angel investor • Philosopher',
      location: 'Silicon Valley',
      website: 'https://nav.al',
      avatar: 'https://pbs.twimg.com/profile_images/1256841238298292232/ycqwaMI2_400x400.jpg',
      verified: true,
      protected: false,
      createdAt: '2007-02-20T06:35:41.000Z'
    },
    metrics: {
      followers: 2000000,
      following: 100,
      tweets: 40000,
      listed: 20000
    },
    details: {
      recentTweets: [
        {
          id: 'tweet_1',
          text: 'Code and media are permissionless leverage. They are the leverage of the new rich.',
          createdAt: new Date().toISOString(),
          metrics: { likes: 50000, retweets: 10000, replies: 2000 }
        },
        {
          id: 'tweet_2',
          text: 'Learn to sell. Learn to build. If you can do both, you will be unstoppable.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metrics: { likes: 45000, retweets: 8000, replies: 1500 }
        },
        {
          id: 'tweet_3',
          text: 'The Internet has massively broadened career possibilities. Most people haven\'t figured this out yet.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metrics: { likes: 40000, retweets: 7000, replies: 1000 }
        }
      ],
      topics: ['startups', 'investing', 'philosophy', 'cryptocurrency', 'wealth', 'leverage'],
      hashtags: ['#startup', '#wealth', '#philosophy', '#crypto', '#defi'],
      mentionedUsers: ['balajis', 'cdixon', 'pmarca'],
      languages: ['en'],
      activeHours: [7, 8, 9, 15, 16, 17, 21, 22]
    },
    analysis: {
      techStack: ['Blockchain', 'DeFi', 'Web3', 'Startups'],
      interests: ['wealth creation', 'philosophy', 'startups', 'cryptocurrency', 'meditation'],
      personality: 'Knowledge sharer - 知識の共有と教育に熱心'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  },

  paul_graham: {
    basic: {
      id: '183749519',
      username: 'paulg',
      name: 'Paul Graham',
      bio: '👨‍💻 Y Combinator co-founder • 📝 Essays on startups and technology',
      location: 'England',
      website: 'http://paulgraham.com',
      avatar: 'https://pbs.twimg.com/profile_images/1824002576/pg-railsconf_400x400.jpg',
      verified: true,
      protected: false,
      createdAt: '2011-09-02T18:43:15.000Z'
    },
    metrics: {
      followers: 1500000,
      following: 200,
      tweets: 15000,
      listed: 15000
    },
    details: {
      recentTweets: [
        {
          id: 'tweet_1',
          text: 'The best startup ideas seem like bad ideas at first. If they were obviously good, someone would already be doing them.',
          createdAt: new Date().toISOString(),
          metrics: { likes: 30000, retweets: 5000, replies: 1000 }
        },
        {
          id: 'tweet_2',
          text: 'Startups are not just about technology. They are about solving problems that people actually have.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metrics: { likes: 25000, retweets: 4000, replies: 800 }
        },
        {
          id: 'tweet_3',
          text: 'The most successful founders are the ones who can think independently and question conventional wisdom.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metrics: { likes: 28000, retweets: 4500, replies: 900 }
        }
      ],
      topics: ['startups', 'ycombinator', 'essays', 'lisp', 'programming', 'founders'],
      hashtags: ['#startups', '#ycombinator', '#founders', '#essays'],
      mentionedUsers: ['ycombinator', 'sama', 'jessica'],
      languages: ['en'],
      activeHours: [9, 10, 11, 14, 15, 16, 17]
    },
    analysis: {
      techStack: ['Lisp', 'Startups', 'Web Development'],
      interests: ['startups', 'essays', 'art', 'programming languages', 'education'],
      personality: 'Educational mentor - 教育的メンターシップを重視'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  },

  // Japanese tech influencers
  hidetaka_ko: {
    basic: {
      id: '123456789',
      username: 'hidetaka_ko',
      name: '小林 秀峰',
      bio: '🔧 元Google エンジニア • 💻 OSS コントリビューター • Kubernetes, Go, Cloud Native',
      location: '東京, 日本',
      website: 'https://github.com/hidetaka',
      avatar: 'https://pbs.twimg.com/profile_images/sample_400x400.jpg',
      verified: false,
      protected: false,
      createdAt: '2010-03-15T09:00:00.000Z'
    },
    metrics: {
      followers: 50000,
      following: 800,
      tweets: 20000,
      listed: 500
    },
    details: {
      recentTweets: [
        {
          id: 'tweet_1',
          text: 'Kubernetes 1.29 の新機能について解説記事を書きました。ValidatingAdmissionPolicyがGAになったのは大きいですね。',
          createdAt: new Date().toISOString(),
          metrics: { likes: 500, retweets: 100, replies: 30 }
        },
        {
          id: 'tweet_2',
          text: 'Go 1.22でrange over intが導入されて、for i := range 10 と書けるようになりました。地味だけど便利。',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metrics: { likes: 800, retweets: 150, replies: 50 }
        },
        {
          id: 'tweet_3',
          text: 'CloudNative Days Winter 2025 楽しみですね！発表内容を準備中です。#CNDw2025',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metrics: { likes: 300, retweets: 50, replies: 20 }
        }
      ],
      topics: ['kubernetes', 'golang', 'cloud-native', 'docker', 'microservices', 'devops'],
      hashtags: ['#kubernetes', '#golang', '#cloudnative', '#cndw2025'],
      mentionedUsers: ['kubernetes', 'golang', 'cloudnativedays'],
      languages: ['ja', 'en'],
      activeHours: [9, 10, 11, 13, 14, 15, 19, 20, 21]
    },
    analysis: {
      techStack: ['Kubernetes', 'Go', 'Docker', 'GCP', 'Prometheus'],
      interests: ['cloud native', 'distributed systems', 'open source', 'developer tools'],
      personality: 'Technical specialist - 技術的な深掘りを好む'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    }
  }
};

/**
 * Get a sample X profile for development/testing
 * @param username - X username (without @)
 * @returns Sample X profile or null
 */
export function getSampleXProfile(username: string): XProfile | null {
  const cleanUsername = username.toLowerCase().replace(/^@/, '');

  // Check exact match
  if (sampleProfiles[cleanUsername]) {
    return sampleProfiles[cleanUsername];
  }

  // Check partial match for common test usernames
  const testUsernames = ['test', 'demo', 'sample', 'example'];
  if (testUsernames.some(test => cleanUsername.includes(test))) {
    // Return a random sample profile
    const keys = Object.keys(sampleProfiles);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
      ...sampleProfiles[randomKey],
      basic: {
        ...sampleProfiles[randomKey].basic,
        username: cleanUsername,
        name: `Test User (${cleanUsername})`
      }
    };
  }

  return null;
}

/**
 * Get all sample profile usernames
 * @returns Array of sample usernames
 */
export function getSampleUsernames(): string[] {
  return Object.keys(sampleProfiles);
}