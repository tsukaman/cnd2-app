/**
 * Simplified Diagnosis Engine v3
 * Prairie CardのHTML全体をAIに渡して診断を行うシンプルな実装
 */

import OpenAI from 'openai';
import { DiagnosisResult, PrairieProfile } from '@/types';
import { nanoid } from 'nanoid';
import { DiagnosisCache } from './diagnosis-cache';

// 定数定義
const HTML_SIZE_LIMIT = 50000;
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
   * 詳細な診断プロンプトを生成
   */
  private buildDiagnosisPrompt(html1: string, html2: string): string {
    // HTMLを構造を保持しながらサイズ制限
    const trimmedHtml1 = this.trimHtmlSafely(html1, HTML_SIZE_LIMIT);
    const trimmedHtml2 = this.trimHtmlSafely(html2, HTML_SIZE_LIMIT);
    
    return `
あなたはプロの占い師でありながら、KubernetesとCloud Nativeのプロフェッショナルでもあります。
CloudNative Days Winter 2025（11月18-19日）で、参加者同士が楽しく交流できるよう、技術と占いのスキルを活かして相性診断を行います。

Prairie Card（デジタル名刺）に記載された2人のプロフィールから、友人としての相性を診断してください。
診断は楽しく、思わず笑ってしまうような陽気でポジティブなものにしてください。
※性的・恋愛的なコメントは避け、技術者同士の友情にフォーカスしてください。

【重要な抽出パターン】
Prairie Cardには以下のようなHTMLパターンで情報が含まれています：
- 名前: <meta property="og:title" content="○○のプロフィール">, <title>○○ - Prairie Card</title>
- 役職: class="title"やdata-field="title"を含む要素、「Engineer」「Developer」等のキーワード
- 会社: class="company"やdata-field="company"を含む要素、「株式会社」「Inc.」等
- スキル: class="skill"やdata-skills、技術名のリスト（Kubernetes, Docker, Go, Python等）
- 興味: class="interest"やdata-interests、「興味」「好き」を含むテキスト
- Bio: class="bio"やdata-bio、自己紹介的な長文テキスト
- SNS: href属性にtwitter.com、github.com、linkedin.com等を含むリンク

【診断の方針】
- 技術スタックの相性を重視しつつ、楽しい占い要素を加える
- 情報が少なくても創造的に診断（厳密性より楽しさを優先）
- 両者が会話のきっかけを見つけられるような診断にする
- CloudNative技術への情熱を共通点として強調

【情報抽出】
上記パターンから以下を探してください（見つからなくてもOK）：
- 名前（og:title、title、h1タグから）
- 技術スキル（Kubernetes、Docker、Go、Python等の技術名）
- 役職・所属（Engineer、Developer、会社名など）
- 興味・趣味（技術以外の興味も含む）
- 自己紹介文（bio、description等）

【相性診断のポイント】
1. 技術の相性（40%）
   - 同じ技術を使っている → 「技術の双子」的な診断
   - 補完的な技術 → 「最強のペア」的な診断
   - 全く違う技術 → 「新しい発見」的な診断

2. 性格・興味の相性（30%）
   - 共通の興味があれば強調
   - なければCloudNativeへの情熱を共通点に

3. 将来の可能性（30%）
   - 一緒にできそうなプロジェクト
   - 学び合えそうなポイント
   - CloudNative Daysでの交流の可能性

【相性タイプ（占い風に楽しく）】
スコアに応じた楽しいタイプ名：
- 90-100: "Perfect Pod Pair型" - まるでKubernetesの完璧なPod！
- 75-89: "Service Mesh型" - 複雑に絡み合う最高の連携！
- 60-74: "Sidecar Container型" - お互いを支え合う素敵な関係！
- 40-59: "Different Namespace型" - 違いが生む新しい化学反応！
- 0-39: "Cross Cluster型" - 未知の領域への大冒険！

【診断の心得】
- どんな組み合わせでも必ずポジティブに！
- 技術的な共通点がなくても「CloudNativeへの情熱」で繋げる
- ユーモアを交えて楽しく（技術ジョークもOK）
- 参加者が「会ってみたい！」と思えるような診断に
- 具体的な会話のきっかけを必ず3つ以上提供

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
      "summary": "その人の特徴を30文字以内で要約"
    },
    "person2": {
      "name": "抽出した名前",
      "title": "役職（不明の場合は空文字）",
      "company": "所属（不明の場合は空文字）",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "30文字以内の人物要約"
    }
  },
  "analysis": {
    "common_skills": ["完全に一致する技術名のみをリスト"],
    "common_interests": ["共通する興味・関心事項"],
    "complementary_points": ["お互いを補完する技術や役割"],
    "score_breakdown": {
      "technical": 35,
      "interests": 25,
      "community": 15,
      "complementary": 10,
      "total": 85
    }
  },
  "diagnosis": {
    "type": "Service Mesh型",
    "score": 85,
    "message": "【占い風に楽しく】技術と性格の相性を説明。ユーモアを交えて、思わず笑顔になるような診断メッセージ。150文字以上で詳しく。",
    "conversationStarters": [
      "【参加者同士が投げかけ合える質問1】例：『○○の実装で一番苦労したことは？』",
      "【技術的な興味を引く質問2】例：『Kubernetesで一番好きな機能は？』",
      "【CloudNative Daysに関する質問3】例：『今回のイベントで一番楽しみなセッションは？』"
    ],
    "hiddenGems": "【占い師が見抜いた隠れた共通点】プロフィールには書いてないけど、きっと○○な共通点がありそう！という楽しい予測",
    "shareTag": "【SNS映えする楽しいタグ】#CNDxCnD で○○な2人が出会った！みたいな楽しいメッセージ"
  }
}

【最重要事項】
- 楽しさ最優先！厳密な分析より、参加者が笑顔になることが大切
- 情報が少なくても創造的に診断（「きっと○○が好きそう」等の推測OK）
- 必ず会話のきっかけになる具体的な質問を3つ以上
- CloudNative愛を共通の土台として活用
- 技術用語を使いつつも、親しみやすい表現で

【Prairie Card HTML 1】
${trimmedHtml1}

【Prairie Card HTML 2】
${trimmedHtml2}

上記HTMLから情報を抽出しつつ、足りない部分は楽しく創造的に補完してください。
参加者が「この診断面白い！相手と話してみたい！」と思えるような、
CloudNative Days Winter 2025を盛り上げる素敵な診断をお願いします！
`;
  }

  /**
   * 2人診断を実行
   */
  async generateDuoDiagnosis(urls: [string, string]): Promise<DiagnosisResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI APIキーが設定されていません');
    }

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
      
      const prompt = this.buildDiagnosisPrompt(html1, html2);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',  // コスト効率的で高速なモデルを使用
        messages: [
          {
            role: 'system',
            content: 'あなたはCloudNative Days Tokyo 2025の相性診断を行う専門AIです。与えられたHTMLから情報を正確に抽出し、詳細な相性診断を提供してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,  // 創造性と一貫性のバランス
        max_tokens: 2000,  // 十分な出力長
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
      throw error;
    }
  }

  /**
   * グループ診断を実行（将来の拡張用）
   */
  async generateGroupDiagnosis(urls: string[]): Promise<DiagnosisResult> {
    // TODO: グループ診断の実装
    throw new Error('グループ診断は未実装です');
  }
}

export default SimplifiedDiagnosisEngine;