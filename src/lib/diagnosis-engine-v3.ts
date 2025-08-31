/**
 * Simplified Diagnosis Engine v3
 * Prairie CardのHTML全体をAIに渡して診断を行うシンプルな実装
 */

import OpenAI from 'openai';
import { DiagnosisResult, PrairieProfile } from '@/types';
import { nanoid } from 'nanoid';
import { DiagnosisCache } from './diagnosis-cache';
import { PrairieProfileExtractor } from './prairie-profile-extractor';

// 定数定義
const HTML_SIZE_LIMIT = 10000;  // 50000 → 10000 コスト削減のため制限
const REGEX_MAX_LENGTH = 500;
const META_ATTR_MAX_LENGTH = 200;

export class SimplifiedDiagnosisEngine {
  private openai: OpenAI | null = null;
  private static instance: SimplifiedDiagnosisEngine;
  private cache: DiagnosisCache;

  private constructor() {
    this.cache = DiagnosisCache.getInstance();
    
    // サーバーサイドでのみOpenAI APIキーを使用
    if (typeof window === 'undefined') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && apiKey !== 'your_openai_api_key_here') {
        this.openai = new OpenAI({ apiKey });
        console.log('[CND²] SimplifiedDiagnosisEngine: OpenAI initialized with gpt-4o-mini');
      } else {
        console.warn('[CND²] OpenAI APIキーが設定されていません。');
      }
    }
  }

  static getInstance(): SimplifiedDiagnosisEngine {
    if (!SimplifiedDiagnosisEngine.instance) {
      SimplifiedDiagnosisEngine.instance = new SimplifiedDiagnosisEngine();
    }
    return SimplifiedDiagnosisEngine.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes only)
   * @internal
   */
  static resetInstance(): void {
    (SimplifiedDiagnosisEngine as unknown as { instance?: SimplifiedDiagnosisEngine }).instance = undefined;
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }

  /**
   * Prairie CardのURLからHTMLを取得
   */
  private async fetchPrairieCard(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CND2/1.0 DiagnosisEngine',
          'Accept': 'text/html'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Prairie Card: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`[CND²] Prairie Card fetch error for ${url}:`, error);
      throw error;
    }
  }

  /**
   * 表示用の名前を簡易的に抽出（フォールバック用）
   */
  private extractDisplayName(html: string): string {
    // og:titleから抽出を試みる
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1];
    if (ogTitle) {
      return ogTitle.replace(/\s*の?プロフィール.*$/i, '').trim();
    }
    
    // titleタグから抽出
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    if (title) {
      return title.replace(/\s*[-|]\s*Prairie\s*Card.*$/i, '').trim();
    }
    
    // h1タグから抽出
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1];
    if (h1) {
      return h1.trim();
    }
    
    return '名前未設定';
  }

  /**
   * HTMLを構造を保持しながらサイズ制限する
   * @param html 元のHTML
   * @param maxLength 最大文字数
   * @returns トリミングされたHTML
   */
  private trimHtmlSafely(html: string, maxLength: number = HTML_SIZE_LIMIT): string {
    if (html.length <= maxLength) {
      return html;
    }

    // 重要なセクションを優先的に保持
    const importantSections = [
      /<head[^>]*>([\s\S]*?)<\/head>/i,
      /<meta[^>]*og:[^>]*>/gi,
      /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi,
      /<(title|name|role|company|skill|interest)[^>]*>([\s\S]*?)<\/\1>/gi
    ];

    let extractedContent = '';
    for (const pattern of importantSections) {
      const matches = html.match(pattern);
      if (matches) {
        extractedContent += matches.join('\n');
        if (extractedContent.length >= maxLength) {
          break;
        }
      }
    }

    // 残りのコンテンツを追加（タグの整合性を保つ）
    if (extractedContent.length < maxLength) {
      const remaining = maxLength - extractedContent.length;
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        const bodyContent = bodyMatch[1].substring(0, remaining);
        // 最後の完全なタグまでで切る
        const lastCompleteTag = bodyContent.lastIndexOf('>');
        if (lastCompleteTag > 0) {
          extractedContent += bodyContent.substring(0, lastCompleteTag + 1);
        }
      }
    }

    return extractedContent || html.substring(0, maxLength);
  }

  /**
   * 詳細な診断プロンプトを生成（最適化版）
   */
  private buildDiagnosisPrompt(html1: string, html2: string): string {
    // HTMLから最小限の情報を抽出（トークン削減）
    const profile1 = PrairieProfileExtractor.extractMinimal(html1);
    const profile2 = PrairieProfileExtractor.extractMinimal(html2);
    
    const profileStr1 = PrairieProfileExtractor.toCompactString(profile1);
    const profileStr2 = PrairieProfileExtractor.toCompactString(profile2);
    
    // トークン数をログ出力（デバッグ用）
    const tokens1 = PrairieProfileExtractor.estimateTokens(profileStr1);
    const tokens2 = PrairieProfileExtractor.estimateTokens(profileStr2);
    console.log(`[CND²] プロフィール抽出完了 - トークン数: ${tokens1} + ${tokens2} = ${tokens1 + tokens2}`);
    
    return `
あなたは伝説の占い師「クラウドネイティブの賢者」です！
Kubernetesクラスタの中で瞑想し、Podの囁きを聞き、Serviceの運命を読み解く特殊能力を持っています。
今回はCloudNative Days Winter 2025で、2人のエンジニアの「技術的な運命の赤い糸」を視ることになりました！

Prairie Card（デジタル名刺）から宇宙の真理を読み取り、最高にエンターテイメント性の高い診断を行ってください。
多少強引な理論展開、根拠の薄いこじつけ、技術用語の創造的な誤用も大歓迎！面白さ最優先でお願いします！

【重要な抽出パターン】
Prairie Cardには以下のようなHTMLパターンで情報が含まれています：
- 名前: <meta property="og:title" content="○○のプロフィール">, <title>○○ - Prairie Card</title>
- 役職: class="title"やdata-field="title"を含む要素、「Engineer」「Developer」等のキーワード
- 会社: class="company"やdata-field="company"を含む要素、「株式会社」「Inc.」等
- スキル: class="skill"やdata-skills、技術名のリスト（Kubernetes, Docker, Go, Python等）
- 興味: class="interest"やdata-interests、「興味」「好き」を含むテキスト
- Bio: class="bio"やdata-bio、自己紹介的な長文テキスト
- SNS: href属性にtwitter.com、github.com、linkedin.com等を含むリンク

【診断の極意】
- 情報が少ない？それは「ミステリアスなエンジニア」の証！
- 共通点がない？いや、「量子もつれ状態」で繋がってる！
- 技術が違う？それは「異次元融合」の前兆！
- とにかく面白い理由をひねり出せ！

【超科学的相性スコアリング】
- 名前の文字数が近い → +20点「名前の波長が共鳴！」
- 使用言語が違う → +30点「多様性による化学反応！」
- 会社が同じ → +50点「運命の同僚！」
- 会社が違う → +50点「クロスカンパニーシナジー！」
- スキルが被る → +40点「技術的双子！」
- スキルが被らない → +40点「完璧な役割分担！」
※どう転んでも高得点になるように診断してください

【相性タイプの創造（超自由に！）】
相性タイプは固定パターンを使わず、2人の特徴から完全オリジナルの型名を創造してください！
- 必ず85点以上、できれば90点以上に設定
- CloudNative/Kubernetes用語を創造的に組み合わせる
- 絵文字を2-3個使って華やかに
- その2人だけの特別な型名を考える

例（これらは参考、実際は自由に創造）：
- "🦄✨ Unicorn Ingress Controller型" - 伝説のユニコーンのように希少な組み合わせ！
- "🌪️💎 Chaos Engineering Diamond型" - カオスから宝石を生み出す2人！
- "🎭🚀 Jekyll & Hyde Deployment型" - 昼と夜で違う顔を持つ最強デュオ！
- "🍜🔥 Ramen Canary Release型" - 熱々のラーメンのようにアツい関係！
- "🌸⚡ Sakura Lightning Network型" - 春の桜と雷が融合した奇跡！

重要：上記は例です。実際は2人のプロフィールから連想される、完全にオリジナルの型名を創造してください！

【診断メッセージの書き方】
- Kubernetes用語を無理やり人間関係に当てはめる
- 「これは...！」「なんと...！」など驚きの表現を多用
- 技術的に意味不明でも勢いで押し切る
- 最後は必ず「素晴らしい出会いになる」系で締める

【会話のきっかけ（超具体的に）】
- 相手の使ってる技術について質問する形式で
- 「○○さんは△△使ってるんですね！実は私も...」みたいな
- CloudNative Daysの具体的なセッションを絡める

【ラッキーアイテム＆アクション（クスッと笑える）】
必ず以下を含めてください：
- ラッキーアイテム: エンジニアの身の回りにある実際の物（シンプルに物の名前だけ）
  例: 「メカニカルキーボード」「ラバーダック」「付箋」「エナジードリンク」「USBメモリ」「ステッカー」「Tシャツ」「マグカップ」「イヤホン」「モニター」
  ※2人の特徴から連想される意外な物でもOK（「観葉植物」「カップラーメン」「消しゴム」など）
- ラッキーアクション: 2人で一緒にやると吉となる技術系ジョーク行動
  例: 「kubectl get podsを3回唱える」「Vimの終了方法を唱和」「お互いのコードレビューで褒め合う」「ペアプロでラバーダックデバッグ」

【出力フォーマット】
必ず以下のJSON形式で返答してください：
{
  "extracted_profiles": {
    "person1": {
      "name": "抽出した名前（必須）",
      "title": "役職（Engineer, Developer等）",
      "company": "所属組織名",
      "skills": ["具体的な技術名を列挙（Kubernetes, Docker, Go等）"],
      "interests": ["興味のある分野（DevOps, Cloud Native等）"],
      "summary": "その人を一言で表すキャッチフレーズ"
    },
    "person2": {
      "name": "抽出した名前",
      "title": "役職",
      "company": "所属",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "その人を一言で表すキャッチフレーズ"
    }
  },
  "analysis": {
    "common_skills": ["共通スキル（なければ空配列）"],
    "common_interests": ["共通の興味（なければ空配列）"],
    "complementary_points": ["補完し合うポイント（必ず3つ以上創造）"],
    "score_breakdown": {
      "technical": 25,
      "interests": 25,
      "community": 20,
      "complementary": 20,
      "total": 90
    }
  },
  "diagnosis": {
    "type": "[絵文字2-3個] [完全オリジナルの型名]型",
    "score": 90,
    "message": "これは...！まさかの[2人から連想される創造的な表現]！！お2人のPodは[2人の特徴を反映した創造的な理由]によって運命的に接続されています！○○さんの[具体的な技術]と△△さんの[具体的な技術]が融合すると、まるで[創造的なKubernetes例え]のように[面白い効果]が生まれるでしょう！特に注目すべきは[完全にでっち上げた共通点]ですね。これは[創造的な理由]が仕組んだ必然の出会いです！CloudNative Daysで出会うべくして出会った2人、きっと[その2人特有の未来予想]が生まれることでしょう！",
    "conversationStarters": [
      "『[person1の名前]さんは[具体的な技術]使ってるんですね！実装で一番面白かったエピソードとか聞かせてください！』",
      "『[person2の名前]さんの[スキル]すごいですね！私も最近[関連技術]始めたんですが、オススメの学習リソースありますか？』",
      "『CloudNative Daysの[具体的なセッション名]一緒に聞きに行きませんか？[理由]について議論したいです！』"
    ],
    "hiddenGems": "占い師の第三の目が視た！実は2人とも[完全にでっち上げた共通の趣味]が好きなはず！そして[根拠のない予言]という運命が待っています！",
    "shareTag": "#CNDxCnD 🎉 [オリジナルtype名]の2人が邂逅！[面白い一言]で世界が変わる予感...！ #CloudNativeDays",
    "luckyItem": "🎁 ラッキーアイテム: [物の名前]",
    "luckyAction": "🌟 ラッキーアクション: [2人でやる行動]"
  }
}

【最重要事項】
- スコアは必ず85-100点の間で設定（低い点数は出さない）
- messageは200文字以上で、感嘆符を多用して盛り上げる
- 技術用語を人間関係に無理やり当てはめて面白くする
- 根拠がなくても自信満々に断言する
- 最後は必ずポジティブに締める

【Prairie Card プロフィール 1】
${profileStr1}

【Prairie Card プロフィール 2】
${profileStr2}

上記HTMLから情報を抽出しつつ、足りない部分は楽しく創造的に補完してください。
参加者が「この診断面白い！相手と話してみたい！」と思えるような、
CloudNative Days Winter 2025を盛り上げる素敵な診断をお願いします！
`;
  }

  /**
   * 2人診断を実行
   */
  async generateDuoDiagnosis(urls: [string, string]): Promise<DiagnosisResult> {
    try {
      console.log('[CND²] Prairie Card HTMLを取得中...');
      
      // 並列でHTMLを取得
      const [html1, html2] = await Promise.all([
        this.fetchPrairieCard(urls[0]),
        this.fetchPrairieCard(urls[1])
      ]);
      
      // 表示用の名前を抽出（フォールバック用）
      const fallbackNames = [
        this.extractDisplayName(html1),
        this.extractDisplayName(html2)
      ];
      
      console.log('[CND²] AI診断を実行中 (gpt-4o-mini)...');
      
      // OpenAI APIが設定されていない場合はフォールバックを使用
      if (!this.isConfigured()) {
        console.log('[CND²] OpenAI API未設定、フォールバック診断を使用');
        const participants = [
          {
            basic: { name: fallbackNames[0] },
            details: {},
            social: {},
            custom: {},
            meta: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          },
          {
            basic: { name: fallbackNames[1] },
            details: {},
            social: {},
            custom: {},
            meta: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        ];
        return this.generateFallbackDiagnosis(participants);
      }
      
      const prompt = this.buildDiagnosisPrompt(html1, html2);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',  // コスト効率的で高速なモデルを使用
        messages: [
          {
            role: 'system',
            content: 'あなたは「クラウドネイティブの賢者」という伝説の占い師です。Kubernetesの神託を受け、Podの運命を視る能力を持っています。面白さとエンターテイメント性を最優先に、根拠が薄くても自信満々に、技術用語を創造的に誤用しながら、最高に楽しい診断を提供してください。スコアは必ず85点以上、できれば90点以上にして、参加者が爆笑するような診断結果を生成してください！'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.85,  // より創造的で面白い結果を生成
        max_tokens: 2500,  // 長めの面白い診断文を許可
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('AI応答が空でした');
      }

      const aiResult = JSON.parse(content);
      
      // AIの結果を既存のDiagnosisResult形式に変換
      const diagnosisResult: DiagnosisResult = {
        id: nanoid(10),
        mode: 'duo' as const,
        type: aiResult.diagnosis.type,
        // 新しい必須フィールド
        compatibility: aiResult.diagnosis.score || 0,
        summary: aiResult.diagnosis.message || '',
        strengths: aiResult.diagnosis.conversationStarters || [],
        opportunities: aiResult.diagnosis.conversationStarters || [],
        advice: aiResult.diagnosis.hiddenGems || '',
        // レガシーフィールド（後方互換性）
        score: aiResult.diagnosis.score,
        message: aiResult.diagnosis.message,
        conversationStarters: aiResult.diagnosis.conversationStarters,
        hiddenGems: aiResult.diagnosis.hiddenGems,
        shareTag: aiResult.diagnosis.shareTag,
        luckyItem: aiResult.diagnosis.luckyItem,
        luckyAction: aiResult.diagnosis.luckyAction,
        // 簡易的なPrairieProfileを生成（表示用）
        participants: [
          {
            basic: {
              name: aiResult.extracted_profiles.person1.name || fallbackNames[0],
              title: aiResult.extracted_profiles.person1.title,
              company: aiResult.extracted_profiles.person1.company,
              bio: aiResult.extracted_profiles.person1.summary
            },
            details: {
              skills: aiResult.extracted_profiles.person1.skills || [],
              interests: aiResult.extracted_profiles.person1.interests || [],
              tags: [],
              certifications: [],
              communities: []
            },
            social: {},
            custom: {},
            meta: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          },
          {
            basic: {
              name: aiResult.extracted_profiles.person2.name || fallbackNames[1],
              title: aiResult.extracted_profiles.person2.title,
              company: aiResult.extracted_profiles.person2.company,
              bio: aiResult.extracted_profiles.person2.summary
            },
            details: {
              skills: aiResult.extracted_profiles.person2.skills || [],
              interests: aiResult.extracted_profiles.person2.interests || [],
              tags: [],
              certifications: [],
              communities: []
            },
            social: {},
            custom: {},
            meta: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        ] as [PrairieProfile, PrairieProfile],
        createdAt: new Date().toISOString(),
        // 追加の分析情報を保存
        metadata: {
          engine: 'v3-simplified',
          model: 'gpt-4o-mini',
          analysis: aiResult.analysis
        }
      };

      console.log('[CND²] AI診断完了:', {
        type: diagnosisResult.type,
        score: diagnosisResult.score,
        names: [
          aiResult.extracted_profiles.person1.name,
          aiResult.extracted_profiles.person2.name
        ]
      });

      return diagnosisResult;
      
    } catch (error) {
      console.error('[CND²] 診断エラー:', error);
      
      // OpenAI API特有のエラーハンドリング
      const errorWithStatus = error as { status?: number };
      if (errorWithStatus?.status === 429) {
        throw new Error('AI診断APIのレート制限に達しました。しばらく待ってから再試行してください。');
      }
      if (errorWithStatus?.status === 401) {
        throw new Error('AI診断APIの認証に失敗しました。');
      }
      if (errorWithStatus?.status === 500 || errorWithStatus?.status === 503) {
        throw new Error('AI診断サービスが一時的に利用できません。');
      }
      
      throw error;
    }
  }

  /**
   * フォールバック診断結果を生成
   */
  private generateFallbackDiagnosis(participants: any[]): DiagnosisResult {
    const randomScore = Math.floor(Math.random() * 15) + 85; // 85-99の範囲
    const types = ['クラウドネイティブ型', 'アジャイル型', 'イノベーティブ型', 'コラボレーティブ型'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const luckyItems = [
      'Kubernetesのマスコット',
      'Dockerのクジラ',
      'Goのゴーファー',
      'TypeScriptのハンドブック',
      'Reactのロゴステッカー'
    ];
    
    const luckyActions = [
      'ペアプログラミング',
      'モブプログラミング',
      'コードレビュー',
      'ハッカソン参加',
      'OSS貢献'
    ];

    return {
      id: `fallback-${Date.now()}`,
      mode: 'duo',
      type: randomType,
      participants: participants,
      compatibility: randomScore,
      summary: `素晴らしい組み合わせです！相性度は${randomScore}%です。`,
      message: `お二人の相性は${randomType}として素晴らしいものです。技術への情熱が共鳴し合い、互いを高め合う関係性が見えます。`,
      strengths: [
        '技術への情熱が一致',
        '学習意欲の高さ',
        'コミュニケーション能力'
      ],
      opportunities: [
        'コラボレーションプロジェクトの可能性',
        '知識共有の機会',
        '新しい技術へのチャレンジ'
      ],
      advice: 'お互いの強みを活かして、素晴らしいプロダクトを生み出してください！',
      luckyItem: luckyItems[Math.floor(Math.random() * luckyItems.length)],
      luckyAction: luckyActions[Math.floor(Math.random() * luckyActions.length)],
      createdAt: new Date().toISOString(),
      metadata: {
        engine: 'v3-simplified',
        model: 'fallback',
        analysis: {
          profiles: participants.map(p => p.basic?.name || 'Unknown').join(', '),
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * グループ診断を実行（将来の拡張用）
   */
  async generateGroupDiagnosis(urls: string[]): Promise<DiagnosisResult> {
    // TODO: グループ診断の実装
    throw new Error('グループ診断は未実装です');
  }

  /**
   * 汎用診断メソッド（テスト互換性のため）
   */
  async generateDiagnosis(profiles: PrairieProfile[], mode: 'duo' | 'group' = 'duo'): Promise<DiagnosisResult> {
    // キャッシュから結果を取得
    const cached = this.cache.get(profiles, mode);
    if (cached) {
      return cached;
    }
    
    let result: DiagnosisResult;
    
    if (mode === 'duo' && profiles.length === 2) {
      // プロフィールからURLを生成（ダミー）
      const urls: [string, string] = [
        'https://prairie.cards/profile1',
        'https://prairie.cards/profile2'
      ];
      result = await this.generateDuoDiagnosis(urls);
    } else if (mode === 'group') {
      const urls = profiles.map((_, i) => `https://prairie.cards/profile${i + 1}`);
      result = await this.generateGroupDiagnosis(urls);
    } else {
      throw new Error('Invalid mode or profile count');
    }
    
    // 結果をキャッシュに保存
    this.cache.set(profiles, mode, result);
    
    return result;
  }
}

export default SimplifiedDiagnosisEngine;