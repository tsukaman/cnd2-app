/**
 * X Profile変換ユーティリティ (TypeScript版)
 *
 * XProfileデータを診断エンジン用に変換
 */

import { XProfile } from '@/types';

/**
 * プロフィールデータがXProfile形式かどうかを判定
 */
export function isXProfile(profile: unknown): profile is XProfile {
  return !!(
    profile &&
    typeof profile === 'object' &&
    'basic' in profile &&
    (profile as XProfile).basic &&
    typeof (profile as XProfile).basic === 'object' &&
    'username' in (profile as XProfile).basic
  );
}

/**
 * XProfileから診断エンジン用のプロファイルに変換
 */
export function convertXProfileToDiagnosisFormat(profile: XProfile) {
  const { basic, metrics, details, analysis } = profile;

  // 最近のツイートから興味のあるトピックを抽出
  const recentTopics = details?.recentTweets?.map(tweet => tweet.text).join(' ') || '';

  return {
    basic: {
      name: basic.name || basic.username,
      title: basic.bio ? basic.bio.substring(0, 50) : 'X User',
      company: basic.location || '',
      bio: basic.bio || ''
    },
    details: {
      tags: details?.hashtags || [],
      skills: analysis?.techStack || [],
      interests: [...(details?.topics || []), ...(analysis?.interests || [])],
      certifications: [],
      communities: details?.mentionedUsers || [],
      motto: recentTopics.substring(0, 200)
    },
    social: {
      twitter: `@${basic.username}`,
      github: '',
      website: basic.website || '',
      linkedin: '',
      blog: '',
      qiita: '',
      zenn: ''
    },
    metrics: {
      followers: metrics?.followers || 0,
      following: metrics?.following || 0,
      tweets: metrics?.tweets || 0,
      engagement: calculateEngagementRate(metrics, details)
    },
    custom: {
      verified: basic.verified || false,
      protected: basic.protected || false,
      activeHours: details?.activeHours || [],
      languages: details?.languages || ['ja'],
      personality: analysis?.personality || ''
    },
    meta: {
      sourceUrl: `https://x.com/${basic.username}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      platform: 'x.com',
      isPartialData: false
    }
  };
}

/**
 * エンゲージメント率を計算
 */
export function calculateEngagementRate(
  metrics?: XProfile['metrics'],
  details?: XProfile['details']
): number {
  if (!metrics || !details?.recentTweets?.length) return 0;

  let totalEngagement = 0;
  let tweetCount = 0;

  for (const tweet of details.recentTweets) {
    if (tweet.metrics) {
      totalEngagement +=
        (tweet.metrics.likes || 0) +
        (tweet.metrics.retweets || 0) +
        (tweet.metrics.replies || 0);
      tweetCount++;
    }
  }

  if (tweetCount === 0 || !metrics.followers) return 0;

  // 平均エンゲージメント率を計算（パーセンテージ）
  const avgEngagement = totalEngagement / tweetCount;
  const engagementRate = (avgEngagement / metrics.followers) * 100;

  // 0-100の範囲に正規化
  return Math.min(100, Math.round(engagementRate * 10));
}

/**
 * XProfile配列を診断用形式に一括変換
 */
export function convertXProfilesToDiagnosisFormat(profiles: XProfile[]) {
  return profiles.map(convertXProfileToDiagnosisFormat);
}

/**
 * XProfileから診断用の要約テキストを生成
 */
export function summarizeXProfile(profile: XProfile): string {
  const { basic, metrics, details, analysis } = profile;
  const parts: string[] = [];

  // 基本情報
  parts.push(`名前: ${basic.name || basic.username}`);
  parts.push(`ユーザー名: @${basic.username}`);

  if (basic.bio) {
    parts.push(`プロフィール: ${basic.bio}`);
  }

  if (basic.location) {
    parts.push(`場所: ${basic.location}`);
  }

  // メトリクス
  if (metrics) {
    parts.push(`フォロワー: ${metrics.followers?.toLocaleString() || 0}`);
    parts.push(`ツイート数: ${metrics.tweets?.toLocaleString() || 0}`);
  }

  // 興味分野
  if (details?.topics && details.topics.length > 0) {
    parts.push(`興味のあるトピック: ${details.topics.slice(0, 5).join(', ')}`);
  }

  // 技術スタック
  if (analysis?.techStack && analysis.techStack.length > 0) {
    parts.push(`技術スタック: ${analysis.techStack.join(', ')}`);
  }

  // パーソナリティ
  if (analysis?.personality) {
    parts.push(`特徴: ${analysis.personality}`);
  }

  // 最近のツイート（最初の1つ）
  if (details?.recentTweets?.[0]) {
    parts.push(`最新ツイート: "${details.recentTweets[0].text.substring(0, 100)}..."`);
  }

  return parts.join('\n');
}