/**
 * Simplified Prairie Card Parser for Cloudflare Workers
 */

// 定数定義（一時的に未使用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _COMPANY_NAME_MAX_LENGTH = 50;
// eslint-disable-next-line @typescript-eslint/no-unused-vars  
const _REGEX_ATTR_MAX_LENGTH = 200;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _CONTENT_MAX_LENGTH = 500;

export class PrairieCardParser {
  async parseFromHTML(html: string): Promise<PrairieData> {
    // 簡易的なHTML解析（cheerioなしで動作）
    const extractText = (pattern: RegExp): string => {
      const match = html.match(pattern);
      return match ? match[1].trim() : '';
    };

    const extractArray = (pattern: RegExp): string[] => {
      const matches = html.matchAll(pattern);
      return Array.from(matches).map(m => m[1].trim());
    };

    const extractAvatar = (): string | undefined => {
      // まずメタタグから取得を試みる
      const metaImage = this.extractMetaContent(html, 'og:image');
      if (metaImage) return metaImage;
      
      // 従来の方法でも試す
      const avatarMatch = html.match(/<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/i) ||
                          html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*avatar[^"]*"/i) ||
                          html.match(/<img[^>]*alt="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/i);
      return avatarMatch ? avatarMatch[1] : undefined;
    };

    // メタタグから名前を抽出
    const extractNameFromMeta = (): string => {
      // og:titleまたはtitleタグから名前を抽出
      const ogTitle = this.extractMetaContent(html, 'og:title');
      const titleTag = extractText(/<title>([^<]+)<\/title>/i);
      
      const titleSource = ogTitle || titleTag || '';
      // "名前 のプロフィール" パターンから名前を抽出
      const nameMatch = titleSource.match(/^(.+?)\s*の(?:プロフィール|Profile)/);
      if (nameMatch) return nameMatch[1].trim();
      
      // その他のパターン
      if (titleSource) {
        // " - Prairie Card" や " | Prairie Card" を除去
        return titleSource.replace(/\s*[-|]\s*Prairie\s*Card.*$/i, '').trim();
      }
      
      return '';
    };

    // メタタグからプロフィール情報を抽出
    const extractProfileFromMeta = (): { company?: string; bio?: string } => {
      const description = this.extractMetaContent(html, 'og:description') || 
                         this.extractMetaContent(html, 'description') || '';
      
      const result: { company?: string; bio?: string } = {};
      
      // 会社名の抽出パターン（ReDoS対策済み）
      const companyPatterns = [
        // @Company形式を最初にチェック（固定長で安全）
        /@\s{0,3}([^。、\n|]{1,50})(?:[|]|$)/,  // スペース数を固定
        // 所属等のキーワード後の会社名
        /(?:所属|勤務|在籍)[:：]?\s{0,3}([^。、\n|]{1,50})/,
        // 会社名キーワードを含むパターン（シンプルなマッチング）
        /([\w\s]{1,30}(?:会社|Company|Corp|Inc|Ltd|株式会社))/
      ];
      
      for (const pattern of companyPatterns) {
        const match = description.match(pattern);
        if (match) {
          result.company = match[1].trim();
          break;
        }
      }
      
      // bio（自己紹介）はdescription全体を使用
      if (description && description.length > 0) {
        result.bio = description.substring(0, 500); // 最大500文字
      }
      
      return result;
    };

    // メタタグから取得した情報
    const metaName = extractNameFromMeta();
    const metaProfile = extractProfileFromMeta();

    return {
      name: extractText(/<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/i) || 
            extractText(/<h1[^>]*>([^<]+)<\/h1>/i) || 
            metaName ||  // メタタグから取得した名前を使用
            '名前未設定',
      title: extractText(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i) || 
             extractText(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i) || 
             extractText(/<div[^>]*class="[^"]*role[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
      bio: extractText(/<div[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/div>/i) || 
           extractText(/<p[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/p>/i) || 
           metaProfile.bio || '',  // メタタグから取得したbioを使用
      company: extractText(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i) || 
               extractText(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i) || 
               metaProfile.company || '',  // メタタグから取得した会社名を使用
      avatar: extractAvatar(),
      interests: extractArray(/<span[^>]*class="[^"]*interest[^"]*"[^>]*>([^<]+)<\/span>/gi),
      skills: extractArray(/<span[^>]*class="[^"]*skill[^"]*"[^>]*>([^<]+)<\/span>/gi),
      tags: extractArray(/<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/gi),
      certifications: extractArray(/<span[^>]*class="[^"]*cert[^"]*"[^>]*>([^<]+)<\/span>/gi),
      communities: extractArray(/<span[^>]*class="[^"]*communit[^"]*"[^>]*>([^<]+)<\/span>/gi),
      motto: extractText(/<div[^>]*class="[^"]*motto[^"]*"[^>]*>([^<]+)<\/div>/i),
      twitter: this.extractSocialUrl(html, 'twitter.com') || this.extractSocialUrl(html, 'x.com'),
      github: this.extractSocialUrl(html, 'github.com'),
      linkedin: this.extractSocialUrl(html, 'linkedin.com'),
      website: this.extractUrl(html, 'website'),
      blog: this.extractUrl(html, 'blog'),
      qiita: this.extractSocialUrl(html, 'qiita.com'),
      zenn: this.extractSocialUrl(html, 'zenn.dev'),
    };
  }

  async parseFromURL(url: string): Promise<PrairieData> {
    // Validate URL for security
    try {
      const parsed = new URL(url);
      
      // Only allow HTTPS protocol
      if (parsed.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
      }
      
      // Allow prairie.cards domains and test domains
      const validHosts = ['prairie.cards', 'my.prairie.cards'];
      const testHosts = ['example.com', 'example.jp']; // For testing only
      const isTestEnvironment = process.env.NODE_ENV === 'test';
      
      if (!validHosts.includes(parsed.hostname) && 
          !parsed.hostname.endsWith('.prairie.cards') &&
          !(isTestEnvironment && testHosts.includes(parsed.hostname))) {
        throw new Error('Invalid Prairie Card domain');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid URL');
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CND2/1.0',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Prairie Card: ${response.status}`);
    }

    const html = await response.text();
    return this.parseFromHTML(html);
  }

  private extractMetaContent(html: string, property: string): string | undefined {
    // プロパティ名を安全にエスケープ（ReDoS対策）
    const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(':', '\\:');
    
    // 固定長のパターンを使用してパフォーマンスを最適化
    const patterns = [
      new RegExp(`<meta[^>]{0,200}property=["']${escapedProperty}["'][^>]{0,200}content=["']([^"']{0,500})["']`, 'i'),
      new RegExp(`<meta[^>]{0,200}content=["']([^"']{0,500})["'][^>]{0,200}property=["']${escapedProperty}["']`, 'i'),
      new RegExp(`<meta[^>]{0,200}name=["']${escapedProperty}["'][^>]{0,200}content=["']([^"']{0,500})["']`, 'i'),
      new RegExp(`<meta[^>]{0,200}content=["']([^"']{0,500})["'][^>]{0,200}name=["']${escapedProperty}["']`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }

  private extractSocialUrl(html: string, domain: string): string | undefined {
    const pattern = new RegExp(`https?://(?:www\\.)?${domain.replace('.', '\\.')}[^"'\\s>]+`, 'i');
    const match = html.match(pattern);
    return match ? match[0] : undefined;
  }

  private extractUrl(html: string, type: string): string | undefined {
    const pattern = new RegExp(`<a[^>]*class="[^"]*${type}[^"]*"[^>]*href="([^"]+)"`, 'i');
    const match = html.match(pattern);
    return match ? match[1] : undefined;
  }
}

export interface PrairieData {
  name: string;
  title?: string;
  bio?: string;
  company?: string;
  role?: string;
  avatar?: string;
  interests?: string[];
  skills?: string[];
  tags?: string[];
  certifications?: string[];
  communities?: string[];
  motto?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  blog?: string;
  qiita?: string;
  zenn?: string;
  custom?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  connectedBy?: string;
  hashtag?: string;
}