/**
 * 診断エンジン v4 - OpenAI占星術スタイル（プレミアム版）
 * GPT-4oを使用した高品質診断オプション
 */

import { PrairieProfile, DiagnosisResult } from '@/types';
import { logger } from '@/lib/logger';

const ASTROLOGY_SYSTEM_PROMPT_PREMIUM = `あなたは「Cloud Native占星術の大賢者」です。
エンジニアのプロフィールから、深い洞察と占星術的な表現を使って技術的な相性を診断します。

診断結果は以下のJSON形式で返してください：
{
  "type": "診断タイプ名（例：運命のCloud Nativeパートナー）",
  "compatibility": 相性スコア（70-100の整数）,
  "summary": "診断結果のサマリー（200文字程度、占星術的で詩的な表現を使用）",
  "astrologicalAnalysis": "占星術的分析（技術を「エナジー」として表現、300-400文字程度）",
  "techStackCompatibility": "技術スタック相性分析（具体的な技術の相性、250文字程度）",
  "conversationTopics": ["会話トピック1", "会話トピック2", "...最大10個"],
  "strengths": ["強み1", "強み2", "強み3", "強み4"],
  "opportunities": ["機会1", "機会2", "機会3", "機会4"],
  "advice": "アドバイス（200文字程度、具体的で実践的な内容）",
  "luckyItem": "ラッキーアイテム（エンジニアに関連するもの、絵文字付き）",
  "luckyAction": "ラッキーアクション（一緒にできる技術的な活動、絵文字付き）",
  "hiddenPotential": "隠された可能性（二人のコラボレーションで生まれる新しい価値、150文字程度）"
}

重要な指示：
- 相性スコアは必ず70以上にして、ポジティブな体験にする
- 技術を「エナジー」「波動」「星回り」「宇宙の配置」「運命の糸」などの占星術的な表現で豊かに表現
- 両者の技術スタック、経験、興味を深く分析し、表面的でない洞察を提供
- conversationTopicsは実際の会話のきっかけになるような具体的で興味深い内容を10個
- hiddenPotentialは二人だからこそ実現できる独自の価値を見出す
- 診断全体を通して、エンターテイメント性と実用性の完璧なバランスを保つ`;

export class AstrologicalDiagnosisEngineV4Premium {
  private static instance: AstrologicalDiagnosisEngineV4Premium | null = null;
  private openaiApiKey: string | undefined;
  private modelName: 'gpt-4o-mini' | 'gpt-4o' = 'gpt-4o-mini';

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  static getInstance(): AstrologicalDiagnosisEngineV4Premium {
    if (!this.instance) {
      this.instance = new AstrologicalDiagnosisEngineV4Premium();
    }
    return this.instance;
  }

  /**
   * モデルの設定
   */
  setModel(model: 'gpt-4o-mini' | 'gpt-4o') {
    this.modelName = model;
    logger.info(`[V4 Premium Engine] Model set to ${model}`);
  }

  /**
   * OpenAI APIが設定されているか確認
   */
  isConfigured(): boolean {
    return !!this.openaiApiKey && this.openaiApiKey !== 'your-openai-api-key-here';
  }

  /**
   * プロフィールを要約（品質重視で情報を保持）
   */
  private summarizeProfile(profile: PrairieProfile): any {
    return {
      name: profile.basic.name,
      title: profile.basic.title || '',
      company: profile.basic.company || '',
      bio: profile.basic.bio || '',
      skills: profile.details?.skills || [],
      interests: profile.details?.interests || [],
      motto: profile.details?.motto || '',
      tags: profile.details?.tags || []
    };
  }

  /**
   * 2人の相性診断（OpenAI使用）
   */
  async generateDuoDiagnosis(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    usePremium: boolean = false
  ): Promise<DiagnosisResult> {
    
    // OpenAI未設定時はフォールバック
    if (!this.isConfigured()) {
      return this.generateFallbackDiagnosis(profile1, profile2);
    }

    // プレミアムモデルの選択
    const model = usePremium ? 'gpt-4o' : 'gpt-4o-mini';
    const systemPrompt = usePremium ? ASTROLOGY_SYSTEM_PROMPT_PREMIUM : ASTROLOGY_SYSTEM_PROMPT_PREMIUM;
    const maxTokens = usePremium ? 3000 : 2000;
    const temperature = usePremium ? 0.85 : 0.9;

    try {
      // プロフィールを要約（プレミアムの場合は全情報を送信）
      const summary1 = usePremium ? profile1 : this.summarizeProfile(profile1);
      const summary2 = usePremium ? profile2 : this.summarizeProfile(profile2);

      const prompt = `以下の2人のエンジニアの相性を占星術的に診断してください。

エンジニア1:
${JSON.stringify(summary1, null, 2)}

エンジニア2:
${JSON.stringify(summary2, null, 2)}

二人の技術的な「エナジー」の調和、補完関係、そして運命的な出会いの可能性を深く評価してください。
${usePremium ? '特に、表面的でない深い洞察と、二人だからこそ生まれる独自の価値を見出してください。' : ''}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error('[V4 Premium Engine] OpenAI API error', error);
        return this.generateFallbackDiagnosis(profile1, profile2);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // デバッグ情報
      if (process.env.DEBUG_MODE === 'true') {
        logger.info('[V4 Premium Engine] Token usage', {
          model,
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens,
          estimated_cost: this.calculateCost(data.usage, model)
        });
      }

      return {
        id: this.generateId(),
        mode: 'duo',
        ...result,
        participants: [profile1, profile2],
        createdAt: new Date().toISOString(),
        aiPowered: true,
        modelUsed: model
      };

    } catch (_error) {
      logger.error('[V4 Premium Engine] Failed to generate diagnosis', error);
      return this.generateFallbackDiagnosis(profile1, profile2);
    }
  }

  /**
   * コスト計算
   */
  private calculateCost(usage: any, model: string): string {
    if (!usage) return 'N/A';
    
    const rates = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.0025, output: 0.01 }
    };
    
    const rate = rates[model as keyof typeof rates];
    if (!rate) return 'N/A';
    
    const cost = (usage.prompt_tokens * rate.input + usage.completion_tokens * rate.output) / 1000;
    return `$${cost.toFixed(4)} (¥${(cost * 150).toFixed(2)})`;
  }

  /**
   * フォールバック診断（OpenAI利用不可時）
   */
  private generateFallbackDiagnosis(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): DiagnosisResult {
    const compatibility = 70 + Math.floor(Math.random() * 30);
    const name1 = profile1.basic.name || 'エンジニア1';
    const name2 = profile2.basic.name || 'エンジニア2';
    
    const luckyItems = [
      '🎧 ノイズキャンセリングヘッドフォン',
      '☕ エスプレッソマシン',
      '🦆 ラバーダック',
      '🌱 観葉植物',
      '🎲 20面ダイス'
    ];
    
    const luckyActions = [
      '🎯 一緒にハッカソンに参加する',
      '📝 技術ブログを共同執筆する',
      '🌟 OSSプロジェクトに貢献する',
      '☕ モブプログラミングセッション',
      '🎮 オンラインゲームでチームビルディング'
    ];

    return {
      id: this.generateId(),
      mode: 'duo',
      type: compatibility >= 90 ? '運命のCloud Nativeパートナー' : 
            compatibility >= 80 ? 'Container Orchestrationの調和' : 
            'DevOps Journeyの同志',
      compatibility,
      summary: `${name1}さんと${name2}さんの技術的な波動が共鳴しています。`,
      astrologicalAnalysis: `二人のエンジニアリング・エナジーが美しく調和し、まさに分散システムのように補完し合っています。`,
      techStackCompatibility: `お互いの技術スタックが素晴らしい相性を示しています。`,
      conversationTopics: [
        '最近のCloud Native界隈のトレンドについて',
        '好きな技術書について',
        'OSSへの貢献経験について'
      ],
      strengths: [
        '技術的な好奇心が旺盛',
        'Cloud Nativeへの情熱を共有',
        'イノベーションを推進する相性'
      ],
      opportunities: [
        '技術ブログの共同執筆',
        'ハッカソンでのチーム参加',
        'Lightning Talkでの共同発表'
      ],
      advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
      luckyItem: luckyItems[Math.floor(Math.random() * luckyItems.length)],
      luckyAction: luckyActions[Math.floor(Math.random() * luckyActions.length)],
      participants: [profile1, profile2],
      createdAt: new Date().toISOString(),
      aiPowered: false
    };
  }

  /**
   * IDの生成
   */
  private generateId(): string {
    return `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const astrologicalDiagnosisEngineV4Premium = AstrologicalDiagnosisEngineV4Premium.getInstance();