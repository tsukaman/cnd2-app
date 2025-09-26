/**
 * Prairie Profile変換ユーティリティ
 * 
 * 複数箇所に重複していたプロフィール変換ロジックを共通化
 * - src/app/api/diagnosis/route.ts
 * - functions/api/diagnosis-v4-openai.js
 */

import type { PrairieProfile } from '@/types';

/**
 * プロフィールデータの型を判定
 */
export function isPrairieProfile(profile: any): profile is PrairieProfile {
  return !!(profile && 
         typeof profile === 'object' && 
         'basic' in profile &&
         profile.basic &&
         typeof profile.basic === 'object');
}

/**
 * 最小形式のプロフィールを完全なPrairieProfile形式に変換
 * 
 * @param profile - 変換対象のプロフィール（最小形式または完全形式）
 * @returns 完全なPrairieProfile形式
 */
export function convertToFullProfile(profile: any): PrairieProfile {
  // すでにPrairieProfile形式の場合はそのまま返す
  if (isPrairieProfile(profile)) {
    return profile;
  }
  
  // 最小形式から完全形式に変換
  return {
    basic: {
      username: 'unknown',
      name: profile?.name || '名称未設定',
      bio: profile?.bio || ''
    },
    metrics: {
      followers: 0,
      following: 0,
      tweets: 0
    },
    details: {
      recentTweets: [],
      topics: profile?.tags || [],
      hashtags: [],
      mentionedUsers: []
    },
    social: {
      twitter: profile?.twitter,
      github: profile?.github,
      website: profile?.website,
      linkedin: profile?.linkedin,
      blog: profile?.blog,
      qiita: profile?.qiita,
      zenn: profile?.zenn
    },
    custom: profile?.custom || {
      title: profile?.title || '',
      company: profile?.company || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      certifications: profile?.certifications || [],
      communities: profile?.communities || [],
      motto: profile?.motto
    },
    meta: {
      sourceUrl: profile?.sourceUrl || '',
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: profile?.updatedAt || new Date().toISOString(),
      connectedBy: profile?.connectedBy,
      hashtag: profile?.hashtag,
      isPartialData: profile?.isPartialData
    }
  };
}

/**
 * プロフィール配列を一括変換
 * 
 * @param profiles - プロフィールの配列
 * @returns PrairieProfile配列
 */
export function convertProfilesToFullFormat(profiles: any[]): PrairieProfile[] {
  if (!Array.isArray(profiles)) {
    return [];
  }
  
  return profiles.map(convertToFullProfile);
}

/**
 * プロフィールから診断に必要な最小情報を抽出
 * (診断エンジンに渡すためのデータ軽量化)
 */
export function extractMinimalProfile(profile: PrairieProfile | any): {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
} {
  if (isPrairieProfile(profile)) {
    const custom = profile.custom as any || {};
    return {
      name: profile.basic.name,
      title: custom.title || '',
      company: custom.company || '',
      bio: profile.basic.bio,
      skills: custom.skills || [],
      interests: custom.interests || []
    };
  }
  
  // 最小形式の場合
  return {
    name: profile?.name || '名称未設定',
    title: profile?.title,
    company: profile?.company,
    bio: profile?.bio,
    skills: profile?.skills || [],
    interests: profile?.interests || []
  };
}