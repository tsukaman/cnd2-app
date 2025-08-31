/**
 * Prairie Card Profile Extractor
 * HTMLから必要最小限の情報を抽出してトークン数を削減
 */

export interface MinimalProfile {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  motto?: string;
}

export class PrairieProfileExtractor {
  /**
   * HTMLから最小限の情報を抽出（200-300トークン程度）
   */
  static extractMinimal(html: string): MinimalProfile {
    const profile: MinimalProfile = {
      name: '',
      skills: [],
      interests: []
    };

    // 名前の抽出（優先順位順）
    const namePatterns = [
      /<meta\s+property="og:title"\s+content="([^"]+)"/i,
      /<meta\s+name="twitter:title"\s+content="([^"]+)"/i,
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i
    ];
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match) {
        // "のプロフィール" を削除して名前だけ抽出
        profile.name = match[1]
          .replace(/\s*の?プロフィール.*$/i, '')
          .replace(/^\s*/, '')
          .trim();
        break;
      }
    }

    // Prairie Cardから余計なタグを削除してテキストを抽出
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ');
    
    // 役職パターン（Prairie Cardで見つかった実際の例）
    const titlePatterns = [
      /(?:CEO|CTO|CFO|COO|CMO|CPO|CDO|CIO)\b/i,
      /プレーリーカードCEO/,
      /社畜/,
      /エンジニア|プログラマ|デザイナー|マネージャー|ディレクター|リーダー/,
      /Software\s+Engineer|Frontend|Backend|Full[\s-]?Stack|DevOps|SRE/i,
      /プロダクトマネージャー|プロジェクトマネージャー|PM/,
      /研究者|学生|教授|講師/
    ];
    
    for (const pattern of titlePatterns) {
      const match = textContent.match(pattern);
      if (match && match[0] !== profile.name) {
        profile.title = match[0].trim();
        break;
      }
    }

    // 会社名の抽出（一般的なパターン）
    const companyPatterns = [
      /(?:株式会社|合同会社|有限会社)[^\s、。]{1,20}/,
      /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc\.|Corporation|Corp\.|Co\.|Ltd\.|LLC|GmbH|S\.A\.|S\.L\.)/i,
      /(?:Google|Amazon|Microsoft|Meta|Apple|IBM|Oracle|Intel|NVIDIA|Adobe|Salesforce)/i,
      /(?:楽天|LINE|Yahoo|ソフトバンク|NTT|富士通|日立|NEC|パナソニック|ソニー|トヨタ|ホンダ)/
    ];
    
    for (const pattern of companyPatterns) {
      const match = textContent.match(pattern);
      if (match) {
        profile.company = match[0].trim();
        break;
      }
    }

    // 自己紹介文の抽出
    // 1. descriptionメタタグから
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      const desc = descMatch[1];
      if (!desc.includes('プロフィールページ') && !desc.includes('Prairie Card')) {
        profile.bio = desc.substring(0, 300);
      }
    }
    
    // 2. <p>タグから日本語の文章を抽出
    if (!profile.bio) {
      const pMatches = html.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
      let longestBio = '';
      for (const match of pMatches) {
        const text = match[1].trim();
        // 日本語を含む、ある程度の長さの文章
        if (text.length > 20 && 
            (text.includes('です') || text.includes('ます') || text.includes('だ') || text.includes('である')) &&
            !text.includes('プレーリーカード') && 
            !text.includes('新規登録')) {
          if (text.length > longestBio.length) {
            longestBio = text;
          }
        }
      }
      if (longestBio) {
        profile.bio = longestBio.substring(0, 300);
      }
    }

    // 技術キーワードの検出（拡張版）
    const techKeywords = [
      // プログラミング言語
      'Go', 'Golang', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Kotlin', 'Swift',
      'Ruby', 'PHP', 'C\\+\\+', 'C#', 'Rust', 'Scala', 'Elixir', 'Haskell', 'Clojure',
      // フレームワーク
      'React', 'Vue', 'Angular', 'Next\\.js', 'Nuxt', 'Svelte', 'Express', 'Django',
      'Rails', 'Spring', 'Flask', 'FastAPI', 'Laravel', 'Gin', 'Echo',
      // インフラ・クラウド
      'Kubernetes', 'k8s', 'Docker', 'AWS', 'GCP', 'Azure', 'OpenShift',
      'Terraform', 'Ansible', 'CloudFormation', 'Pulumi',
      // CI/CD
      'Jenkins', 'GitLab', 'GitHub Actions', 'CircleCI', 'ArgoCD', 'Flux',
      // データベース
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'BigQuery',
      // その他
      'DevOps', 'CI/CD', 'Cloud Native', 'Microservices', 'GraphQL', 'REST API',
      'Machine Learning', 'AI', 'Data Science', 'Blockchain', 'Web3',
      'Observability', 'Prometheus', 'Grafana', 'Datadog', 'New Relic'
    ];
    
    techKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(textContent) && !profile.skills.includes(keyword)) {
        profile.skills.push(keyword);
      }
    });

    // 興味・趣味の抽出
    const hobbyKeywords = [
      // スポーツ
      'サッカー', 'フットサル', '野球', 'バスケ', 'テニス', 'ゴルフ', 'ランニング',
      'マラソン', 'トライアスロン', 'ヨガ', 'ピラティス', '筋トレ', 'ボルダリング',
      // 文化系
      '音楽', '映画', '読書', 'アニメ', '漫画', 'ゲーム', '写真', 'カメラ',
      'イラスト', '絵画', '書道', '料理', 'カフェ', 'グルメ',
      // アウトドア
      'キャンプ', '登山', 'ハイキング', '釣り', 'サーフィン', 'ダイビング',
      'スキー', 'スノーボード', '旅行', 'ドライブ', 'ツーリング',
      // その他
      'サウナ', '温泉', 'フェス', '音楽フェス', 'ライブ', 'コンサート',
      'ボードゲーム', 'カードゲーム', '謎解き', 'エスケープ',
      // 絵文字から推測
      '🍺', '🍜', '☕', '🎮', '📚', '🎬', '🎵', '📷', '⚽', '🏃'
    ];
    
    const foundInterests = new Set<string>();
    hobbyKeywords.forEach(keyword => {
      if (textContent.includes(keyword)) {
        // 絵文字は対応する日本語に変換
        const hobbyMap: { [key: string]: string } = {
          '🍺': 'ビール',
          '🍜': 'ラーメン',
          '☕': 'コーヒー',
          '🎮': 'ゲーム',
          '📚': '読書',
          '🎬': '映画',
          '🎵': '音楽',
          '📷': '写真',
          '⚽': 'サッカー',
          '🏃': 'ランニング'
        };
        foundInterests.add(hobbyMap[keyword] || keyword);
      }
    });
    
    profile.interests = Array.from(foundInterests);

    // モットーや座右の銘の抽出
    const mottoPatterns = [
      /「([^」]{3,50})」/g,  // 鉤括弧で囲まれた短い文
      /Keep\s+[A-Z][a-z]+/gi,  // Keep Smiling のようなフレーズ
      /(?:座右の銘|モットー|信条|ポリシー)[：:「\s]*([^。」]{3,50})/i
    ];
    
    for (const pattern of mottoPatterns) {
      const match = textContent.match(pattern);
      if (match) {
        profile.motto = (match[1] || match[0]).trim();
        break;
      }
    }

    // スキルと興味を最大5個に制限
    profile.skills = profile.skills.slice(0, 5);
    profile.interests = profile.interests.slice(0, 5);

    return profile;
  }

  /**
   * プロフィールをコンパクトな文字列に変換（診断用）
   */
  static toCompactString(profile: MinimalProfile): string {
    const parts = [
      `名前: ${profile.name}`,
      profile.title && `役職: ${profile.title}`,
      profile.company && `会社: ${profile.company}`,
      profile.bio && `自己紹介: ${profile.bio}`,
      profile.skills.length > 0 && `スキル: ${profile.skills.join(', ')}`,
      profile.interests.length > 0 && `興味: ${profile.interests.join(', ')}`,
      profile.motto && `モットー: ${profile.motto}`
    ].filter(Boolean);

    return parts.join('\n');
  }

  /**
   * トークン数を推定
   */
  static estimateTokens(text: string): number {
    // 日本語: 1文字 ≈ 0.4トークン
    // 英語: 1単語 ≈ 1トークン
    const japaneseChars = (text.match(/[ぁ-ん|ァ-ヶー|一-龠]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    return Math.ceil(japaneseChars * 0.4 + englishWords);
  }
}