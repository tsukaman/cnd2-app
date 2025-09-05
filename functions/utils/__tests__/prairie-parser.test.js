/**
 * Tests for Prairie Card Parser
 */

const { parseFromHTML, validatePrairieCardUrl } = require('../prairie-parser');

describe('Prairie Card Parser', () => {
  describe('validatePrairieCardUrl', () => {
    // Note: These tests only validate URL format, no actual network access is made
    it('should accept valid Prairie Card URLs', () => {
      expect(validatePrairieCardUrl('https://my.prairie.cards/u/tsukaman')).toBe(true);
      expect(validatePrairieCardUrl('https://my.prairie.cards/u/akane.sakaki')).toBe(true); // ドットを含むユーザー名
      expect(validatePrairieCardUrl('https://my.prairie.cards/u/user.name_123-test')).toBe(true); // 複数の特殊文字
      expect(validatePrairieCardUrl('https://my.prairie.cards/cards/20bc9e4a-c2f4-402a-a449-5c59eca48043')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validatePrairieCardUrl('https://prairie.cards/user123')).toBe(false); // prairie.cards は無効
      expect(validatePrairieCardUrl('https://subdomain.prairie.cards/test')).toBe(false); // サブドメインは無効
      expect(validatePrairieCardUrl('https://my.prairie.cards/profile')).toBe(false); // 不正なパスパターン
      expect(validatePrairieCardUrl('https://example.com')).toBe(false);
      expect(validatePrairieCardUrl('https://fake-prairie.cards.com')).toBe(false);
      expect(validatePrairieCardUrl('not-a-url')).toBe(false);
    });
  });

  describe('parseFromHTML', () => {
    it('should parse basic Prairie Card HTML', () => {
      const html = `
        <html>
          <body>
            <h1>山田 太郎</h1>
            <div class="title">Senior Engineer</div>
            <div class="company">Tech Company Inc.</div>
            <div class="bio">クラウドネイティブ技術が大好きなエンジニアです。</div>
            <div class="skills">
              <span class="skill">Kubernetes</span>
              <span class="skill">Docker</span>
              <span class="skill">Go</span>
            </div>
            <div class="tags">
              <span class="tag">CloudNative</span>
              <span class="tag">DevOps</span>
            </div>
            <a href="https://twitter.com/yamada">Twitter</a>
            <a href="https://github.com/yamada">GitHub</a>
          </body>
        </html>
      `;

      const result = parseFromHTML(html);

      expect(result.basic.name).toBe('山田 太郎');
      expect(result.basic.title).toBe('Senior Engineer');
      expect(result.basic.company).toBe('Tech Company Inc.');
      expect(result.basic.bio).toBe('クラウドネイティブ技術が大好きなエンジニアです。');
      
      expect(result.details.skills).toContain('Kubernetes');
      expect(result.details.skills).toContain('Docker');
      expect(result.details.skills).toContain('Go');
      
      expect(result.details.tags).toContain('CloudNative');
      expect(result.details.tags).toContain('DevOps');
      
      expect(result.social.twitter).toBe('https://twitter.com/yamada');
      expect(result.social.github).toBe('https://github.com/yamada');
    });

    it('should handle Prairie Card with class-based structure', () => {
      const html = `
        <html>
          <body>
            <div class="prairie-card">
              <div class="profile-name">Jane Doe</div>
              <div class="role">DevOps Engineer</div>
              <div class="organization">Cloud Corp</div>
              <div class="about">Passionate about automation and CI/CD pipelines.</div>
              <div class="skill-tag">Jenkins</div>
              <div class="skill-tag">Terraform</div>
              <div class="interest">Automation</div>
              <div class="certification">AWS Certified</div>
              <div class="community">CNCF</div>
            </div>
          </body>
        </html>
      `;

      const result = parseFromHTML(html);

      expect(result.basic.name).toBe('Jane Doe');
      expect(result.basic.title).toBe('DevOps Engineer');
      expect(result.basic.company).toBe('Cloud Corp');
      expect(result.basic.bio).toBe('Passionate about automation and CI/CD pipelines.');
      
      expect(result.details.skills).toContain('Jenkins');
      expect(result.details.skills).toContain('Terraform');
      expect(result.details.interests).toContain('Automation');
      expect(result.details.certifications).toContain('AWS Certified');
      expect(result.details.communities).toContain('CNCF');
    });

    it('should handle data-field attributes', () => {
      const html = `
        <html>
          <body>
            <div data-field="name">John Smith</div>
            <div data-field="skills">Python</div>
            <div data-field="skills">Machine Learning</div>
            <div data-field="tags">AI</div>
          </body>
        </html>
      `;

      const result = parseFromHTML(html);

      expect(result.basic.name).toBe('John Smith');
      expect(result.details.skills).toContain('Python');
      expect(result.details.skills).toContain('Machine Learning');
      expect(result.details.tags).toContain('AI');
    });

    it('should escape HTML for security', () => {
      const html = `
        <html>
          <body>
            <h1>&lt;script&gt;alert('XSS')&lt;/script&gt;</h1>
            <div class="bio"><img src=x onerror="alert('XSS')"></div>
          </body>
        </html>
      `;

      const result = parseFromHTML(html);

      expect(result.basic.name).not.toContain('<script>');
      // HTMLエスケープを削除したので、生のHTMLタグは含まれない
      expect(result.basic.name).not.toContain('&amp;lt;script&amp;gt;');
      expect(result.basic.bio).not.toContain('<img');
    });

    it('should provide defaults for missing data', () => {
      const html = '<html><body></body></html>';

      const result = parseFromHTML(html);

      expect(result.basic.name).toBe('名前未設定');
      expect(result.basic.title).toBe('');
      expect(result.basic.company).toBe('');
      expect(result.basic.bio).toBe('');
      expect(result.details.skills).toEqual([]);
      expect(result.details.tags).toEqual([]);
      expect(result.meta.connectedBy).toBe('CND²');
    });

    it('should extract social media links correctly', () => {
      const html = `
        <html>
          <body>
            <a href="https://x.com/user">X (Twitter)</a>
            <a href="https://github.com/user/repo">GitHub</a>
            <a href="https://linkedin.com/in/user">LinkedIn</a>
            <a href="https://qiita.com/user">Qiita</a>
            <a href="https://zenn.dev/user">Zenn</a>
          </body>
        </html>
      `;

      const result = parseFromHTML(html);

      expect(result.social.twitter).toBe('https://x.com/user');
      expect(result.social.github).toBe('https://github.com/user/repo');
      expect(result.social.linkedin).toBe('https://linkedin.com/in/user');
      expect(result.social.qiita).toBe('https://qiita.com/user');
      expect(result.social.zenn).toBe('https://zenn.dev/user');
    });

    it('should extract bio from explicitly marked elements', () => {
      const html = `
        <html>
          <body>
            <h1>Test User</h1>
            <div class="bio">This is a long bio paragraph that contains more than 20 characters and should be extracted as the bio.</div>
            <p>Random paragraph that should not be extracted</p>
          </body>
        </html>
      `;

      const result = parseFromHTML(html);

      expect(result.basic.bio).toContain('long bio paragraph');
      expect(result.basic.bio).toContain('more than 20 characters');
    });

    describe('Error handling', () => {
      it('should not crash with malformed HTML', () => {
        const malformedHtml = '<div><span>unclosed tags';
        expect(() => parseFromHTML(malformedHtml)).not.toThrow();
        
        const result = parseFromHTML(malformedHtml);
        expect(result).toBeDefined();
        expect(result.basic).toBeDefined();
        expect(result.basic.name).toBe('名前未設定');
      });

      it('should handle empty HTML', () => {
        const emptyHtml = '';
        expect(() => parseFromHTML(emptyHtml)).not.toThrow();
        
        const result = parseFromHTML(emptyHtml);
        expect(result).toBeDefined();
        expect(result.basic.name).toBe('名前未設定');
      });

      it('should handle null or undefined input', () => {
        expect(() => parseFromHTML(null)).not.toThrow();
        expect(() => parseFromHTML(undefined)).not.toThrow();
        
        const resultNull = parseFromHTML(null);
        expect(resultNull).toBeDefined();
        expect(resultNull.basic.name).toBe('名前未設定');
        
        const resultUndefined = parseFromHTML(undefined);
        expect(resultUndefined).toBeDefined();
        expect(resultUndefined.basic.name).toBe('名前未設定');
      });

      it('should handle HTML with broken meta tags', () => {
        const brokenMetaHtml = `
          <html>
            <meta property="og:title content="Test
            <meta name="description" content="
            <body>
              <h1>Fallback Name</h1>
            </body>
          </html>
        `;
        
        expect(() => parseFromHTML(brokenMetaHtml)).not.toThrow();
        
        const result = parseFromHTML(brokenMetaHtml);
        expect(result).toBeDefined();
        expect(result.basic.name).toBe('Fallback Name'); // Should fall back to h1
      });

      it('should handle extremely long strings gracefully', () => {
        const longString = 'a'.repeat(10000);
        const htmlWithLongString = `
          <html>
            <body>
              <h1>Normal Name</h1>
              <div class="bio">${longString}</div>
            </body>
          </html>
        `;
        
        expect(() => parseFromHTML(htmlWithLongString)).not.toThrow();
        
        const result = parseFromHTML(htmlWithLongString);
        expect(result).toBeDefined();
        expect(result.basic.bio.length).toBeLessThanOrEqual(500); // Should be limited
      });

      it('should handle special characters in HTML', () => {
        const specialCharsHtml = `
          <html>
            <body>
              <h1>&lt;script&gt;alert('XSS')&lt;/script&gt;</h1>
              <div class="bio">Bio with <script>malicious</script> content</div>
              <div class="skill">JavaScript"></div>
            </body>
          </html>
        `;
        
        expect(() => parseFromHTML(specialCharsHtml)).not.toThrow();
        
        const result = parseFromHTML(specialCharsHtml);
        expect(result).toBeDefined();
        expect(result.basic.name).not.toContain('<script>');
        expect(result.basic.bio).toBeDefined();
      });
    });

    describe('Character encoding', () => {
      it('should handle Japanese characters (UTF-8)', () => {
        const japaneseHtml = `
          <html>
            <head>
              <meta charset="UTF-8">
            </head>
            <body>
              <h1>山田 太郎</h1>
              <div class="title">シニアエンジニア</div>
              <div class="company">株式会社テクノロジー</div>
              <div class="bio">クラウドネイティブ技術が大好きです。</div>
              <div class="skill">Kubernetes</div>
              <div class="skill">Docker</div>
            </body>
          </html>
        `;
        
        const result = parseFromHTML(japaneseHtml);
        expect(result.basic.name).toBe('山田 太郎');
        expect(result.basic.title).toBe('シニアエンジニア');
        expect(result.basic.company).toBe('株式会社テクノロジー');
        expect(result.basic.bio).toBe('クラウドネイティブ技術が大好きです。');
      });

      it('should handle emoji and special Unicode characters', () => {
        const emojiHtml = `
          <html>
            <body>
              <h1>John Smith 🚀</h1>
              <div class="bio">Love coding 💻 and coffee ☕</div>
              <div class="skill">React ⚛️</div>
              <div class="tag">#DevOps🔧</div>
            </body>
          </html>
        `;
        
        const result = parseFromHTML(emojiHtml);
        expect(result.basic.name).toBe('John Smith 🚀');
        expect(result.basic.bio).toBe('Love coding 💻 and coffee ☕');
        expect(result.details.skills).toContain('React ⚛️');
        expect(result.details.tags).toContain('#DevOps🔧');
      });

      it('should handle mixed language content', () => {
        const mixedHtml = `
          <html>
            <body>
              <h1>田中 John</h1>
              <div class="company">Global テック Inc.</div>
              <div class="bio">Full-stack エンジニア working on クラウド solutions</div>
              <div class="skill">JavaScript</div>
              <div class="skill">日本語</div>
              <div class="skill">English</div>
            </body>
          </html>
        `;
        
        const result = parseFromHTML(mixedHtml);
        expect(result.basic.name).toBe('田中 John');
        expect(result.basic.company).toBe('Global テック Inc.');
        expect(result.basic.bio).toContain('Full-stack エンジニア');
        expect(result.details.skills).toContain('日本語');
        expect(result.details.skills).toContain('English');
      });

      it('should handle HTML entities correctly', () => {
        const entitiesHtml = `
          <html>
            <body>
              <h1>Smith &amp; Jones</h1>
              <div class="company">AT&amp;T Corporation</div>
              <div class="bio">Expert in "web" &amp; 'mobile' development</div>
              <div class="skill">C&plus;&plus;</div>
            </body>
          </html>
        `;
        
        const result = parseFromHTML(entitiesHtml);
        expect(result.basic.name).toBe('Smith &amp; Jones');
        expect(result.basic.company).toBe('AT&amp;T Corporation');
        expect(result.basic.bio).toContain('&amp;');
        expect(result.details.skills).toContain('C&plus;&plus;');
      });

      it('should handle Chinese characters', () => {
        const chineseHtml = `
          <html>
            <body>
              <h1>李明</h1>
              <div class="title">高级工程师</div>
              <div class="company">科技有限公司</div>
              <div class="bio">专注于云原生技术和微服务架构</div>
            </body>
          </html>
        `;
        
        const result = parseFromHTML(chineseHtml);
        expect(result.basic.name).toBe('李明');
        expect(result.basic.title).toBe('高级工程师');
        expect(result.basic.company).toBe('科技有限公司');
        expect(result.basic.bio).toBe('专注于云原生技术和微服务架构');
      });

      it('should handle Korean characters', () => {
        const koreanHtml = `
          <html>
            <body>
              <h1>김철수</h1>
              <div class="title">시니어 개발자</div>
              <div class="company">테크놀로지 회사</div>
              <div class="bio">클라우드 네이티브 기술 전문가</div>
            </body>
          </html>
        `;
        
        const result = parseFromHTML(koreanHtml);
        expect(result.basic.name).toBe('김철수');
        expect(result.basic.title).toBe('시니어 개발자');
        expect(result.basic.company).toBe('테크놀로지 회사');
        expect(result.basic.bio).toBe('클라우드 네이티브 기술 전문가');
      });
    });
  });
});