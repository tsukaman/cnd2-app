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
      const avatarMatch = html.match(/<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/i) ||
                          html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*avatar[^"]*"/i) ||
                          html.match(/<img[^>]*alt="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/i);
      return avatarMatch ? avatarMatch[1] : undefined;
    };

    return {
      name: extractText(/<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/i) || 
            extractText(/<h1[^>]*>([^<]+)<\/h1>/i) || 
            '名前未設定',
      title: extractText(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i) || 
             extractText(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i) || 
             extractText(/<div[^>]*class="[^"]*role[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
      bio: extractText(/<div[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/div>/i) || 
           extractText(/<p[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/p>/i) || '',
      company: extractText(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i) || 
               extractText(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i) || '',
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