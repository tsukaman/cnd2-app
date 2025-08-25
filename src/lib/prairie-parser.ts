import * as cheerio from 'cheerio';
import { PrairieProfile } from '@/types';
import { RateLimiter } from './rate-limiter';
import { CacheManager } from './cache-manager';
import { CND2_CONFIG } from '@/config/cnd2.config';

export class PrairieCardParser {
  private rateLimiter: RateLimiter;
  private cacheManager: CacheManager;
  private static instance: PrairieCardParser;

  private constructor() {
    this.rateLimiter = new RateLimiter(
      CND2_CONFIG.rateLimit.prairie.requestsPerSecond,
      CND2_CONFIG.rateLimit.prairie.requestsPerMinute
    );
    this.cacheManager = new CacheManager();
  }

  // シングルトンパターン
  static getInstance(): PrairieCardParser {
    if (!PrairieCardParser.instance) {
      PrairieCardParser.instance = new PrairieCardParser();
    }
    return PrairieCardParser.instance;
  }

  async parseProfile(url: string): Promise<PrairieProfile> {
    // URLの正規化と検証
    const normalizedUrl = this.normalizeUrl(url);
    if (!this.isValidPrairieUrl(normalizedUrl)) {
      throw new Error('有効なPrairie Card URLを入力してください');
    }

    // キャッシュチェック（二乗効果）
    const cached = await this.cacheManager.getWithSquaredCache(normalizedUrl);
    if (cached) {
      return cached;
    }

    // レート制限
    await this.rateLimiter.wait();

    try {
      console.log(`[CND²] Prairie Card取得中: ${normalizedUrl}`);
      
      // HTMLを取得
      const html = await this.fetchHTML(normalizedUrl);
      
      // パース処理
      const profile = this.extractProfile(html, normalizedUrl);
      
      // CND²メタデータを追加
      profile.meta.connectedBy = 'CND²';
      profile.meta.hashtag = CND2_CONFIG.app.hashtag;
      
      // キャッシュに保存
      await this.cacheManager.save(normalizedUrl, profile);
      
      return profile;
    } catch (error) {
      console.error('[CND²] Prairie Card解析エラー:', error);
      throw new Error('Prairie Cardの情報を取得できませんでした。URLをご確認ください。');
    }
  }

  private async fetchHTML(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': `${CND2_CONFIG.app.name}/${CND2_CONFIG.app.version}`,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    return response.text();
  }

  private extractProfile(html: string, url: string): PrairieProfile {
    const $ = cheerio.load(html);
    
    return {
      basic: {
        name: this.extractText($, '.profile-name, .name, h1.name, [data-field="name"]') || '名前未設定',
        title: this.extractText($, '.profile-title, .title, .job-title, [data-field="title"]') || '',
        company: this.extractText($, '.profile-company, .company, .organization, [data-field="company"]') || '',
        bio: this.extractFullText($, '.profile-bio, .bio, .description, .about, [data-field="bio"]') || '',
        avatar: this.extractImage($, '.profile-avatar img, .avatar img, .profile-image img, [data-field="avatar"] img'),
      },
      details: {
        tags: this.extractTags($),
        skills: this.extractSkills($),
        interests: this.extractInterests($),
        certifications: this.extractCertifications($),
        communities: this.extractCommunities($),
        motto: this.extractText($, '.motto, .slogan, [data-field="motto"]'),
      },
      social: {
        twitter: this.extractSocialLink($, 'twitter', 'x.com'),
        github: this.extractSocialLink($, 'github'),
        linkedin: this.extractSocialLink($, 'linkedin'),
        website: this.extractLink($, '.website, [data-field="website"]'),
        blog: this.extractLink($, '.blog, [data-field="blog"]'),
        qiita: this.extractSocialLink($, 'qiita'),
        zenn: this.extractSocialLink($, 'zenn'),
      },
      custom: this.extractCustomFields($),
      meta: {
        createdAt: this.extractDate($, '.created-date, [data-field="created"]'),
        updatedAt: this.extractDate($, '.updated-date, [data-field="updated"]'),
        connectedBy: 'CND²',
        hashtag: CND2_CONFIG.app.hashtag,
      },
    };
  }

  private extractText($: cheerio.CheerioAPI, selector: string): string {
    return $(selector).first().text().trim();
  }

  private extractFullText($: cheerio.CheerioAPI, selector: string): string {
    // 全文を取得（改行も保持）
    const element = $(selector).first();
    if (!element.length) return '';
    
    // HTMLタグを除去しつつ改行を保持
    return element.html()
      ?.replace(/<br\s*\/?>/gi, '\n')
      ?.replace(/<\/p>\s*<p>/gi, '\n\n')
      ?.replace(/<[^>]*>/g, '')
      ?.trim() || '';
  }

  private extractImage($: cheerio.CheerioAPI, selector: string): string | undefined {
    const src = $(selector).first().attr('src');
    if (!src) return undefined;
    
    // 相対URLを絶対URLに変換
    if (src.startsWith('/')) {
      return `${CND2_CONFIG.api.prairieCard}${src}`;
    }
    return src;
  }

  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    $('.tag, .skill-tag, [data-field="tags"] .item').each((_, elem) => {
      const tag = $(elem).text().trim();
      if (tag) tags.push(tag);
    });
    return [...new Set(tags)]; // 重複を除去
  }

  private extractSkills($: cheerio.CheerioAPI): string[] {
    const skills: string[] = [];
    $('.skill, .skills .item, [data-field="skills"] .item').each((_, elem) => {
      const skill = $(elem).text().trim();
      if (skill) skills.push(skill);
    });
    return [...new Set(skills)];
  }

  private extractInterests($: cheerio.CheerioAPI): string[] {
    const interests: string[] = [];
    $('.interest, .interests .item, [data-field="interests"] .item').each((_, elem) => {
      const interest = $(elem).text().trim();
      if (interest) interests.push(interest);
    });
    return [...new Set(interests)];
  }

  private extractCertifications($: cheerio.CheerioAPI): string[] {
    const certs: string[] = [];
    $('.certification, .certifications .item, [data-field="certifications"] .item').each((_, elem) => {
      const cert = $(elem).text().trim();
      if (cert) certs.push(cert);
    });
    return [...new Set(certs)];
  }

  private extractCommunities($: cheerio.CheerioAPI): string[] {
    const communities: string[] = [];
    $('.community, .communities .item, [data-field="communities"] .item').each((_, elem) => {
      const community = $(elem).text().trim();
      if (community) communities.push(community);
    });
    return [...new Set(communities)];
  }

  private extractSocialLink($: cheerio.CheerioAPI, platform: string, altDomain?: string): string | undefined {
    // プラットフォーム固有のリンクを探す
    const selectors = [
      `a[href*="${platform}.com"]`,
      `a[href*="${platform}.jp"]`,
      altDomain ? `a[href*="${altDomain}"]` : '',
      `.${platform}-link`,
      `[data-social="${platform}"]`,
    ].filter(Boolean);

    for (const selector of selectors) {
      const href = $(selector).first().attr('href');
      if (href) return href;
    }

    return undefined;
  }

  private extractLink($: cheerio.CheerioAPI, selector: string): string | undefined {
    const href = $(selector).first().attr('href');
    return href || undefined;
  }

  private extractDate($: cheerio.CheerioAPI, selector: string): Date | undefined {
    const dateText = this.extractText($, selector);
    if (!dateText) return undefined;
    
    try {
      return new Date(dateText);
    } catch {
      return undefined;
    }
  }

  private extractCustomFields($: cheerio.CheerioAPI): Record<string, any> {
    const custom: Record<string, any> = {};
    
    // カスタムフィールドを探す
    $('[data-custom-field]').each((_, elem) => {
      const field = $(elem).attr('data-custom-field');
      const value = $(elem).text().trim();
      if (field && value) {
        custom[field] = value;
      }
    });

    // その他の情報も収集
    $('.custom-field, .additional-info').each((_, elem) => {
      const label = $(elem).find('.label, .field-label').text().trim();
      const value = $(elem).find('.value, .field-value').text().trim();
      if (label && value) {
        custom[label] = value;
      }
    });

    return custom;
  }

  private normalizeUrl(url: string): string {
    // URLの正規化
    let normalized = url.trim();
    
    // プロトコルがない場合は追加
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    
    // 末尾のスラッシュを除去
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
  }

  private isValidPrairieUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Prairie Cardのドメインをチェック
      return urlObj.hostname.includes('prairie.cards') || 
             urlObj.hostname.includes('prairie-cards');
    } catch {
      return false;
    }
  }

  // キャッシュ統計を取得
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  // キャッシュをクリア
  clearCache() {
    this.cacheManager.clear();
  }
}