/**
 * Prairie Card Profile Extractor
 * HTMLから必要最小限の情報を抽出してトークン数を削減
 */

export interface MinimalProfile {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  motto?: string;
}

export class PrairieProfileExtractor {
  /**
   * HTMLから最小限の情報を抽出（200-300トークン程度）
   */
  static extractMinimal(html: string): MinimalProfile {
    const profile: MinimalProfile = {
      name: '',
      skills: [],
      interests: []
    };

    // 名前の抽出（優先順位順）
    const namePatterns = [
      /<meta\s+property="og:title"\s+content="([^"]+)"/i,
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i
    ];
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match) {
        profile.name = match[1].replace(/\s*の?プロフィール.*$/i, '').trim();
        break;
      }
    }

    // 役職の抽出
    const titleMatch = html.match(/(?:class|data-field)=["']title["'][^>]*>([^<]+)</i);
    if (titleMatch) {
      profile.title = titleMatch[1].trim();
    }

    // 会社名の抽出
    const companyMatch = html.match(/(?:class|data-field)=["']company["'][^>]*>([^<]+)</i);
    if (companyMatch) {
      profile.company = companyMatch[1].trim();
    }

    // 自己紹介の抽出（最大200文字）
    const bioMatch = html.match(/(?:class|data-field)=["']bio["'][^>]*>([^<]+)</i);
    if (bioMatch) {
      profile.bio = bioMatch[1].trim().substring(0, 200);
    }

    // スキルの抽出
    const skillsMatch = html.match(/(?:class|data-field)=["']skills?["'][^>]*>([^<]+)</gi);
    if (skillsMatch) {
      skillsMatch.forEach(match => {
        const skill = match.replace(/.*>/, '').trim();
        if (skill && !profile.skills.includes(skill)) {
          profile.skills.push(skill);
        }
      });
    }

    // 技術キーワードの検出
    const techKeywords = [
      'Kubernetes', 'Docker', 'Go', 'Python', 'JavaScript', 'TypeScript',
      'React', 'Vue', 'AWS', 'GCP', 'Azure', 'DevOps', 'CI/CD',
      'Terraform', 'Ansible', 'Jenkins', 'GitLab', 'GitHub'
    ];
    
    techKeywords.forEach(keyword => {
      if (html.includes(keyword) && !profile.skills.includes(keyword)) {
        profile.skills.push(keyword);
      }
    });

    // 興味の抽出
    const interestsMatch = html.match(/(?:class|data-field)=["']interests?["'][^>]*>([^<]+)</gi);
    if (interestsMatch) {
      interestsMatch.forEach(match => {
        const interest = match.replace(/.*>/, '').trim();
        if (interest && !profile.interests.includes(interest)) {
          profile.interests.push(interest);
        }
      });
    }

    // スキルと興味を最大5個に制限
    profile.skills = profile.skills.slice(0, 5);
    profile.interests = profile.interests.slice(0, 5);

    return profile;
  }

  /**
   * プロフィールをコンパクトな文字列に変換（診断用）
   */
  static toCompactString(profile: MinimalProfile): string {
    const parts = [
      `名前: ${profile.name}`,
      profile.title && `役職: ${profile.title}`,
      profile.company && `会社: ${profile.company}`,
      profile.bio && `自己紹介: ${profile.bio}`,
      profile.skills.length > 0 && `スキル: ${profile.skills.join(', ')}`,
      profile.interests.length > 0 && `興味: ${profile.interests.join(', ')}`
    ].filter(Boolean);

    return parts.join('\n');
  }

  /**
   * トークン数を推定
   */
  static estimateTokens(text: string): number {
    // 日本語: 1文字 ≈ 0.4トークン
    // 英語: 1単語 ≈ 1トークン
    const japaneseChars = (text.match(/[ぁ-ん|ァ-ヶー|一-龠]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    return Math.ceil(japaneseChars * 0.4 + englishWords);
  }
}

// 使用例
/*
const html = await fetch(prairieCardUrl).then(r => r.text());
const profile = PrairieProfileExtractor.extractMinimal(html);
const compactStr = PrairieProfileExtractor.toCompactString(profile);
const tokens = PrairieProfileExtractor.estimateTokens(compactStr);
console.log(`抽出したプロフィール（約${tokens}トークン）:`, compactStr);
*/