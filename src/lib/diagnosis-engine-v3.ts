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
以下の手順で2つのPrairie CardのHTMLから相性診断を実施してください。

【処理手順】
1. 情報抽出フェーズ
   各HTMLから以下の情報を探して抽出してください：
   - 名前（og:title, title, h1タグなど）
   - 職業・役職（title, role, 職業関連のキーワード）
   - 所属組織（company, 会社, organization）
   - 技術スキル（skill, 技術名, プログラミング言語）
   - 興味・関心（interest, 好き, 興味がある）
   - 自己紹介文（bio, description, about）
   - コミュニティ活動（community, 活動, 参加）
   ※見つからない項目は「不明」として処理続行

2. 分析フェーズ
   以下の観点で相性を分析：
   - 技術スタックの重複度（0-40点）
     * 同じ技術: +10点
     * 関連技術: +5点（例: KubernetesとDocker）
   - 興味分野の一致度（0-30点）
     * 完全一致: +10点
     * 部分一致: +5点
   - コミュニティの関連性（0-20点）
   - 補完性（0-10点）
     * 異なるが補完的なスキル: +5点

3. 診断結果生成フェーズ
   スコアに基づいて相性タイプを決定：
   - 90-100: "Perfect Pod Pair型"（完璧な相性）
   - 75-89: "Service Mesh型"（強い連携）  
   - 60-74: "Sidecar Container型"（良い補完関係）
   - 40-59: "Different Namespace型"（接点を見つけよう）
   - 0-39: "Cross Cluster型"（新しい発見の機会）

【判断基準】
- CloudNative/Kubernetes関連の要素を重視
- 技術的な共通点を最重視
- 異なる分野でも補完関係があれば評価
- ネガティブな表現は避け、ポジティブに表現

【出力フォーマット】
必ず以下のJSON形式で返答してください：
{
  "extracted_profiles": {
    "person1": {
      "name": "抽出した名前",
      "title": "役職（不明の場合は空文字）",
      "company": "所属（不明の場合は空文字）",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "30文字以内の人物要約"
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
    "common_skills": ["共通スキル1", "共通スキル2"],
    "common_interests": ["共通の興味1"],
    "complementary_points": ["補完ポイント1"],
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
    "message": "2人の技術スタックは見事に連携し、CloudNativeの世界で素晴らしいシナジーを生み出します！KubernetesとDockerの知識を共有しながら、新しいマイクロサービスアーキテクチャを構築できそうです。",
    "conversationStarters": [
      "Kubernetesのオートスケーリング戦略について意見交換してみては？",
      "お互いのCI/CDパイプラインの工夫を共有してみましょう",
      "次のCNCFプロジェクトで協力できそうですね"
    ],
    "hiddenGems": "実は2人ともGo言語での開発経験があり、マイクロサービス設計の話で盛り上がりそう！",
    "shareTag": "#CNDxCnD で最高のService Meshペアを発見！Kubernetes愛が繋ぐ出会い✨"
  }
}

【Prairie Card HTML 1】
${trimmedHtml1}

【Prairie Card HTML 2】
${trimmedHtml2}
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