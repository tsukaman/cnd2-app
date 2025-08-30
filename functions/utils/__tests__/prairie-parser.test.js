/**
 * Tests for Prairie Card Parser
 */

const { parseFromHTML, validatePrairieCardUrl } = require('../prairie-parser');

describe('Prairie Card Parser', () => {
  describe('validatePrairieCardUrl', () => {
    it('should accept valid Prairie Card URLs', () => {
      expect(validatePrairieCardUrl('https://prairie.cards/user123')).toBe(true);
      expect(validatePrairieCardUrl('https://my.prairie.cards/profile')).toBe(true);
      expect(validatePrairieCardUrl('https://subdomain.prairie.cards/test')).toBe(true);
    });

    it('should reject invalid URLs', () => {
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
  });
});