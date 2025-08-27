import * as cheerio from 'cheerio';
import { PrairieProfile } from '@/types';
import { RateLimiter } from './rate-limiter';
import { CacheManager } from './cache-manager';
import { CND2_CONFIG } from '@/config/cnd2.config';
import { NetworkError, ParseError, ValidationError, ErrorHandler } from './errors';
import { sanitizer } from './sanitizer';

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
  
  // テスト用: シングルトンインスタンスをリセット
  static resetInstance(): void {
    if (process.env.NODE_ENV === 'test') {
      PrairieCardParser.instance = null as any;
    }
  }

  async parseProfile(url: string): Promise<PrairieProfile> {
    // URLの正規化と検証
    const normalizedUrl = this.normalizeUrl(url);
    if (!this.isValidPrairieUrl(normalizedUrl)) {
      throw new ValidationError('有効なPrairie Card URLを入力してください', { url });
    }

    // キャッシュチェック（二乗効果）
    const cached = await this.cacheManager.getWithSquaredCache(normalizedUrl);
    if (cached) {
      return cached;
    }

    // レート制限
    await this.rateLimiter.wait();

    let html: string = '';
    
    try {
      console.log(`[CND²] Prairie Card取得中: ${normalizedUrl}`);
      
      // HTMLを取得
      html = await this.fetchHTML(normalizedUrl);
      
      // フォーマット変更を検出
      if (this.detectFormatChange(html)) {
        console.warn('[CND²] Prairie Cardフォーマット変更検出 - 部分解析モードに切り替え');
      }
      
      // パース処理
      const profile = this.extractProfile(html, normalizedUrl);
      
      // XSS対策: プロフィールデータをサニタイズ
      const sanitizedProfile = sanitizer.sanitizePrairieProfile(profile) as PrairieProfile;
      
      // CND²メタデータを追加
      sanitizedProfile.meta.connectedBy = 'CND²';
      sanitizedProfile.meta.hashtag = CND2_CONFIG.app.hashtag;
      
      // キャッシュに保存
      await this.cacheManager.save(normalizedUrl, sanitizedProfile);
      
      return sanitizedProfile;
    } catch (error) {
      // エラーリカバリーを試みる
      const recoveredProfile = this.analyzeAndRecoverFromError(html, error as Error);
      if (recoveredProfile) {
        console.warn('[CND²] Prairie Card部分的にリカバリー成功');
        
        // サニタイズしてキャッシュ
        const sanitizedProfile = sanitizer.sanitizePrairieProfile(recoveredProfile) as PrairieProfile;
        await this.cacheManager.save(normalizedUrl, sanitizedProfile);
        
        return sanitizedProfile;
      }
      
      // エラーを適切に分類して再スロー
      const mappedError = ErrorHandler.mapError(error);
      ErrorHandler.logError(mappedError, 'PrairieCardParser.parseProfile');
      
      // 既にカスタムエラーの場合はそのまま再スロー
      if (error instanceof NetworkError || error instanceof ParseError || error instanceof ValidationError) {
        throw error;
      }
      
      // ユーザー向けメッセージを設定
      if (mappedError instanceof NetworkError) {
        throw new NetworkError('Prairie Cardサーバーに接続できません。しばらく待ってから再試行してください。');
      } else if (mappedError instanceof ParseError) {
        throw new ParseError('Prairie CardのHTMLフォーマットが変更された可能性があります。');
      } else if (mappedError instanceof ValidationError) {
        throw mappedError; // バリデーションエラーはそのまま
      }
      
      // デフォルトエラー
      throw new Error('Prairie Cardの取得に失敗しました。URLを確認して再度お試しください。');
    }
  }

  private async fetchHTML(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      const response = await fetch(url, {
        headers: {
          'User-Agent': `${CND2_CONFIG.app.name}/${CND2_CONFIG.app.version}`,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // HTTPステータスコードごとの詳細なエラー処理
      if (!response.ok) {
        switch (response.status) {
          case 404:
            throw new ValidationError('Prairie Cardが見つかりません。URLを確認してください。', { url, status: 404 });
          case 403:
            throw new ValidationError('Prairie Cardへのアクセスが拒否されました。', { url, status: 403 });
          case 429:
            throw new NetworkError('リクエストが多すぎます。しばらく待ってから再試行してください。', { url, status: 429 });
          case 500:
          case 502:
          case 503:
          case 504:
            throw new NetworkError('Prairie Cardサーバーでエラーが発生しました。', { url, status: response.status });
          default:
            throw new NetworkError(`HTTPエラー: ${response.status}`, { url, status: response.status });
        }
      }

      const html = await response.text();
      
      // HTMLが有効か確認
      if (!html || html.trim().length < 100) {
        throw new ParseError('Prairie Cardのコンテンツが空または無効です。', { url });
      }

      return html;
    } catch (error: any) {
      // タイムアウトエラー
      if (error.name === 'AbortError' || error.message === 'AbortError') {
        throw new NetworkError('Prairie Card取得がタイムアウトしました。', { url });
      }
      
      // ネットワークエラー
      if (error.message?.includes('fetch')) {
        throw new NetworkError('ネットワークエラーが発生しました。インターネット接続を確認してください。', { url });
      }
      
      // その他のエラーはそのまま再スロー
      throw error;
    }
  }

  private extractProfile(html: string, _url: string): PrairieProfile {
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
        isPartialData: false,
      },
    };
  }

  // Prairie Cardのエラーを詳しく分析して適切なフォールバックを提供
  // Prairie Cardのエラーを詳しく分析して適切なフォールバックを提供
  // Prairie Cardのエラーを詳しく分析して適切なフォールバックを提供
  private analyzeAndRecoverFromError(html: string, error: Error): PrairieProfile | null {
    try {
      // HTMLが空の場合
      if (!html || html.trim().length === 0) {
        console.warn('[CND²] Prairie Card HTMLが空です');
        return null;
      }

      // Prairie Cardのページではない場合
      if (!html.includes('prairie') && !html.includes('Prairie')) {
        console.warn('[CND²] Prairie Cardページではない可能性があります');
        return null;
      }

      // 部分的にパースを試みる（エラーに強い実装）
      const $ = cheerio.load(html);

      // 最小限の情報でもプロファイルを作成
      const minimalProfile: PrairieProfile = {
        basic: {
          name: $('h1, h2, .name').first().text().trim() || 'Unknown',
          title: $('.title, .role').first().text().trim() || '',
          company: $('.company, .organization').first().text().trim() || '',
          bio: $('.bio, .description, p').first().text().trim() || '',
        },
        details: {
          tags: [],
          skills: [],
          interests: [],
          certifications: [],
          communities: [],
        },
        social: {},
        custom: {},
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          connectedBy: 'CND²',
          hashtag: CND2_CONFIG.app.hashtag,
          isPartialData: true,
        },
      };

      console.warn('[CND²] Prairie Card部分解析成功:', minimalProfile.basic.name);
      return minimalProfile;
    } catch (recoveryError) {
      console.error('[CND²] Prairie Cardリカバリー失敗:', recoveryError);
      return null;
    }
  }

  // Prairie Cardのフォーマット変更を検出
  private detectFormatChange(html: string): boolean {
    const knownSelectors = [
      '.profile-name',
      '.prairie-card',
      '[data-prairie-field]',
      '.prairie-profile',
    ];

    const $ = cheerio.load(html);
    const foundSelectors = knownSelectors.filter(selector => $(selector).length > 0);
    
    // 既知のセレクタが一つも見つからない場合、フォーマットが変更された可能性がある
    if (foundSelectors.length === 0) {
      console.warn('[CND²] Prairie Cardのフォーマットが変更された可能性があります');
      return true;
    }

    return false;
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

  private extractDate($: cheerio.CheerioAPI, selector: string): string | undefined {
    const dateText = this.extractText($, selector);
    if (!dateText) return undefined;
    
    try {
      return new Date(dateText).toISOString();
    } catch {
      return undefined;
    }
  }

  private extractCustomFields($: cheerio.CheerioAPI): Record<string, unknown> {
    const custom: Record<string, unknown> = {};
    
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