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

    return {
      name: extractText(/<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/i) || 
            extractText(/<h1[^>]*>([^<]+)<\/h1>/i) || 
            '名前未設定',
      bio: extractText(/<div[^>]*class="[^"]*bio[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
      company: extractText(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
      role: extractText(/<div[^>]*class="[^"]*role[^"]*"[^>]*>([^<]+)<\/div>/i) || '',
      interests: extractArray(/<span[^>]*class="[^"]*interest[^"]*"[^>]*>([^<]+)<\/span>/gi),
      skills: extractArray(/<span[^>]*class="[^"]*skill[^"]*"[^>]*>([^<]+)<\/span>/gi),
      tags: extractArray(/<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/gi),
      twitter: this.extractSocialUrl(html, 'twitter.com') || this.extractSocialUrl(html, 'x.com'),
      github: this.extractSocialUrl(html, 'github.com'),
      linkedin: this.extractSocialUrl(html, 'linkedin.com'),
      website: this.extractUrl(html, 'website'),
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
  bio?: string;
  company?: string;
  role?: string;
  interests?: string[];
  skills?: string[];
  tags?: string[];
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}