/**
 * Simplified Prairie Card Parser for Cloudflare Workers
 */
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
      
      // 会社名の抽出パターン
      const companyPatterns = [
        /(?:会社|Company|Corp|Inc|Ltd|株式会社)[:：]?\s*([^。、\n]+)/,
        /(?:所属|勤務|在籍)[:：]?\s*([^。、\n]+)/,
        /@\s*([^。、\n\s]+(?:\s+[^。、\n\s]+)*)/  // @Company形式
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
    // og:propertyまたはnameでメタタグを検索
    const patterns = [
      new RegExp(`<meta[^>]*property=["']${property.replace(':', '\\:')}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property.replace(':', '\\:')}["']`, 'i'),
      new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i')
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