import DOMPurify from 'dompurify';

/**
 * XSS対策用のサニタイザー
 */
export class Sanitizer {
  private static instance: Sanitizer;
  private purify: typeof DOMPurify | null = null;

  private constructor() {
    // クライアントサイドでのみDOMPurifyを初期化
    if (typeof window !== 'undefined') {
      this.purify = DOMPurify;
      this.configure();
    }
  }

  static getInstance(): Sanitizer {
    if (!Sanitizer.instance) {
      Sanitizer.instance = new Sanitizer();
    }
    return Sanitizer.instance;
  }

  private configure(): void {
    if (!this.purify) return;

    // 許可するタグとアトリビュートを設定
    this.purify.setConfig({
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
      ],
      ALLOW_DATA_ATTR: false,
      FORCE_BODY: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      RETURN_TRUSTED_TYPE: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      IN_PLACE: false
    });

    // カスタムフック: 外部リンクには rel="noopener noreferrer" を追加
    this.purify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        const href = node.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }

  /**
   * HTMLコンテンツをサニタイズ
   */
  sanitizeHTML(dirty: string): string {
    // サーバーサイドではHTMLタグを削除
    if (typeof window === 'undefined') {
      return this.stripHTMLTags(dirty);
    }

    if (!this.purify) {
      console.warn('[CND²] DOMPurify is not initialized');
      return this.stripHTMLTags(dirty);
    }

    try {
      const clean = this.purify.sanitize(dirty);
      return clean;
    } catch (error) {
      console.error('[CND²] Sanitization error:', error);
      return this.stripHTMLTags(dirty);
    }
  }

  /**
   * テキストコンテンツをサニタイズ（HTMLタグを完全に削除）
   */
  sanitizeText(dirty: string): string {
    // サーバーサイドまたはDOMPurifyが使えない場合
    if (typeof window === 'undefined' || !this.purify) {
      return this.stripHTMLTags(dirty);
    }

    try {
      // HTMLタグを完全に削除
      const clean = this.purify.sanitize(dirty, { ALLOWED_TAGS: [] });
      return clean;
    } catch (error) {
      console.error('[CND²] Text sanitization error:', error);
      return this.stripHTMLTags(dirty);
    }
  }

  /**
   * URLをサニタイズ
   */
  sanitizeURL(url: string): string {
    if (!url) return '';

    // 危険なプロトコルをブロック
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn(`[CND²] Blocked dangerous URL protocol: ${protocol}`);
        return '';
      }
    }

    // 基本的なURL検証
    try {
      const urlObj = new URL(url);
      // HTTPSまたはHTTPのみ許可
      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        return '';
      }
      return url;
    } catch {
      // 相対URLの場合はそのまま返す
      if (url.startsWith('/') || url.startsWith('#')) {
        return url;
      }
      return '';
    }
  }

  /**
   * HTMLタグを削除（フォールバック用）
   */
  private stripHTMLTags(html: string): string {
    if (!html) return '';
    
    // 基本的なHTMLタグ削除
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }

  /**
   * Prairie Cardプロフィール用のサニタイズ
   */
  sanitizePrairieProfile(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    // 文字列フィールドをサニタイズ
    const textFields = ['name', 'company', 'organization', 'role', 'bio', 'location'];
    for (const field of textFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.sanitizeText(sanitized[field]);
      }
    }

    // URL フィールドをサニタイズ
    const urlFields = ['prairieUrl', 'imageUrl', 'website', 'github', 'twitter', 'linkedin', 'facebook'];
    for (const field of urlFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.sanitizeURL(sanitized[field]);
      }
    }

    // 配列フィールドをサニタイズ
    const arrayFields = ['skills', 'interests', 'communities', 'certifications', 'tags'];
    for (const field of arrayFields) {
      if (Array.isArray(sanitized[field])) {
        sanitized[field] = sanitized[field].map((item: string) => 
          typeof item === 'string' ? this.sanitizeText(item) : item
        );
      }
    }

    // カスタムフィールドをサニタイズ
    if (sanitized.customFields && typeof sanitized.customFields === 'object') {
      for (const [key, value] of Object.entries(sanitized.customFields)) {
        if (typeof value === 'string') {
          sanitized.customFields[key] = this.sanitizeText(value);
        }
      }
    }

    return sanitized;
  }
}

// エクスポート用のインスタンス
export const sanitizer = Sanitizer.getInstance();