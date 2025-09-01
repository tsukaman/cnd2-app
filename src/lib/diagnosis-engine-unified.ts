/**
 * 統合診断エンジン
 * すべての診断スタイルを1つのエンジンに統合
 * トークン消費を抑えつつ、多様で面白い診断を生成
 */

import { PrairieProfile, DiagnosisResult, FortuneTelling } from '@/types';
import { logger } from '@/lib/logger';
import { 
  isFallbackAllowed, 
  getFallbackScoreRange, 
  generateFallbackScore, 
  getFallbackWarning,
  FALLBACK_CONFIG 
} from '@/lib/constants/fallback';

/**
 * 診断スタイル
 */
export type DiagnosisStyle = 'astrological' | 'fortune' | 'technical' | 'creative';

/**
 * 設定定数
 */
const DIAGNOSIS_CONFIG = {
  TEMPERATURE: {
    BASE: 0.85,
    VARIANCE: 0.1
  },
  COMPATIBILITY: {
    MIN: 50,
    MAX: 100
  },
  MAX_TOKENS: {
    'gpt-4o-mini': 2000,
    'gpt-4o': 3000
  }
} as const;

/**
 * モデルタイプ
 */
export type ModelType = 'gpt-4o-mini' | 'gpt-4o';

/**
 * 診断オプション
 */
export interface DiagnosisOptions {
  style?: DiagnosisStyle;
  model?: ModelType;
  temperature?: number;
  enableFortuneTelling?: boolean;
}

/**
 * スタイル別プロンプト設定
 */
const STYLE_PROMPTS: Record<DiagnosisStyle, string> = {
  astrological: `あなたは「Cloud Native占星術師」です。
エンジニアのプロフィールから、占星術的な表現を使って技術的な相性を診断します。
技術を「エナジー」「波動」「星回り」「宇宙の配置」などの占星術的な表現で豊かに表現し、
Container Orchestration、分散システム、マイクロサービスなどの技術用語を占星術的にクリエイティブに表現してください。`,
  
  fortune: `あなたは「CND²の運命鑑定士」です。
エンジニアの技術プロフィールから、運命的な出会いと可能性を診断します。
点取り占いのような親しみやすい形式で、総合運・技術運・コラボ運・成長運を評価し、
ラッキーアイテムやラッキーアクションを提案してください。`,
  
  technical: `あなたは「Cloud Native技術アナリスト」です。
エンジニアのスキルセットと経験から、技術的な相性と協働の可能性を分析します。
具体的な技術スタックの相補性、学習機会、プロジェクトでの役割分担などを
データドリブンかつ建設的に評価してください。`,
  
  creative: `あなたは「エンジニアリング・クリエイティブディレクター」です。
技術者同士の化学反応から生まれる、予想外のイノベーションを見出します。
型にはまらない視点で、二人が組むことで生まれる新しい価値、
思いもよらないプロジェクトアイデア、ユニークなコラボレーションの形を提案してください。`
};

/**
 * 診断結果フォーマット
 */
const RESULT_FORMAT = `{
  "type": "診断タイプ名（創造的で楽しい名前）",
  "compatibility": 相性スコア（50-100の整数）,
  "summary": "診断結果のサマリー（150-200文字、スタイルに応じた表現）",
  "astrologicalAnalysis": "詳細分析（250-300文字、スタイルに応じた深い洞察）",
  "techStackCompatibility": "技術的相性（200文字、具体的な技術の相性）",
  "conversationTopics": ["会話トピック1", "会話トピック2", "...最大7個"],
  "strengths": ["強み1", "強み2", "強み3"],
  "opportunities": ["機会1", "機会2", "機会3"],
  "advice": "アドバイス（150文字、実践的で前向きな内容）",
  "luckyItem": "ラッキーアイテム（エンジニアに関連、絵文字付き）",
  "luckyAction": "ラッキーアクション（技術活動、絵文字付き）",
  "fortuneTelling": {
    "overall": 総合運（50-100）,
    "tech": 技術運（50-100）,
    "collaboration": コラボ運（50-100）,
    "growth": 成長運（50-100）,
    "message": "運勢メッセージ（100文字程度）"
  }
}`;

/**
 * プロフィールから抽出する関連情報の型
 */
interface ExtractedProfileInfo {
  name: string;
  title: string;
  company: string;
  bio: string;
  skills: string[];
  interests: string[];
  motto: string;
  tags: string[];
  certifications: string[];
  communities: string[];
}

/**
 * 統合診断エンジンクラス
 */
export class UnifiedDiagnosisEngine {
  private static instance: UnifiedDiagnosisEngine | null = null;
  private openaiApiKey: string | undefined;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  static getInstance(): UnifiedDiagnosisEngine {
    if (!this.instance) {
      this.instance = new UnifiedDiagnosisEngine();
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
   * 2人の相性診断
   */
  async generateDuoDiagnosis(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    options: DiagnosisOptions = {}
  ): Promise<DiagnosisResult> {
    const {
      style = 'creative',
      model = 'gpt-4o-mini',
      temperature = DIAGNOSIS_CONFIG.TEMPERATURE.BASE + Math.random() * DIAGNOSIS_CONFIG.TEMPERATURE.VARIANCE, // 0.85-0.95でランダム化
      enableFortuneTelling = true
    } = options;

    // OpenAI未設定時は動的フォールバック
    if (!this.isConfigured()) {
      return this.generateDynamicFallback(profile1, profile2, style, enableFortuneTelling);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(style, enableFortuneTelling);
      const userPrompt = this.buildUserPrompt(profile1, profile2);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: DIAGNOSIS_CONFIG.MAX_TOKENS[model],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error('[Unified Engine] OpenAI API error', error);
        return this.generateDynamicFallback(profile1, profile2, style, enableFortuneTelling);
      }

      const data = await response.json();
      
      // OpenAIレスポンスのバリデーション
      if (!data.choices || data.choices.length === 0) {
        logger.error('[Unified Engine] No choices in OpenAI response');
        return this.generateDynamicFallback(profile1, profile2, style, enableFortuneTelling);
      }
      
      // JSON.parseのエラーハンドリング
      let result;
      try {
        result = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        logger.error('[Unified Engine] Failed to parse AI response', parseError);
        return this.generateDynamicFallback(profile1, profile2, style, enableFortuneTelling);
      }

      return {
        id: this.generateId(),
        mode: 'duo',
        ...result,
        participants: [profile1, profile2],
        createdAt: new Date().toISOString(),
        aiPowered: true,
        modelUsed: model,
        style
      };

    } catch (error) {
      logger.error('[Unified Engine] Failed to generate diagnosis', error);
      return this.generateDynamicFallback(profile1, profile2, style, enableFortuneTelling);
    }
  }

  /**
   * グループ診断（3人以上）
   */
  async generateGroupDiagnosis(
    profiles: PrairieProfile[],
    options: DiagnosisOptions = {}
  ): Promise<DiagnosisResult> {
    const {
      style = 'creative',
      model = 'gpt-4o-mini',
      temperature = DIAGNOSIS_CONFIG.TEMPERATURE.BASE + Math.random() * DIAGNOSIS_CONFIG.TEMPERATURE.VARIANCE,
      enableFortuneTelling = true
    } = options;

    if (!this.isConfigured()) {
      return this.generateGroupFallback(profiles, style, enableFortuneTelling);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(style, enableFortuneTelling);
      const userPrompt = this.buildGroupPrompt(profiles);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: DIAGNOSIS_CONFIG.MAX_TOKENS[model],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        return this.generateGroupFallback(profiles, style, enableFortuneTelling);
      }

      const data = await response.json();
      
      // OpenAIレスポンスのバリデーション
      if (!data.choices || data.choices.length === 0) {
        logger.error('[Unified Engine] No choices in OpenAI response');
        return this.generateGroupFallback(profiles, style, enableFortuneTelling);
      }
      
      // JSON.parseのエラーハンドリング
      let result;
      try {
        result = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        logger.error('[Unified Engine] Failed to parse AI response', parseError);
        return this.generateGroupFallback(profiles, style, enableFortuneTelling);
      }

      return {
        id: this.generateId(),
        mode: 'group',
        ...result,
        participants: profiles,
        createdAt: new Date().toISOString(),
        aiPowered: true,
        modelUsed: model,
        style
      };

    } catch (error) {
      logger.error('[Unified Engine] Failed to generate group diagnosis', error);
      return this.generateGroupFallback(profiles, style, enableFortuneTelling);
    }
  }

  /**
   * システムプロンプトの構築
   */
  private buildSystemPrompt(style: DiagnosisStyle, enableFortuneTelling: boolean): string {
    const basePrompt = STYLE_PROMPTS[style];
    const formatInstruction = `
診断結果は以下のJSON形式で返してください：
${RESULT_FORMAT}

重要な指示：
- 相性スコアは必ず85以上にして、ポジティブな体験にする
- 各参加者のプロフィール情報を深く分析し、表面的でない洞察を提供
- conversationTopicsは実際の会話のきっかけになるような具体的で興味深い内容
- ラッキーアイテムとアクションは実際のエンジニアが共感できるもの
- 同じパターンの繰り返しを避け、創造的で多様な表現を使用
${enableFortuneTelling ? '- fortuneTellingセクションを必ず含める' : '- fortuneTellingセクションは省略'}`;

    return `${basePrompt}\n\n${formatInstruction}`;
  }

  /**
   * ユーザープロンプトの構築（2人）
   */
  private buildUserPrompt(profile1: PrairieProfile, profile2: PrairieProfile): string {
    return `以下の2人のエンジニアの相性を診断してください。

エンジニア1:
${JSON.stringify(this.extractRelevantInfo(profile1), null, 2)}

エンジニア2:
${JSON.stringify(this.extractRelevantInfo(profile2), null, 2)}

両者の技術的背景、興味、経験、価値観を深く分析し、
表面的でない洞察と、二人だからこそ生まれる独自の価値を見出してください。`;
  }

  /**
   * グループプロンプトの構築
   */
  private buildGroupPrompt(profiles: PrairieProfile[]): string {
    const members = profiles.map((p, i) => 
      `エンジニア${i + 1}:\n${JSON.stringify(this.extractRelevantInfo(p), null, 2)}`
    ).join('\n\n');

    return `以下の${profiles.length}人のエンジニアグループの相性を診断してください。

${members}

グループ全体のダイナミクス、チームとしての強み、
そして各メンバーが持ち寄る独自の価値を評価してください。`;
  }

  /**
   * プロフィールから関連情報を抽出
   */
  private extractRelevantInfo(profile: PrairieProfile): ExtractedProfileInfo {
    return {
      name: profile.basic.name,
      title: profile.basic.title || '',
      company: profile.basic.company || '',
      bio: profile.basic.bio || '',
      skills: profile.details?.skills || [],
      interests: profile.details?.interests || [],
      motto: profile.details?.motto || '',
      tags: profile.details?.tags || [],
      certifications: profile.details?.certifications || [],
      communities: profile.details?.communities || []
    };
  }

  /**
   * 動的フォールバック診断（プロフィール情報を活用）
   */
  private generateDynamicFallback(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    style: DiagnosisStyle,
    enableFortuneTelling: boolean
  ): DiagnosisResult {
    // 開発環境でフォールバックが無効の場合はエラーを投げる
    if (!isFallbackAllowed()) {
      const error = new Error('Fallback diagnosis is disabled in development. Please configure OpenAI API key.');
      logger.error('[Unified Engine]', error);
      throw error;
    }
    
    // 環境に応じたスコアを生成
    const compatibility = generateFallbackScore();
    
    // 開発環境で警告を出力
    const warning = getFallbackWarning();
    if (warning) {
      logger.warn('[Unified Engine]', warning);
    }
    const name1 = profile1.basic.name || 'エンジニア1';
    const name2 = profile2.basic.name || 'エンジニア2';
    
    // プロフィールから共通点を見つける
    const commonSkills = this.findCommonElements(
      profile1.details?.skills || [],
      profile2.details?.skills || []
    );
    const commonInterests = this.findCommonElements(
      profile1.details?.interests || [],
      profile2.details?.interests || []
    );
    
    // スタイルに応じた診断タイプ名を生成
    const typeNames = {
      astrological: [
        `${commonSkills[0] || 'Cloud Native'}座の調和`,
        `${commonInterests[0] || 'Tech'}の星回り`,
        'Container Orchestrationの共鳴'
      ],
      fortune: [
        '運命の技術パートナー',
        'イノベーションの導き手',
        'スケールする絆'
      ],
      technical: [
        '相補的スキルセット',
        '技術シナジーの実現',
        'アーキテクチャの融合'
      ],
      creative: [
        '予想外の化学反応',
        'クリエイティブ・フュージョン',
        'イノベーション・カタリスト'
      ]
    };
    
    // 動的にラッキーアイテムを生成（プロフィールから）
    const luckyItems = this.generateLuckyItems(profile1, profile2);
    const luckyActions = this.generateLuckyActions(commonSkills, commonInterests);
    
    // 会話トピックを動的生成
    const conversationTopics = this.generateConversationTopics(
      profile1, profile2, commonSkills, commonInterests
    );
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const typePrefix = isDevelopment ? '[FALLBACK] ' : '';
    
    const result: DiagnosisResult = {
      id: isDevelopment ? `${FALLBACK_CONFIG.ID_PREFIX}${this.generateId()}` : this.generateId(),
      mode: 'duo',
      type: typePrefix + typeNames[style][Math.floor(Math.random() * typeNames[style].length)],
      compatibility,
      summary: (isDevelopment ? '[FALLBACK] ' : '') + this.generateDynamicSummary(name1, name2, style, commonSkills),
      astrologicalAnalysis: this.generateDynamicAnalysis(profile1, profile2, style),
      techStackCompatibility: this.generateTechCompatibility(profile1, profile2),
      conversationTopics,
      strengths: this.generateStrengths(profile1, profile2),
      opportunities: this.generateOpportunities(profile1, profile2),
      advice: this.generateAdvice(profile1, profile2, style),
      luckyItem: luckyItems[Math.floor(Math.random() * luckyItems.length)],
      luckyAction: luckyActions[Math.floor(Math.random() * luckyActions.length)],
      participants: [profile1, profile2],
      createdAt: new Date().toISOString(),
      aiPowered: false,
      ...(isDevelopment ? { metadata: FALLBACK_CONFIG.METADATA } : {}),
      ...(warning ? { warning } : {})
    };
    
    if (enableFortuneTelling) {
      result.fortuneTelling = this.generateFortuneTelling(compatibility);
    }
    
    return result;
  }

  /**
   * グループ用フォールバック
   */
  private generateGroupFallback(
    profiles: PrairieProfile[],
    style: DiagnosisStyle,
    enableFortuneTelling: boolean
  ): DiagnosisResult {
    // 開発環境でフォールバックが無効の場合はエラーを投げる
    if (!isFallbackAllowed()) {
      const error = new Error('Fallback diagnosis is disabled in development. Please configure OpenAI API key.');
      logger.error('[Unified Engine]', error);
      throw error;
    }
    
    // 環境に応じたスコアを生成
    const compatibility = generateFallbackScore();
    
    // 開発環境で警告を出力
    const warning = getFallbackWarning();
    if (warning) {
      logger.warn('[Unified Engine]', warning);
    }
    const names = profiles.map(p => p.basic.name || `メンバー${profiles.indexOf(p) + 1}`);
    
    // グループの共通スキルと興味を分析
    const allSkills = profiles.flatMap(p => p.details?.skills || []);
    const allInterests = profiles.flatMap(p => p.details?.interests || []);
    const commonElements = this.findMostCommon(allSkills.concat(allInterests));
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const typePrefix = isDevelopment ? '[FALLBACK] ' : '';
    
    const result: DiagnosisResult = {
      id: isDevelopment ? `${FALLBACK_CONFIG.ID_PREFIX}${this.generateId()}` : this.generateId(),
      mode: 'group',
      type: typePrefix + `${profiles.length}人の${commonElements[0] || 'Tech'}チーム`,
      compatibility,
      summary: (isDevelopment ? '[FALLBACK] ' : '') + `${names.join('、')}の${profiles.length}人が素晴らしいチームダイナミクスを形成しています。`,
      astrologicalAnalysis: `グループ全体のエナジーが調和し、各メンバーの強みが相乗効果を生み出しています。`,
      techStackCompatibility: `多様なスキルセットが完璧に補完し合い、あらゆる技術課題に対応可能です。`,
      conversationTopics: this.generateGroupTopics(profiles),
      strengths: [`${profiles.length}人の多様性`, '相補的なスキルセット', 'チームワークの可能性'],
      opportunities: ['大規模プロジェクトへの挑戦', 'ハッカソンでの優勝', '新サービスの立ち上げ'],
      advice: `各メンバーの得意分野を活かした役割分担で、大きな成果を生み出せるでしょう。`,
      luckyItem: '🎯 チームビルディングボードゲーム',
      luckyAction: '🚀 全員でのモブプログラミングセッション',
      participants: profiles,
      createdAt: new Date().toISOString(),
      aiPowered: false,
      ...(isDevelopment ? { metadata: FALLBACK_CONFIG.METADATA } : {}),
      ...(warning ? { warning } : {})
    };
    
    if (enableFortuneTelling) {
      result.fortuneTelling = this.generateFortuneTelling(compatibility);
    }
    
    return result;
  }

  /**
   * 共通要素を見つける
   */
  private findCommonElements(arr1: string[], arr2: string[]): string[] {
    return arr1.filter(item => arr2.includes(item));
  }

  /**
   * 最も頻出する要素を見つける
   */
  private findMostCommon(arr: string[]): string[] {
    const counts = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item)
      .slice(0, 3);
  }

  /**
   * ラッキーアイテムを動的生成
   */
  private generateLuckyItems(profile1: PrairieProfile, profile2: PrairieProfile): string[] {
    const items = ['🎧 ノイズキャンセリングヘッドフォン', '☕ エスプレッソマシン'];
    
    // スキルに基づいてアイテムを追加
    const allSkills = [...(profile1.details?.skills || []), ...(profile2.details?.skills || [])];
    if (allSkills.some(s => s.toLowerCase().includes('docker') || s.toLowerCase().includes('kubernetes'))) {
      items.push('🐳 Dockerステッカー');
    }
    if (allSkills.some(s => s.toLowerCase().includes('vim'))) {
      items.push('⌨️ メカニカルキーボード');
    }
    if (allSkills.some(s => s.toLowerCase().includes('python'))) {
      items.push('🐍 Pythonぬいぐるみ');
    }
    if (allSkills.some(s => s.toLowerCase().includes('rust'))) {
      items.push('🦀 Rustマスコット');
    }
    
    return items.length > 0 ? items : ['🦆 ラバーダック', '🌱 観葉植物', '🎲 20面ダイス'];
  }

  /**
   * ラッキーアクションを動的生成
   */
  private generateLuckyActions(commonSkills: string[], commonInterests: string[]): string[] {
    const actions = [];
    
    if (commonSkills.length > 0) {
      actions.push(`🎯 ${commonSkills[0]}のベストプラクティスを共有`);
    }
    if (commonInterests.length > 0) {
      actions.push(`📚 ${commonInterests[0]}についての勉強会を開催`);
    }
    
    actions.push(
      '🎯 一緒にハッカソンに参加する',
      '📝 技術ブログを共同執筆する',
      '🌟 OSSプロジェクトに貢献する',
      '☕ ペアプログラミングセッション',
      '🎮 オンラインゲームでチームビルディング',
      '🚀 新しいフレームワークを一緒に学ぶ'
    );
    
    return actions;
  }

  /**
   * 会話トピックを動的生成
   */
  private generateConversationTopics(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    commonSkills: string[],
    commonInterests: string[]
  ): string[] {
    const topics = [];
    
    if (commonSkills.length > 0) {
      topics.push(`${commonSkills[0]}の最新トレンドについて`);
    }
    if (commonInterests.length > 0) {
      topics.push(`${commonInterests[0]}への情熱について`);
    }
    if (profile1.basic.company && profile2.basic.company) {
      topics.push('それぞれの会社の技術文化について');
    }
    if (profile1.details?.motto || profile2.details?.motto) {
      topics.push('エンジニアとしてのモットーや哲学');
    }
    
    topics.push(
      '最近取り組んでいる技術チャレンジ',
      '印象に残っているプロジェクト経験',
      'キャリアの転機となった出来事'
    );
    
    return topics.slice(0, 7);
  }

  /**
   * グループトピックを生成
   */
  private generateGroupTopics(profiles: PrairieProfile[]): string[] {
    const topics = [
      `${profiles.length}人それぞれの得意分野の共有`,
      'チームとして取り組みたいプロジェクト',
      '各メンバーの技術的なバックグラウンド'
    ];
    
    const companies = [...new Set(profiles.map(p => p.basic.company).filter(Boolean))];
    if (companies.length > 1) {
      topics.push('異なる企業文化から学べること');
    }
    
    return topics;
  }

  /**
   * 動的サマリー生成
   */
  private generateDynamicSummary(
    name1: string,
    name2: string,
    style: DiagnosisStyle,
    commonSkills: string[]
  ): string {
    const templates = {
      astrological: [
        `${name1}さんと${name2}さんの技術的な星が美しく輝き合っています。`,
        `二人のエンジニアリング・オーラが完璧に調和しています。`,
        `宇宙が導いた、運命的な技術パートナーシップです。`
      ],
      fortune: [
        `${name1}さんと${name2}さんに、大きな幸運が訪れています！`,
        `二人の出会いは、技術的な成功への扉を開きます。`,
        `運命の歯車が、素晴らしい方向に動き始めました。`
      ],
      technical: [
        `${name1}さんと${name2}さんのスキルセットが理想的に補完し合います。`,
        `技術的シナジーが期待できる、優れた組み合わせです。`,
        `両者の専門性が、高い相乗効果を生み出します。`
      ],
      creative: [
        `${name1}さんと${name2}さんの出会いが、新しい可能性を開きます。`,
        `予想を超えた化学反応が、イノベーションを生み出すでしょう。`,
        `二人の創造性が融合し、素晴らしいものが生まれそうです。`
      ]
    };
    
    const base = templates[style][Math.floor(Math.random() * templates[style].length)];
    if (commonSkills.length > 0) {
      return `${base} 特に${commonSkills[0]}での協力が期待できます。`;
    }
    return base;
  }

  /**
   * 動的分析生成
   */
  private generateDynamicAnalysis(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    style: DiagnosisStyle
  ): string {
    const skill1 = profile1.details?.skills[0] || 'プログラミング';
    const skill2 = profile2.details?.skills[0] || 'システム設計';
    
    const templates = {
      astrological: `${profile1.basic.name}さんの${skill1}のエナジーと、${profile2.basic.name}さんの${skill2}の波動が美しく共鳴しています。まるで惑星の配置が完璧に整ったかのような、運命的な技術の調和が生まれています。`,
      fortune: `お二人の技術運が最高潮に達しています！${skill1}と${skill2}の組み合わせが、思いもよらない成功を引き寄せるでしょう。今こそ大きなチャレンジに挑む絶好のタイミングです。`,
      technical: `${profile1.basic.name}さんの${skill1}スキルと${profile2.basic.name}さんの${skill2}能力が、実践的なプロジェクトで高い効果を発揮します。技術的な課題解決において、理想的な分業と協力が可能です。`,
      creative: `${skill1}と${skill2}という一見異なるアプローチが、実は革新的なソリューションを生み出す鍵となります。お二人の視点の違いこそが、最大の強みとなるでしょう。`
    };
    
    return templates[style];
  }

  /**
   * 技術的相性を生成
   */
  private generateTechCompatibility(profile1: PrairieProfile, profile2: PrairieProfile): string {
    const skills1 = profile1.details?.skills || [];
    const skills2 = profile2.details?.skills || [];
    const common = this.findCommonElements(skills1, skills2);
    
    if (common.length > 0) {
      return `共通の技術基盤（${common.slice(0, 2).join('、')}）により、スムーズなコミュニケーションと効率的な開発が可能です。異なる専門分野での知識共有も大きな学びとなるでしょう。`;
    }
    
    const unique1 = skills1.find(s => !skills2.includes(s));
    const unique2 = skills2.find(s => !skills1.includes(s));
    
    if (unique1 && unique2) {
      return `${unique1}と${unique2}という異なる強みが、プロジェクトに多様性と深みをもたらします。お互いから学ぶことで、技術の幅が大きく広がるでしょう。`;
    }
    
    return `それぞれの技術的バックグラウンドが、新しい視点とアプローチをもたらし、イノベーティブな解決策を生み出す可能性を秘めています。`;
  }

  /**
   * 強みを生成
   */
  private generateStrengths(profile1: PrairieProfile, profile2: PrairieProfile): string[] {
    const strengths = [];
    
    const skills = [...(profile1.details?.skills || []), ...(profile2.details?.skills || [])];
    if (skills.length > 5) {
      strengths.push('幅広い技術カバレッジ');
    }
    
    const interests = [...(profile1.details?.interests || []), ...(profile2.details?.interests || [])];
    if (interests.length > 3) {
      strengths.push('多様な興味と視点');
    }
    
    if (profile1.basic.company !== profile2.basic.company && profile1.basic.company && profile2.basic.company) {
      strengths.push('異なる企業文化の融合');
    }
    
    strengths.push('相補的なスキルセット', '学習意欲の相乗効果');
    
    return strengths.slice(0, 3);
  }

  /**
   * 機会を生成
   */
  private generateOpportunities(profile1: PrairieProfile, profile2: PrairieProfile): string[] {
    const opportunities = [];
    
    const allSkills = [...(profile1.details?.skills || []), ...(profile2.details?.skills || [])];
    if (allSkills.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('ml'))) {
      opportunities.push('AI/MLプロジェクトへの挑戦');
    }
    if (allSkills.some(s => s.toLowerCase().includes('cloud'))) {
      opportunities.push('クラウドネイティブアプリの開発');
    }
    
    opportunities.push(
      '技術記事の共同執筆',
      'OSSプロジェクトへの貢献',
      '勉強会やLTでの発表'
    );
    
    return opportunities.slice(0, 3);
  }

  /**
   * アドバイスを生成
   */
  private generateAdvice(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    style: DiagnosisStyle
  ): string {
    const adviceTemplates = {
      astrological: '星の導きに従い、お互いの技術的な直感を信じて前進しましょう。今は行動の時です。',
      fortune: '運気が最高潮の今、思い切った挑戦が大きな成果につながります。チャンスを逃さないで！',
      technical: 'まずは小さなプロジェクトから始めて、徐々に協力範囲を広げていくことをお勧めします。',
      creative: '既成概念にとらわれず、自由な発想でコラボレーションを楽しんでください。'
    };
    
    return adviceTemplates[style];
  }

  /**
   * 点取り占いを生成
   */
  private generateFortuneTelling(baseCompatibility: number): FortuneTelling {
    // ベーススコアに基づいて各運勢を微調整
    const variance = 5;
    return {
      overall: Math.min(100, baseCompatibility + Math.floor(Math.random() * variance)),
      tech: Math.min(100, 85 + Math.floor(Math.random() * 15)),
      collaboration: Math.min(100, 85 + Math.floor(Math.random() * 15)),
      growth: Math.min(100, 85 + Math.floor(Math.random() * 15)),
      message: `素晴らしい相性です！特に技術面での協力が、お互いの成長を加速させるでしょう。`
    };
  }

  /**
   * IDの生成
   */
  private generateId(): string {
    return `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const unifiedDiagnosisEngine = UnifiedDiagnosisEngine.getInstance();