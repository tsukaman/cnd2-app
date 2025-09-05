/**
 * Prairie Profile変換ユーティリティ (Cloudflare Functions用)
 * 
 * TypeScript版（src/lib/utils/profile-converter.ts）と同等の機能を提供
 * 複数箇所に重複していたプロフィール変換ロジックを共通化
 */

/**
 * プロフィールデータがPrairieProfile形式かどうかを判定
 * @param {any} profile - チェック対象のプロフィール
 * @returns {boolean} PrairieProfile形式の場合true
 */
function isPrairieProfile(profile) {
  return profile && 
         typeof profile === 'object' && 
         'basic' in profile &&
         profile.basic &&
         typeof profile.basic === 'object';
}

/**
 * 最小形式のプロフィールを完全なPrairieProfile形式に変換
 * @param {any} profile - 変換対象のプロフィール
 * @returns {Object} 完全なPrairieProfile形式
 */
function convertToFullProfile(profile) {
  // すでにPrairieProfile形式の場合はそのまま返す
  if (isPrairieProfile(profile)) {
    return profile;
  }
  
  // 最小形式から完全形式に変換
  return {
    basic: {
      name: profile?.name || '名称未設定',
      title: profile?.title || '',
      company: profile?.company || '',
      bio: profile?.bio || ''
    },
    details: {
      tags: profile?.tags || [],
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      certifications: profile?.certifications || [],
      communities: profile?.communities || [],
      motto: profile?.motto
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
    custom: profile?.custom || {},
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
 * @param {Array} profiles - プロフィールの配列
 * @returns {Array} PrairieProfile配列
 */
function convertProfilesToFullFormat(profiles) {
  if (!Array.isArray(profiles)) {
    return [];
  }
  
  return profiles.map(convertToFullProfile);
}

/**
 * プロフィールから診断に必要な最小情報を抽出
 * @param {Object} profile - プロフィール
 * @returns {Object} 最小形式のプロフィール
 */
function extractMinimalProfile(profile) {
  if (isPrairieProfile(profile)) {
    return {
      name: profile.basic.name,
      title: profile.basic.title,
      company: profile.basic.company,
      bio: profile.basic.bio,
      skills: profile.details.skills,
      interests: profile.details.interests
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

// CommonJS形式でエクスポート
module.exports = {
  isPrairieProfile,
  convertToFullProfile,
  convertProfilesToFullFormat,
  extractMinimalProfile
};