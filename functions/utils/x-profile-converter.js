/**
 * X Profile変換ユーティリティ (Cloudflare Functions用)
 *
 * XProfileデータを診断エンジン用に変換
 */

/**
 * プロフィールデータがXProfile形式かどうかを判定
 * @param {any} profile - チェック対象のプロフィール
 * @returns {boolean} XProfile形式の場合true
 */
function isXProfile(profile) {
  return !!(profile &&
         typeof profile === 'object' &&
         'basic' in profile &&
         profile.basic &&
         typeof profile.basic === 'object' &&
         'username' in profile.basic);
}

/**
 * XProfileから診断エンジン用のプロファイルに変換
 * @param {any} profile - XProfile形式のプロフィール
 * @returns {Object} 診断エンジン用のプロフィール形式
 */
function convertXProfileToDiagnosisFormat(profile) {
  if (!isXProfile(profile)) {
    throw new Error('Invalid XProfile format');
  }

  // XProfileから診断に必要な情報を抽出
  const { basic, metrics, details, analysis } = profile;

  // 最近のツイートから興味のあるトピックを抽出
  const recentTopics = details?.recentTweets?.map(tweet => tweet.text).join(' ') || '';

  // プロフィール情報を診断用に整形
  return {
    basic: {
      name: basic.name || basic.username,
      title: basic.bio ? basic.bio.substring(0, 50) : 'X User',
      company: basic.location || '',
      bio: basic.bio || ''
    },
    details: {
      // X特有のデータを診断用に変換
      tags: details?.hashtags || [],
      skills: analysis?.techStack || [],
      interests: [...(details?.topics || []), ...(analysis?.interests || [])],
      certifications: [], // Xにはない
      communities: details?.mentionedUsers || [],
      motto: recentTopics.substring(0, 200) // 最近のツイートから抜粋
    },
    social: {
      twitter: `@${basic.username}`,
      github: '', // 別途取得が必要
      website: basic.website || '',
      linkedin: '', // Xからは取得できない
      blog: '',
      qiita: '',
      zenn: ''
    },
    metrics: {
      // Xのメトリクスを追加
      followers: metrics?.followers || 0,
      following: metrics?.following || 0,
      tweets: metrics?.tweets || 0,
      engagement: calculateEngagementRate(metrics, details)
    },
    custom: {
      // X特有の追加データ
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
 * @param {Object} metrics - メトリクスデータ
 * @param {Object} details - 詳細データ
 * @returns {number} エンゲージメント率（0-100）
 */
function calculateEngagementRate(metrics, details) {
  if (!metrics || !details?.recentTweets?.length) return 0;

  let totalEngagement = 0;
  let tweetCount = 0;

  for (const tweet of details.recentTweets) {
    if (tweet.metrics) {
      totalEngagement += (tweet.metrics.likes || 0) +
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
 * @param {Array} profiles - XProfileの配列
 * @returns {Array} 診断用プロフィール配列
 */
function convertXProfilesToDiagnosisFormat(profiles) {
  if (!Array.isArray(profiles)) {
    return [];
  }

  return profiles.map(convertXProfileToDiagnosisFormat);
}

/**
 * XProfileから診断用の要約テキストを生成
 * @param {Object} profile - XProfile
 * @returns {string} 診断用の要約テキスト
 */
function summarizeXProfile(profile) {
  if (!isXProfile(profile)) {
    return '';
  }

  const { basic, metrics, details, analysis } = profile;
  const parts = [];

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
  if (details?.topics?.length > 0) {
    parts.push(`興味のあるトピック: ${details.topics.slice(0, 5).join(', ')}`);
  }

  // 技術スタック
  if (analysis?.techStack?.length > 0) {
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

// CommonJS形式でエクスポート
module.exports = {
  isXProfile,
  convertXProfileToDiagnosisFormat,
  convertXProfilesToDiagnosisFormat,
  summarizeXProfile,
  calculateEngagementRate
};