import { NextResponse } from 'next/server';
import type { PrairieProfile } from '@/types';

// テスト用のモックPrairie Cardデータ
const mockProfiles: Record<string, PrairieProfile> = {
  'test1': {
    basic: {
      name: 'テスト太郎',
      title: 'フルスタックエンジニア',
      company: 'テスト株式会社',
      bio: 'クラウドネイティブ技術に情熱を注ぐエンジニアです。',
      avatar: undefined
    },
    details: {
      tags: ['kubernetes', 'docker', 'aws'],
      skills: ['TypeScript', 'React', 'Node.js', 'Kubernetes'],
      interests: ['Cloud Native', 'DevOps', 'SRE'],
      certifications: ['CKA', 'AWS Solutions Architect'],
      communities: ['CloudNative Days'],
      motto: 'インフラもコードも、全てはユーザーのために'
    },
    social: {
      twitter: 'https://x.com/test1',
      github: 'https://github.com/test1'
    },
    custom: {},
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connectedBy: 'CND²',
      hashtag: '#CNDxCnD'
    }
  },
  'test2': {
    basic: {
      name: 'テスト花子',
      title: 'DevOpsエンジニア',
      company: 'サンプル企業',
      bio: '自動化とCI/CDパイプラインの専門家です。',
      avatar: undefined
    },
    details: {
      tags: ['cicd', 'automation', 'terraform'],
      skills: ['Python', 'Terraform', 'GitHub Actions', 'Docker'],
      interests: ['Infrastructure as Code', 'GitOps', 'Platform Engineering'],
      certifications: ['AWS DevOps Professional'],
      communities: ['Platform Engineering Meetup'],
      motto: '自動化で価値創出を加速する'
    },
    social: {
      twitter: 'https://x.com/test2',
      github: 'https://github.com/test2'
    },
    custom: {},
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connectedBy: 'CND²',
      hashtag: '#CNDxCnD'
    }
  }
};

export async function POST(_request: Request) {
  try {
    const { url } = await request.json();
    
    // URLからIDを抽出（例: https://prairie.cards/test1 -> test1）
    const id = url.split('/').pop();
    
    const profile = mockProfiles[id];
    
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: profile });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}