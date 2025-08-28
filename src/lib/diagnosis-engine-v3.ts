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
あなたはCloudNative Days Tokyo 2025の相性診断AIです。
Prairie Cardは参加者のプロフィール情報を含むHTMLページです。
以下の手順で2つのPrairie CardのHTMLから相性診断を実施してください。

【重要な抽出パターン】
Prairie Cardには以下のようなHTMLパターンで情報が含まれています：
- 名前: <meta property="og:title" content="○○のプロフィール">, <title>○○ - Prairie Card</title>
- 役職: class="title"やdata-field="title"を含む要素、「Engineer」「Developer」等のキーワード
- 会社: class="company"やdata-field="company"を含む要素、「株式会社」「Inc.」等
- スキル: class="skill"やdata-skills、技術名のリスト（Kubernetes, Docker, Go, Python等）
- 興味: class="interest"やdata-interests、「興味」「好き」を含むテキスト
- Bio: class="bio"やdata-bio、自己紹介的な長文テキスト
- SNS: href属性にtwitter.com、github.com、linkedin.com等を含むリンク

【処理手順】
1. 情報抽出フェーズ
   上記のパターンに基づいて各HTMLから情報を抽出してください：
   - 名前（必須: og:title、title、h1から確実に取得）
   - 職業・役職（classやdata属性、職種キーワードから）
   - 所属組織（company関連の要素から）
   - 技術スキル（技術用語を確実に抽出: 大文字の技術名、-jsや.pyなどの拡張子パターン）
   - 興味・関心（interest関連要素、「好き」「興味」を含む文章）
   - 自己紹介文（bio、about、descriptionから）
   - コミュニティ活動（community、meetup、勉強会などのキーワード）
   ※見つからない項目は空配列[]または空文字""として処理

2. 分析フェーズ
   以下の観点で相性を詳細に分析：
   - 技術スタックの重複度（0-40点）
     * 同じ技術名が完全一致: +10点
     * 関連技術: +5点（例: Kubernetes⇔Docker、React⇔TypeScript、AWS⇔CloudFormation）
     * 同じ分野の技術: +3点（例: フロントエンド同士、インフラ同士）
   - 興味分野の一致度（0-30点）
     * キーワードが完全一致: +10点
     * 関連する興味: +5点（例: DevOps⇔自動化、セキュリティ⇔監視）
   - コミュニティ・活動の共通性（0-20点）
     * 同じコミュニティ: +10点
     * 関連するコミュニティ: +5点
   - 補完性（0-10点）
     * フロントエンド×バックエンド: +5点
     * インフラ×アプリケーション: +5点
     * 異なるクラウドプロバイダーの知識: +3点

3. 診断結果生成フェーズ
   スコアに基づいて相性タイプを決定：
   - 90-100: "Perfect Pod Pair型"（完璧な相性）
   - 75-89: "Service Mesh型"（強い連携）  
   - 60-74: "Sidecar Container型"（良い補完関係）
   - 40-59: "Different Namespace型"（接点を見つけよう）
   - 0-39: "Cross Cluster型"（新しい発見の機会）

【重要な判断基準】
- CloudNative技術（Kubernetes, Docker, Service Mesh, CI/CD）の共通性を最優先
- プログラミング言語の一致（Go, Python, JavaScript, Rust等）
- クラウドプロバイダーの経験（AWS, GCP, Azure）
- DevOps/SRE関連の共通点（Terraform, Ansible, Prometheus等）
- OSS貢献やコミュニティ活動の共通性
- 必ずポジティブな表現を使い、改善機会も前向きに表現

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
    "message": "【必ず具体的な共通技術名を含めて】2人の関係性を説明。例: お二人ともKubernetesとGoの経験があり、CloudNativeな開発で素晴らしい協力関係を築けるでしょう！",
    "conversationStarters": [
      "【必ず抽出した具体的な技術名を使って】話題提案1",
      "【共通の興味分野に基づいた】話題提案2",
      "【CloudNative関連の具体的な】話題提案3"
    ],
    "hiddenGems": "実は2人ともGo言語での開発経験があり、マイクロサービス設計の話で盛り上がりそう！",
    "shareTag": "#CNDxCnD で最高のService Meshペアを発見！Kubernetes愛が繋ぐ出会い✨"
  }
}

【注意事項】
- HTMLから確実に情報を抽出すること
- 名前が取得できない場合は「プロフィール未設定」ではなく、titleタグやog:titleから必ず探すこと
- スキルは具体的な技術名（大文字で始まることが多い）を抽出すること
- 一般的な単語ではなく、技術用語を識別すること

【Prairie Card HTML 1】
${trimmedHtml1}

【Prairie Card HTML 2】
${trimmedHtml2}

必ず上記HTMLから実際の情報を抽出して診断してください。推測や一般論ではなく、HTMLに含まれる実際のデータを使用してください。
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