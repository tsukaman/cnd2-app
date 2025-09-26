/**
 * Sample Prairie Card profiles for testing and demo purposes
 * This file provides backward compatibility for Prairie format during migration
 */

import { PrairieProfile, XProfile } from '@/types';

export const SAMPLE_PROFILES: Record<string, PrairieProfile> = {
  'alice': {
    basic: {
      username: 'alice_demo',
      name: 'アリス・デモ',
      bio: 'クラウドネイティブエンジニア at TechCorp | Kubernetesスペシャリスト。分散システムとコンテナオーケストレーションの専門家。CNCFプロジェクトに積極的に貢献。',
      location: 'Tokyo, Japan',
      website: 'https://example.com/alice',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      verified: true,
      protected: false,
      createdAt: '2020-01-01T00:00:00Z'
    },
    metrics: {
      followers: 1500,
      following: 300,
      tweets: 2500,
      listed: 50
    },
    details: {
      recentTweets: [
        {
          id: '1',
          text: 'Kubernetes 1.29 の新機能を試してみました。ValidatingAdmissionPolicyが素晴らしい！',
          createdAt: new Date().toISOString(),
          metrics: { likes: 45, retweets: 12, replies: 3 }
        }
      ],
      topics: ['kubernetes', 'cloud-native', 'devops', 'golang'],
      hashtags: ['#kubernetes', '#cloudnative', '#CNCF'],
      mentionedUsers: ['cncf', 'kubernetesio'],
      languages: ['ja', 'en'],
      activeHours: [9, 10, 11, 14, 15, 16]
    },
    analysis: {
      techStack: ['Kubernetes', 'Docker', 'Go', 'Prometheus', 'Terraform'],
      interests: ['Cloud Native', 'DevOps', 'マイクロサービス'],
      personality: 'Technical collaborator'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    },
    social: {
      github: 'https://github.com/alice-demo',
      twitter: 'https://twitter.com/alice_demo',
      website: 'https://example.com/alice',
      blog: 'https://blog.alice-demo.dev'
    },
    custom: {
      favoriteTools: ['kubectl', 'k9s', 'lens'],
      yearsOfExperience: 8
    },
    meta: {
      createdAt: new Date().toISOString(),
      sourceUrl: 'sample-data',
      hashtag: '#CloudNativeDays',
      isPartialData: false
    }
  },
  'bob': {
    basic: {
      username: 'bob_sample',
      name: 'ボブ・サンプル',
      bio: 'フルスタックエンジニア at WebStartup | React & Node.jsのスペシャリスト。モダンWebアプリケーション開発とパフォーマンス最適化に情熱を注ぐ。',
      location: 'Osaka, Japan',
      website: 'https://example.com/bob',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      verified: false,
      protected: false,
      createdAt: '2019-06-15T00:00:00Z'
    },
    metrics: {
      followers: 800,
      following: 450,
      tweets: 1800,
      listed: 25
    },
    details: {
      recentTweets: [
        {
          id: '2',
          text: 'Next.js 14のApp Routerでパフォーマンスが大幅に改善された！Server Componentsは革命的だ',
          createdAt: new Date().toISOString(),
          metrics: { likes: 32, retweets: 8, replies: 5 }
        }
      ],
      topics: ['react', 'nodejs', 'typescript', 'fullstack'],
      hashtags: ['#react', '#nextjs', '#typescript'],
      mentionedUsers: ['vercel', 'reactjs'],
      languages: ['ja', 'en'],
      activeHours: [10, 11, 12, 15, 16, 17]
    },
    analysis: {
      techStack: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL'],
      interests: ['Web開発', 'UI/UX', 'パフォーマンス最適化'],
      personality: 'Creative innovator'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    },
    social: {
      github: 'https://github.com/bob-sample',
      linkedin: 'https://linkedin.com/in/bob-sample',
      website: 'https://example.com/bob',
      zenn: 'https://zenn.dev/bob_sample'
    },
    custom: {
      favoriteFrameworks: ['Next.js', 'Remix', 'SvelteKit'],
      yearsOfExperience: 6
    },
    meta: {
      createdAt: new Date().toISOString(),
      sourceUrl: 'sample-data',
      hashtag: '#CloudNativeDays',
      isPartialData: false
    }
  },
  'charlie': {
    basic: {
      username: 'charlie_test',
      name: 'チャーリー・テスト',
      bio: 'SREエンジニア at MegaCorp | 可用性と信頼性の専門家。99.99%のSLOを維持し、カオスエンジニアリングを実践。インシデント対応のエキスパート。',
      location: 'Kyoto, Japan',
      website: 'https://example.com/charlie',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      verified: true,
      protected: false,
      createdAt: '2018-03-20T00:00:00Z'
    },
    metrics: {
      followers: 2200,
      following: 180,
      tweets: 3500,
      listed: 75
    },
    details: {
      recentTweets: [
        {
          id: '3',
          text: 'カオスエンジニアリングで本番環境の耐障害性を検証。予期しない依存関係を発見できた',
          createdAt: new Date().toISOString(),
          metrics: { likes: 67, retweets: 23, replies: 8 }
        }
      ],
      topics: ['sre', 'python', 'automation', 'observability'],
      hashtags: ['#sre', '#chaosengineering', '#observability'],
      mentionedUsers: ['gremlin', 'datadoghq'],
      languages: ['ja', 'en'],
      activeHours: [8, 9, 10, 13, 14, 15]
    },
    analysis: {
      techStack: ['Python', 'Ansible', 'Jenkins', 'ELK Stack', 'AWS'],
      interests: ['Site Reliability', '自動化', 'カオスエンジニアリング'],
      personality: 'Technical specialist'
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: 3600,
      embedAvailable: true,
      scrapingAvailable: true
    },
    social: {
      github: 'https://github.com/charlie-test',
      twitter: 'https://twitter.com/charlie_test',
      website: 'https://example.com/charlie',
      blog: 'https://sre-notes.charlie.dev'
    },
    custom: {
      incidentsMitigated: 150,
      uptimeRecord: '99.99%',
      favoriteTools: ['Prometheus', 'Grafana', 'PagerDuty']
    },
    meta: {
      createdAt: new Date().toISOString(),
      sourceUrl: 'sample-data',
      hashtag: '#CloudNativeDays',
      isPartialData: false
    }
  }
};

/**
 * Get a sample profile by name or URL pattern
 * @param identifier Profile name or URL
 * @returns Sample profile or null
 */
export function getSampleProfile(identifier: string): PrairieProfile | null {
  // Extract name from URL if provided
  const urlMatch = identifier.match(/prairie\.cards\/u\/(\w+)/);
  const name = urlMatch ? urlMatch[1] : identifier.toLowerCase();
  
  // Check for sample profile indicators
  if (name.includes('sample') || name.includes('demo') || name.includes('test')) {
    // Return a random sample profile
    const profiles = Object.values(SAMPLE_PROFILES);
    return profiles[Math.floor(Math.random() * profiles.length)];
  }
  
  // Check for specific sample names
  if (name in SAMPLE_PROFILES) {
    return SAMPLE_PROFILES[name];
  }
  
  return null;
}