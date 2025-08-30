/**
 * 診断エンジン v4 - OpenAI占星術スタイル
 * Cloud Nativeと占星術を融合した、AI駆動の創造的な診断エンジン
 */

import { PrairieProfile, DiagnosisResult } from '@/types';
import { logger } from '@/lib/logger';

const ASTROLOGY_SYSTEM_PROMPT = `あなたは「Cloud Native占星術師」です。
エンジニアのプロフィールから、占星術的な表現を使って技術的な相性を診断します。

診断結果は以下のJSON形式で返してください：
{
  "type": "診断タイプ名（例：運命のCloud Nativeパートナー）",
  "compatibility": 相性スコア（70-100の整数）,
  "summary": "診断結果のサマリー（150文字程度、占星術的で詩的な表現を使用）",
  "astrologicalAnalysis": "占星術的分析（技術を「エナジー」として表現、250-300文字程度）",
  "techStackCompatibility": "技術スタック相性分析（具体的な技術の相性、200文字程度）",
  "conversationTopics": ["会話トピック1", "会話トピック2", "...最大7個"],
  "strengths": ["強み1", "強み2", "強み3"],
  "opportunities": ["機会1", "機会2", "機会3"],
  "advice": "アドバイス（150文字程度、具体的で実践的な内容）",
  "luckyItem": "ラッキーアイテム（エンジニアに関連するもの、絵文字付き）",
  "luckyAction": "ラッキーアクション（一緒にできる技術的な活動、絵文字付き）"
}

重要な指示：
- 相性スコアは必ず70以上にして、ポジティブな体験にする
- 技術を「エナジー」「波動」「星回り」「宇宙の配置」などの占星術的な表現で豊かに表現
- Container Orchestration、分散システム、マイクロサービスなどの技術用語を占星術的にクリエイティブに表現
- 両者の技術スタック、経験、興味を深く分析し、具体的な相性を導き出す
- conversationTopicsは実際の会話のきっかけになるような具体的で興味深い内容にする
- ラッキーアイテムはエンジニアが共感できるもの（ラバーダック、メカニカルキーボード、Vimステッカー等）
- ラッキーアクションは実際にできる技術活動（ハッカソン参加、OSS貢献、ペアプロ等）
- 診断全体を通して、エンターテイメント性と実用性のバランスを保つ`;

export class AstrologicalDiagnosisEngineV4 {
  private static instance: AstrologicalDiagnosisEngineV4 | null = null;
  private openaiApiKey: string | undefined;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  static getInstance(): AstrologicalDiagnosisEngineV4 {
    if (!this.instance) {
      this.instance = new AstrologicalDiagnosisEngineV4();
    }
    return this.instance;
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
      title: profile.basic.title?.substring(0, 100) || '', // 肩書きは重要なので100文字まで
      company: profile.basic.company?.substring(0, 50) || '', // 会社名も50文字まで保持
      bio: profile.basic.bio?.substring(0, 200) || '', // 自己紹介は200文字まで（重要な情報源）
      skills: (profile.details?.skills || []).slice(0, 10), // 上位10個のスキル（技術の多様性を伝える）
      interests: (profile.details?.interests || []).slice(0, 5), // 上位5つの興味（豊かな人物像）
      motto: profile.details?.motto?.substring(0, 100) || '', // モットーも重要な個性
      tags: (profile.details?.tags || []).slice(0, 5) // タグ情報も追加
    };
  }

  /**
   * 2人の相性診断（OpenAI使用）
   */
  async generateDuoDiagnosis(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): Promise<DiagnosisResult> {
    
    // OpenAI未設定時はフォールバック
    if (!this.isConfigured()) {
      return this.generateFallbackDiagnosis(profile1, profile2);
    }

    try {
      // プロフィールを要約してトークン削減
      const summary1 = this.summarizeProfile(profile1);
      const summary2 = this.summarizeProfile(profile2);

      const prompt = `以下の2人のエンジニアの相性を占星術的に診断してください。

エンジニア1:
${JSON.stringify(summary1, null, 2)}

エンジニア2:
${JSON.stringify(summary2, null, 2)}

二人の技術的な「エナジー」の調和、補完関係、そして運命的な出会いの可能性を評価してください。`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: ASTROLOGY_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9, // より創造的で豊かな出力
          max_tokens: 2000,  // 豊かな診断結果のために十分なトークン
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error('[V4 Engine] OpenAI API error', error);
        return this.generateFallbackDiagnosis(profile1, profile2);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // デバッグ情報
      if (process.env.DEBUG_MODE === 'true') {
        logger.info('[V4 Engine] Token usage', {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens
        });
      }

      return {
        id: this.generateId(),
        mode: 'duo',
        ...result,
        participants: [profile1, profile2],
        createdAt: new Date().toISOString(),
        aiPowered: true
      };

    } catch (error) {
      logger.error('[V4 Engine] Failed to generate diagnosis', error);
      return this.generateFallbackDiagnosis(profile1, profile2);
    }
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

export const astrologicalDiagnosisEngineV4 = AstrologicalDiagnosisEngineV4.getInstance();