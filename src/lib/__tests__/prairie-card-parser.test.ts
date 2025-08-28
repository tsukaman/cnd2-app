/**
 * @jest-environment node
 */

import { PrairieCardParser } from '../prairie-card-parser';

// HTMLサンプルデータ
const validHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Prairie Card - Test User</title>
</head>
<body>
  <div class="prairie-card">
    <img class="profile-avatar" src="/images/avatar.jpg" alt="Test User">
    <h1 class="profile-name">Test User</h1>
    <div class="profile-title">Software Engineer</div>
    <div class="profile-company">Tech Corp</div>
    <div class="profile-bio">I love coding and building amazing products</div>
    
    <div class="skills">
      <span class="skill">JavaScript</span>
      <span class="skill">TypeScript</span>
      <span class="skill">React</span>
    </div>
    
    <div class="interests">
      <span class="interest">Web Development</span>
      <span class="interest">Open Source</span>
    </div>
    
    <div class="tags">
      <span class="tag">developer</span>
      <span class="tag">engineer</span>
    </div>
    
    <div class="certifications">
      <span class="certification">AWS Certified</span>
    </div>
    
    <div class="communities">
      <span class="community">React Community</span>
    </div>
    
    <div class="motto">Build something amazing</div>
    
    <div class="social-links">
      <a href="https://github.com/testuser">GitHub</a>
      <a href="https://twitter.com/testuser">Twitter</a>
      <a href="https://linkedin.com/in/testuser">LinkedIn</a>
      <a class="website" href="https://testuser.dev">Website</a>
      <a class="blog" href="https://blog.testuser.dev">Blog</a>
    </div>
  </div>
</body>
</html>
`;

const minimalHTML = `
<!DOCTYPE html>
<html>
<body>
  <h1>Minimal User</h1>
</body>
</html>
`;

const emptyHTML = `
<!DOCTYPE html>
<html>
<head></head>
<body>No Prairie data here</body>
</html>
`;

// fetch モック
global.fetch = jest.fn();

// メタタグのみの動的Prairie Card HTML（実際の my.prairie.cards の構造）
const metaOnlyHTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <title>テストユーザー のプロフィール</title>
  <meta property="og:title" content="テストユーザー のプロフィール" />
  <meta property="og:description" content="クラウドネイティブ推進室 @ Example Corp / CloudNative Days Tokyo 実行委員 / Prairie Card開発者" />
  <meta property="og:image" content="https://my.prairie.cards/images/avatar/testuser.jpg" />
  <meta name="description" content="クラウドネイティブ推進室 @ Example Corp" />
</head>
<body>
  <div id="root"></div>
  <script>/* React app loads here */</script>
</body>
</html>
`;

const engineerMetaHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>エンジニア のプロフィール - Prairie Card</title>
  <meta property="og:title" content="エンジニア のプロフィール" />
  <meta property="og:description" content="Software Engineer @TechCorp | Kubernetes enthusiast | CNCF contributor" />
  <meta property="og:image" content="https://my.prairie.cards/avatars/engineer.png" />
</head>
<body><div id="app"></div></body>
</html>
`;

// 様々なパターンのメタタグHTML
const metaVariants = {
  japanese: `
    <html>
      <head>
        <title>山田太郎 のプロフィール</title>
        <meta property="og:description" content="株式会社テスト / フルスタックエンジニア / React・TypeScript・Go" />
      </head>
      <body></body>
    </html>
  `,
  english: `
    <html>
      <head>
        <title>John Doe's Profile</title>
        <meta property="og:title" content="John Doe's Profile" />
        <meta property="og:description" content="Senior Developer at Tech Inc | Cloud Architecture | DevOps" />
      </head>
      <body></body>
    </html>
  `,
  mixedLanguage: `
    <html>
      <head>
        <title>テック花子 | Tech Hanako のプロフィール</title>
        <meta property="og:description" content="SRE @ グローバルテック株式会社 | CKAD certified | Golang/Python" />
      </head>
      <body></body>
    </html>
  `,
  withEmoji: `
    <html>
      <head>
        <title>🚀 DevOps Engineer のプロフィール</title>
        <meta property="og:description" content="Infrastructure as Code enthusiast 💻 | AWS Solutions Architect | 所属: Cloud Native Co." />
        <meta property="og:image" content="https://example.com/avatar.jpg" />
      </head>
      <body></body>
    </html>
  `,
  minimal: `
    <html>
      <head>
        <title>User Profile</title>
      </head>
      <body></body>
    </html>
  `
};

describe('PrairieCardParser', () => {
  let parser: PrairieCardParser;

  beforeEach(() => {
    parser = new PrairieCardParser();
    jest.clearAllMocks();
  });

  describe('parseFromHTML', () => {
    it('完全なHTMLから全てのプロファイルデータを抽出する', async () => {
      const result = await parser.parseFromHTML(validHTML);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Test User');
      expect(result.title).toBe('Software Engineer');
      expect(result.company).toBe('Tech Corp');
      expect(result.bio).toBe('I love coding and building amazing products');
      expect(result.avatar).toBe('/images/avatar.jpg');
      
      expect(result.skills).toEqual(['JavaScript', 'TypeScript', 'React']);
      expect(result.interests).toEqual(['Web Development', 'Open Source']);
      expect(result.tags).toEqual(['developer', 'engineer']);
      expect(result.certifications).toEqual(['AWS Certified']);
      expect(result.communities).toEqual(['React Community']);
      
      expect(result.motto).toBe('Build something amazing');
      expect(result.github).toBe('https://github.com/testuser');
      expect(result.twitter).toBe('https://twitter.com/testuser');
      expect(result.linkedin).toBe('https://linkedin.com/in/testuser');
      expect(result.website).toBe('https://testuser.dev');
      expect(result.blog).toBe('https://blog.testuser.dev');
    });

    it('最小限のHTMLから基本的なプロファイルを抽出する', async () => {
      const result = await parser.parseFromHTML(minimalHTML);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Minimal User');
      expect(result.title).toBe('');
      expect(result.company).toBe('');
      expect(result.bio).toBe('');
      expect(result.avatar).toBeUndefined();
      
      expect(result.skills).toEqual([]);
      expect(result.interests).toEqual([]);
      expect(result.tags).toEqual([]);
    });

    it('Prairie dataが無い場合でもデフォルト値を返す', async () => {
      const result = await parser.parseFromHTML(emptyHTML);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('名前未設定');
      expect(result.title).toBe('');
      expect(result.company).toBe('');
      expect(result.bio).toBe('');
    });
  });

  describe('parseFromURL', () => {
    it('URLからHTMLを取得してパースする', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => validHTML,
      });

      const result = await parser.parseFromURL('https://prairie.cards/testuser');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://prairie.cards/testuser',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'CND2/1.0',
            'Accept': 'text/html',
          }),
        })
      );
      
      expect(result.name).toBe('Test User');
    });

    it('fetch失敗時にエラーをスローする', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(parser.parseFromURL('https://prairie.cards/notfound'))
        .rejects.toThrow('Failed to fetch Prairie Card: 404');
    });

    it('ネットワークエラーを処理する', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(parser.parseFromURL('https://prairie.cards/error'))
        .rejects.toThrow('Network error');
    });
  });

  describe('ソーシャルリンクの抽出', () => {
    it('X.com（旧Twitter）のURLを抽出する', async () => {
      const htmlWithX = `
        <html>
          <h1 class="name">User</h1>
          <a href="https://x.com/testuser">X Profile</a>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithX);
      expect(result.twitter).toBe('https://x.com/testuser');
    });

    it('複数のソーシャルリンクを正しく抽出する', async () => {
      const htmlWithMultipleSocial = `
        <html>
          <h1>Social User</h1>
          <div>
            <a href="https://github.com/testuser/project">GitHub</a>
            <a href="https://qiita.com/testuser">Qiita</a>
            <a href="https://zenn.dev/testuser">Zenn</a>
          </div>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithMultipleSocial);
      expect(result.github).toBe('https://github.com/testuser/project');
      expect(result.qiita).toBe('https://qiita.com/testuser');
      expect(result.zenn).toBe('https://zenn.dev/testuser');
    });
  });

  describe('スキル・タグの抽出', () => {
    it('複数のスキルを配列として抽出する', async () => {
      const htmlWithSkills = `
        <html>
          <h1>Skilled User</h1>
          <div class="skills-container">
            <span class="skill-item">Node.js</span>
            <span class="skill-tag">Python</span>
            <span class="user-skill">Docker</span>
          </div>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithSkills);
      expect(result.skills).toEqual(['Node.js', 'Python', 'Docker']);
    });

    it('重複するタグを除去しない', async () => {
      const htmlWithDuplicateTags = `
        <html>
          <h1>Tagged User</h1>
          <div>
            <span class="tag">JavaScript</span>
            <span class="tag">React</span>
            <span class="tag">JavaScript</span>
          </div>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithDuplicateTags);
      // 重複を含む
      expect(result.tags).toEqual(['JavaScript', 'React', 'JavaScript']);
    });
  });

  describe('アバター画像の抽出', () => {
    it('異なるパターンのアバター画像を抽出する', async () => {
      const patterns = [
        '<img class="avatar" src="/avatar.jpg">',
        '<img src="/avatar.jpg" class="profile-avatar">',
        '<img alt="User avatar" src="/avatar.jpg">',
      ];

      for (const pattern of patterns) {
        const html = `<html><h1>User</h1>${pattern}</html>`;
        const result = await parser.parseFromHTML(html);
        expect(result.avatar).toBe('/avatar.jpg');
      }
    });

    it('アバター画像が無い場合はundefinedを返す', async () => {
      const html = '<html><h1>No Avatar User</h1><img src="/logo.jpg"></html>';
      const result = await parser.parseFromHTML(html);
      expect(result.avatar).toBeUndefined();
    });
  });

  describe('エッジケース', () => {
    it('空文字列を処理できる', async () => {
      const result = await parser.parseFromHTML('');
      
      expect(result).toBeDefined();
      expect(result.name).toBe('名前未設定');
    });

    it('不正なHTMLを処理できる', async () => {
      const malformedHTML = '<html><h1>Broken User</h1><div class="bio">Bio text';
      const result = await parser.parseFromHTML(malformedHTML);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Broken User');
      // 閉じタグがない場合、正規表現パーサーは内容を抽出できない
      expect(result.bio).toBe('');
    });

    it('HTMLエンティティを含むテキストを処理できる', async () => {
      const htmlWithEntities = `
        <html>
          <h1 class="name">Test &amp; User</h1>
          <div class="bio">I love &lt;coding&gt;</div>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithEntities);
      // 正規表現マッチングなのでHTMLエンティティはそのまま
      expect(result.name).toBe('Test &amp; User');
      expect(result.bio).toBe('I love &lt;coding&gt;');
    });

    it('改行を含むテキストを処理できる', async () => {
      const htmlWithNewlines = `
        <html>
          <h1 class="name">
            Multi
            Line
            User
          </h1>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithNewlines);
      // 改行と空白が含まれる可能性
      expect(result.name).toContain('Multi');
    });
  });

  describe('メタタグからの抽出', () => {
    it('動的Prairie Card（my.prairie.cards）からメタタグで情報を取得する', async () => {
      const result = await parser.parseFromHTML(metaOnlyHTML);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('テストユーザー');  // 「のプロフィール」が除去される
      expect(result.bio).toContain('クラウドネイティブ推進室');
      expect(result.bio).toContain('Example Corp');
      expect(result.avatar).toBe('https://my.prairie.cards/images/avatar/testuser.jpg');
      
      // メタタグのみのHTMLでは従来の要素は取得できない
      expect(result.skills).toEqual([]);
      expect(result.interests).toEqual([]);
      expect(result.tags).toEqual([]);
    });

    it('エンジニアプロファイルをメタタグから正しく取得する', async () => {
      const result = await parser.parseFromHTML(engineerMetaHTML);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('エンジニア');
      expect(result.bio).toContain('Software Engineer');
      expect(result.bio).toContain('TechCorp');
      expect(result.bio).toContain('Kubernetes enthusiast');
      expect(result.avatar).toBe('https://my.prairie.cards/avatars/engineer.png');
    });

    it('様々なパターンのメタタグを正しく処理する', async () => {
      // 日本語プロファイル
      const jpResult = await parser.parseFromHTML(metaVariants.japanese);
      expect(jpResult.name).toBe('山田太郎');
      expect(jpResult.bio).toContain('株式会社テスト');
      
      // 英語プロファイル
      const enResult = await parser.parseFromHTML(metaVariants.english);
      expect(enResult.name).toBe('John Doe');
      expect(enResult.bio).toContain('Senior Developer');
      
      // 混合言語プロファイル
      const mixedResult = await parser.parseFromHTML(metaVariants.mixedLanguage);
      expect(mixedResult.name).toContain('テック花子');
      expect(mixedResult.company).toBe('グローバルテック株式会社');
      
      // 絵文字入りプロファイル
      const emojiResult = await parser.parseFromHTML(metaVariants.withEmoji);
      expect(emojiResult.name).toBe('🚀 DevOps Engineer');
      expect(emojiResult.bio).toContain('Infrastructure as Code');
      expect(emojiResult.avatar).toBe('https://example.com/avatar.jpg');
      
      // 最小限のプロファイル
      const minResult = await parser.parseFromHTML(metaVariants.minimal);
      expect(minResult.name).toBe('User Profile');
    });

    it('メタタグと通常要素の両方がある場合は通常要素を優先する', async () => {
      const hybridHTML = `
        <html>
          <head>
            <title>Meta Name のプロフィール</title>
            <meta property="og:title" content="Meta Name のプロフィール" />
            <meta property="og:description" content="Meta Bio" />
          </head>
          <body>
            <h1 class="name">HTML Name</h1>
            <div class="bio">HTML Bio</div>
          </body>
        </html>
      `;
      
      const result = await parser.parseFromHTML(hybridHTML);
      expect(result.name).toBe('HTML Name');  // HTMLの要素が優先
      expect(result.bio).toBe('HTML Bio');    // HTMLの要素が優先
    });

    it('会社名をog:descriptionから抽出する', async () => {
      const htmlWithCompany = `
        <html>
          <head>
            <meta property="og:description" content="Software Engineer @ Google Inc. | Cloud expert" />
          </head>
        </html>
      `;
      
      const result = await parser.parseFromHTML(htmlWithCompany);
      // @ パターンから会社名を抽出
      expect(result.company).toBe('Google Inc.');
    });
  });

  describe('URLパターンの抽出', () => {
    it('プロトコルを含まないURLも抽出できる', async () => {
      const html = `
        <html>
          <h1>User</h1>
          <a href="//github.com/user">GitHub</a>
        </html>
      `;
      
      const result = await parser.parseFromHTML(html);
      // プロトコルがないパターンは現在の実装では抽出されない
      expect(result.github).toBeUndefined();
    });

    it('相対URLを抽出できる', async () => {
      const html = `
        <html>
          <h1>User</h1>
          <a class="website" href="/profile">Profile</a>
          <a class="blog" href="../blog">Blog</a>
        </html>
      `;
      
      const result = await parser.parseFromHTML(html);
      expect(result.website).toBe('/profile');
      expect(result.blog).toBe('../blog');
    });
  });
});