/**
 * Sample Prairie Card profiles for testing and demo purposes
 */

import { PrairieProfile } from '@/types';

export const SAMPLE_PROFILES: Record<string, PrairieProfile> = {
  'alice': {
    basic: {
      name: 'アリス・デモ',
      title: 'クラウドネイティブエンジニア',
      company: 'TechCorp',
      bio: 'Kubernetesスペシャリスト。分散システムとコンテナオーケストレーションの専門家。CNCFプロジェクトに積極的に貢献。',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
    },
    details: {
      tags: ['kubernetes', 'cloud-native', 'devops', 'golang'],
      skills: [
        'Kubernetes',
        'Docker',
        'Go',
        'Prometheus',
        'Terraform',
        'GitOps',
        'Helm',
        'Istio'
      ],
      interests: [
        'Cloud Native',
        'DevOps',
        'マイクロサービス',
        'オブザーバビリティ',
        'Infrastructure as Code',
        'Service Mesh'
      ],
      certifications: [
        'CKA (Certified Kubernetes Administrator)',
        'CKAD (Certified Kubernetes Application Developer)'
      ],
      communities: [
        'Cloud Native Community Tokyo',
        'Kubernetes Japan User Group'
      ],
      motto: 'コンテナで世界を変える'
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
      name: 'ボブ・サンプル',
      title: 'フルスタックエンジニア',
      company: 'WebStartup',
      bio: 'React & Node.jsのスペシャリスト。モダンWebアプリケーション開発とパフォーマンス最適化に情熱を注ぐ。',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
    },
    details: {
      tags: ['react', 'nodejs', 'typescript', 'fullstack'],
      skills: [
        'React',
        'TypeScript',
        'Node.js',
        'GraphQL',
        'PostgreSQL',
        'AWS',
        'Next.js',
        'Tailwind CSS'
      ],
      interests: [
        'Web開発',
        'UI/UX',
        'パフォーマンス最適化',
        'アクセシビリティ',
        'テスト駆動開発',
        'Progressive Web Apps'
      ],
      certifications: [
        'AWS Certified Solutions Architect',
        'MongoDB Certified Developer'
      ],
      communities: [
        'React Japan',
        'Node.js Japan User Group'
      ],
      motto: 'シンプルで美しいコードを'
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
      name: 'チャーリー・テスト',
      title: 'SREエンジニア',
      company: 'MegaCorp',
      bio: '可用性と信頼性の専門家。99.99%のSLOを維持し、カオスエンジニアリングを実践。インシデント対応のエキスパート。',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'
    },
    details: {
      tags: ['sre', 'python', 'automation', 'observability'],
      skills: [
        'Python',
        'Ansible',
        'Jenkins',
        'ELK Stack',
        'AWS',
        'Chaos Engineering',
        'Terraform',
        'Datadog'
      ],
      interests: [
        'Site Reliability',
        '自動化',
        'インシデント対応',
        'キャパシティプランニング',
        'ポストモーテム',
        'カオスエンジニアリング'
      ],
      certifications: [
        'AWS Certified DevOps Engineer',
        'Google Cloud Professional Cloud DevOps Engineer'
      ],
      communities: [
        'SRE Lounge Tokyo',
        'Chaos Engineering Community'
      ],
      motto: '障害は学習の機会'
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