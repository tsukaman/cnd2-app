/**
 * Prairie Card Parser v2 - 改良版
 * より確実にPrairie Cardの情報を抽出
 */

import { PrairieProfile } from '@/types';

export class PrairieCardParserV2 {
  /**
   * HTMLから包括的にプロフィール情報を抽出
   */
  async parseFromHTML(html: string): Promise<PrairieProfile> {
    // デバッグ用ログ
    console.log('[Prairie Parser v2] Starting HTML parsing...');
    
    // 基本情報の抽出
    const basic = this.extractBasicInfo(html);
    const details = this.extractDetails(html);
    const social = this.extractSocialLinks(html);
    const meta = this.extractMetaInfo(html);
    
    const profile: PrairieProfile = {
      basic,
      details,
      social,
      custom: {},
      meta
    };
    
    console.log('[Prairie Parser v2] Parsed profile:', profile);
    return profile;
  }

  /**
   * URLからPrairie Cardを取得して解析
   */
  async parseFromURL(url: string): Promise<PrairieProfile> {
    console.log('[Prairie Parser v2] Fetching from URL:', url);
    
    // URLバリデーション
    try {
      const parsed = new URL(url);
      
      // HTTPSチェック
      if (parsed.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
      }
      
      // ドメインチェック
      const validHosts = ['prairie.cards', 'my.prairie.cards', 'staging.prairie.cards'];
      const isValid = validHosts.some(host => 
        parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
      
      if (!isValid) {
        throw new Error('Invalid Prairie Card domain');
      }
    } catch (error) {
      console.error('[Prairie Parser v2] URL validation failed:', error);
      throw error;
    }
    
    // HTMLを取得
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CND2/2.0 PrairieCardParser',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Prairie Card: ${response.status}`);
      }

      const html = await response.text();
      const profile = await this.parseFromHTML(html);
      
      // ソースURLを記録
      profile.meta.sourceUrl = url;
      
      return profile;
    } catch (error) {
      console.error('[Prairie Parser v2] Fetch failed:', error);
      throw error;
    }
  }

  /**
   * 基本情報の抽出（名前、役職、会社、自己紹介）
   */
  private extractBasicInfo(html: string): PrairieProfile['basic'] {
    const basic: PrairieProfile['basic'] = {
      name: '',
      title: '',
      company: '',
      bio: '',
    };

    // 名前の抽出（複数パターン対応）
    const namePatterns = [
      // メタタグから
      /<meta\s+property="og:title"\s+content="([^"]+)"/i,
      /<meta\s+name="twitter:title"\s+content="([^"]+)"/i,
      // タイトルタグから
      /<title>([^<]+)<\/title>/i,
      // h1タグから
      /<h1[^>]*>([^<]+)<\/h1>/i,
      // data属性から
      /data-name="([^"]+)"/i,
      // クラス名から
      /<[^>]+class="[^"]*(?:profile-)?name[^"]*"[^>]*>([^<]+)</i,
    ];

    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match) {
        let name = match[1].trim();
        // "〜のプロフィール" を除去
        name = name.replace(/\s*の?プロフィール.*$/i, '');
        // "〜 - Prairie Card" を除去
        name = name.replace(/\s*[-|]\s*Prairie\s*Card.*$/i, '');
        if (name) {
          basic.name = name;
          break;
        }
      }
    }

    // 役職の抽出
    const titlePatterns = [
      /(?:class|data-field)=["'](?:job-)?title["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']role["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']position["'][^>]*>([^<]+)</i,
      // 職種キーワードを含む
      />([^<]*(?:Engineer|Developer|Designer|Manager|Lead|Architect|Analyst|Consultant)[^<]*)</i,
    ];

    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match) {
        basic.title = match[1].trim();
        break;
      }
    }

    // 会社名の抽出
    const companyPatterns = [
      /(?:class|data-field)=["']company["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']organization["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']affiliation["'][^>]*>([^<]+)</i,
      // @会社名 形式（メタタグから）
      /<meta[^>]+content="[^"]*@\s*([^"|,。、]+)[^"]*"/i,
      // 会社名キーワード
      />([^<]*(?:株式会社|会社|Inc\.|Inc|Corp\.|Corp|Ltd\.|Ltd|LLC|GmbH)[^<]*)</i,
    ];

    for (const pattern of companyPatterns) {
      const match = html.match(pattern);
      if (match) {
        let company = match[1].trim();
        // @マークを除去
        company = company.replace(/^@\s*/, '');
        if (company && company.length <= 100) {
          basic.company = company;
          break;
        }
      }
    }

    // 自己紹介の抽出
    const bioPatterns = [
      // メタタグから
      /<meta\s+property="og:description"\s+content="([^"]+)"/i,
      /<meta\s+name="description"\s+content="([^"]+)"/i,
      // 要素から
      /(?:class|data-field)=["']bio["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']description["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']about["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']introduction["'][^>]*>([^<]+)</i,
      // 長めのpタグ（20文字以上）
      /<p[^>]*>([^<]{20,})<\/p>/i,
    ];

    for (const pattern of bioPatterns) {
      const match = html.match(pattern);
      if (match) {
        let bio = match[1].trim();
        // 会社名が含まれている場合は除去
        if (basic.company && bio.includes(basic.company)) {
          bio = bio.replace(new RegExp(`@?\\s*${basic.company}\\s*[|]?`, 'g'), '').trim();
        }
        if (bio) {
          basic.bio = bio.substring(0, 500); // 最大500文字
          break;
        }
      }
    }

    // アバター画像の抽出
    const avatarPatterns = [
      /<meta\s+property="og:image"\s+content="([^"]+)"/i,
      /<img[^>]*(?:class|data-field)=["'][^"]*avatar[^"]*["'][^>]*src="([^"]+)"/i,
      /<img[^>]*(?:class|data-field)=["'][^"]*profile[^"]*["'][^>]*src="([^"]+)"/i,
    ];

    for (const pattern of avatarPatterns) {
      const match = html.match(pattern);
      if (match) {
        basic.avatar = match[1];
        break;
      }
    }

    return basic;
  }

  /**
   * 詳細情報の抽出（スキル、興味、タグなど）
   */
  private extractDetails(html: string): PrairieProfile['details'] {
    const details: PrairieProfile['details'] = {
      tags: [],
      skills: [],
      interests: [],
      certifications: [],
      communities: [],
    };

    // スキルの抽出
    const skillPatterns = [
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*skill[^"]*["'][^>]*>([^<]+)</gi,
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*tech[^"]*["'][^>]*>([^<]+)</gi,
    ];

    for (const pattern of skillPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const skill = match[1].trim();
        if (skill && !details.skills.includes(skill)) {
          details.skills.push(skill);
        }
      }
    }

    // 技術キーワードの検出（HTML全体から）
    const techKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'C#',
      'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform',
      'Git', 'GitHub', 'GitLab', 'CI/CD', 'DevOps', 'Cloud Native',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API'
    ];

    for (const keyword of techKeywords) {
      if (html.includes(keyword) && !details.skills.includes(keyword)) {
        details.skills.push(keyword);
      }
    }

    // 興味の抽出
    const interestPatterns = [
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*interest[^"]*["'][^>]*>([^<]+)</gi,
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*hobby[^"]*["'][^>]*>([^<]+)</gi,
    ];

    for (const pattern of interestPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const interest = match[1].trim();
        if (interest && !details.interests.includes(interest)) {
          details.interests.push(interest);
        }
      }
    }

    // タグの抽出
    const tagPatterns = [
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*tag[^"]*["'][^>]*>([^<]+)</gi,
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*label[^"]*["'][^>]*>([^<]+)</gi,
    ];

    for (const pattern of tagPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const tag = match[1].trim();
        if (tag && !details.tags.includes(tag)) {
          details.tags.push(tag);
        }
      }
    }

    // 資格の抽出
    const certPatterns = [
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*cert[^"]*["'][^>]*>([^<]+)</gi,
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*qualification[^"]*["'][^>]*>([^<]+)</gi,
    ];

    for (const pattern of certPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const cert = match[1].trim();
        if (cert && !details.certifications.includes(cert)) {
          details.certifications.push(cert);
        }
      }
    }

    // コミュニティの抽出
    const communityPatterns = [
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*communit[^"]*["'][^>]*>([^<]+)</gi,
      /<(?:span|div)[^>]*(?:class|data-field)=["'][^"]*group[^"]*["'][^>]*>([^<]+)</gi,
    ];

    for (const pattern of communityPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const community = match[1].trim();
        if (community && !details.communities.includes(community)) {
          details.communities.push(community);
        }
      }
    }

    // モットーの抽出
    const mottoPatterns = [
      /(?:class|data-field)=["']motto["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']slogan["'][^>]*>([^<]+)</i,
      /(?:class|data-field)=["']catchphrase["'][^>]*>([^<]+)</i,
    ];

    for (const pattern of mottoPatterns) {
      const match = html.match(pattern);
      if (match) {
        details.motto = match[1].trim();
        break;
      }
    }

    // 配列を最大10個に制限
    details.skills = details.skills.slice(0, 10);
    details.interests = details.interests.slice(0, 10);
    details.tags = details.tags.slice(0, 10);
    details.certifications = details.certifications.slice(0, 10);
    details.communities = details.communities.slice(0, 10);

    return details;
  }

  /**
   * ソーシャルリンクの抽出
   */
  private extractSocialLinks(html: string): PrairieProfile['social'] {
    const social: PrairieProfile['social'] = {};

    // Twitter/X
    const twitterMatch = html.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/i);
    if (twitterMatch) social.twitter = twitterMatch[0];

    // GitHub
    const githubMatch = html.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9-]+/i);
    if (githubMatch) social.github = githubMatch[0];

    // LinkedIn
    const linkedinMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/i);
    if (linkedinMatch) social.linkedin = linkedinMatch[0];

    // Qiita
    const qiitaMatch = html.match(/https?:\/\/qiita\.com\/[a-zA-Z0-9_-]+/i);
    if (qiitaMatch) social.qiita = qiitaMatch[0];

    // Zenn
    const zennMatch = html.match(/https?:\/\/zenn\.dev\/[a-zA-Z0-9_-]+/i);
    if (zennMatch) social.zenn = zennMatch[0];

    // Website/Blog（汎用的なリンク）
    const websitePatterns = [
      /<a[^>]*(?:class|data-field)=["'][^"]*website["'][^>]*href="([^"]+)"/i,
      /<a[^>]*(?:class|data-field)=["'][^"]*blog["'][^>]*href="([^"]+)"/i,
      /<a[^>]*(?:class|data-field)=["'][^"]*portfolio["'][^>]*href="([^"]+)"/i,
    ];

    for (const pattern of websitePatterns) {
      const match = html.match(pattern);
      if (match) {
        const url = match[1];
        if (!social.website && url.includes('website')) {
          social.website = url;
        } else if (!social.blog && url.includes('blog')) {
          social.blog = url;
        } else if (!social.website) {
          social.website = url;
        }
      }
    }

    return social;
  }

  /**
   * メタ情報の抽出
   */
  private extractMetaInfo(html: string): PrairieProfile['meta'] {
    const meta: PrairieProfile['meta'] = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prairie Cardのメタ情報を探す
    const createdMatch = html.match(/created[^>]*>([^<]+)</i);
    if (createdMatch) {
      meta.createdAt = createdMatch[1].trim();
    }

    const updatedMatch = html.match(/updated[^>]*>([^<]+)</i);
    if (updatedMatch) {
      meta.updatedAt = updatedMatch[1].trim();
    }

    // ハッシュタグ
    const hashtagMatch = html.match(/#(\w+)/);
    if (hashtagMatch) {
      meta.hashtag = hashtagMatch[1];
    }

    return meta;
  }
}

// シングルトンインスタンス
export const prairieParserV2 = new PrairieCardParserV2();