/**
 * 診断エンジン v4 - 占星術スタイル
 * Cloud Nativeと占星術を融合した、エンターテイメント性重視の診断エンジン
 */

import { PrairieProfile, DiagnosisResult } from '@/types';
// Logger currently unused but may be needed for future debugging
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { logger } from '@/lib/logger';

/**
 * 占星術的な診断結果の生成
 */
export class AstrologicalDiagnosisEngine {
  private static instance: AstrologicalDiagnosisEngine | null = null;

  static getInstance(): AstrologicalDiagnosisEngine {
    if (!this.instance) {
      this.instance = new AstrologicalDiagnosisEngine();
    }
    return this.instance;
  }

  /**
   * 2人の相性診断
   */
  async generateDuoDiagnosis(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): Promise<DiagnosisResult> {
    const compatibility = this.calculateCompatibility(profile1, profile2);
    const type = this.generateDiagnosisType(compatibility);
    
    return {
      id: this.generateId(),
      mode: 'duo',
      type,
      compatibility,
      summary: this.generateSummary(profile1, profile2, compatibility),
      astrologicalAnalysis: this.generateAstrologicalAnalysis(profile1, profile2),
      techStackCompatibility: this.generateTechStackAnalysis(profile1, profile2),
      conversationTopics: this.generateConversationTopics(profile1, profile2),
      strengths: this.generateStrengths(profile1, profile2),
      opportunities: this.generateOpportunities(profile1, profile2),
      advice: this.generateAdvice(profile1, profile2),
      luckyItem: this.generateLuckyItem(profile1, profile2),
      luckyAction: this.generateLuckyAction(profile1, profile2),
      participants: [profile1, profile2],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 相性スコアの計算（70-100%の範囲）
   */
  private calculateCompatibility(profile1: PrairieProfile, profile2: PrairieProfile): number {
    let score = 70; // ベーススコア

    // 技術スキルの共通点
    const skills1 = profile1.details?.skills || [];
    const skills2 = profile2.details?.skills || [];
    const commonSkills = skills1.filter(s => skills2.includes(s));
    score += Math.min(commonSkills.length * 3, 15);

    // 興味の共通点
    const interests1 = profile1.details?.interests || [];
    const interests2 = profile2.details?.interests || [];
    const commonInterests = interests1.filter(i => interests2.includes(i));
    score += Math.min(commonInterests.length * 2, 10);

    // ランダム要素（運命的な要素）
    score += Math.floor(Math.random() * 5);

    return Math.min(score, 100);
  }

  /**
   * 診断タイプの生成
   */
  private generateDiagnosisType(compatibility: number): string {
    if (compatibility >= 90) {
      return '運命のCloud Nativeパートナー';
    } else if (compatibility >= 80) {
      return 'Container Orchestrationの調和';
    } else if (compatibility >= 75) {
      return 'マイクロサービス的な補完関係';
    } else {
      return 'DevOps Journey の同志';
    }
  }

  /**
   * サマリーの生成
   */
  private generateSummary(
    profile1: PrairieProfile,
    profile2: PrairieProfile,
    compatibility: number
  ): string {
    const name1 = profile1.basic.name || 'エンジニア1';
    const name2 = profile2.basic.name || 'エンジニア2';
    
    if (compatibility >= 90) {
      return `${name1}さんと${name2}さんは、まさに運命的な出会い！技術の星が完璧に整列しています。`;
    } else if (compatibility >= 80) {
      return `${name1}さんと${name2}さんの技術的波動が美しく共鳴しています。素晴らしいコラボレーションが期待できます！`;
    } else if (compatibility >= 75) {
      return `${name1}さんと${name2}さんは、お互いの強みを活かし合える良好な相性です。`;
    } else {
      return `${name1}さんと${name2}さんは、新しい視点を与え合える関係です。`;
    }
  }

  /**
   * 占星術的分析の生成
   */
  private generateAstrologicalAnalysis(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): string {
    const name1 = profile1.basic.name || 'エンジニア1';
    const name2 = profile2.basic.name || 'エンジニア2';
    
    // プロフィールから主要な技術を抽出
    const tech1 = this.extractMainTech(profile1);
    const tech2 = this.extractMainTech(profile2);
    
    // プロフィールの特徴を抽出
    const trait1 = profile1.basic.title || profile1.basic.bio?.substring(0, 30) || 'エンジニア';
    const trait2 = profile2.basic.title || profile2.basic.bio?.substring(0, 30) || 'エンジニア';
    
    return `${name1}さんの「${tech1}」エナジーと${name2}さんの「${tech2}」エナジーが、` +
           `まさに分散システムのように調和しています！${trait1}という性質と${trait2}という特性が、` +
           `お互いを補完し合う素晴らしい星回りを示しています。` +
           `二人の技術的な波動が、Container Orchestrationのように美しく同期する運命にあります。`;
  }

  /**
   * 技術スタック相性分析の生成
   */
  private generateTechStackAnalysis(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): string {
    const name1 = profile1.basic.name || 'エンジニア1';
    const name2 = profile2.basic.name || 'エンジニア2';
    const tech1 = this.extractMainTech(profile1);
    const tech2 = this.extractMainTech(profile2);
    const company1 = profile1.basic.company || '企業';
    const company2 = profile2.basic.company || '企業';
    
    return `${name1}さんの「${tech1}」と${name2}さんの「${tech2}」は、` +
           `現代的なCloud Nativeスタックの素晴らしい組み合わせです！` +
           `${company1}と${company2}という立場から、お互いの専門知識を活かして` +
           `有意義な技術討論ができそうです。きっと業界のトレンドや課題について深く語り合えるでしょう！`;
  }

  /**
   * 会話トピックの生成
   */
  private generateConversationTopics(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): string[] {
    const topics: string[] = [];
    
    // 技術的な話題
    const tech1 = this.extractMainTech(profile1);
    const tech2 = this.extractMainTech(profile2);
    topics.push(`「${tech1}と${tech2}の組み合わせ、どう思われますか？」`);
    
    // 会社の話題
    if (profile1.basic.company && profile2.basic.company) {
      topics.push(`「${profile1.basic.company}と${profile2.basic.company}、それぞれの技術文化の違いってありますか？」`);
    }
    
    // Cloud Native関連
    topics.push('「最近のCloud Native界隈で気になるトレンドは何ですか？」');
    
    // 趣味の話題
    const interests1 = profile1.details?.interests || [];
    const interests2 = profile2.details?.interests || [];
    
    if (interests1.length > 0 && interests2.length > 0) {
      const interest1 = interests1[0];
      const interest2 = interests2[0];
      if (interest1 === interest2) {
        topics.push(`「${interest1}って、エンジニアリングと何か共通点ありますか？」`);
      } else {
        topics.push(`「${interest1}と${interest2}、それぞれの趣味から学んだことはありますか？」`);
      }
    }
    
    // プロフィールの特徴から
    if (profile1.basic.bio) {
      const bio1 = profile1.basic.bio.substring(0, 30);
      topics.push(`「『${bio1}』、面白い自己紹介ですね！」`);
    }
    
    // 技術選定の話題
    topics.push('「技術選定で迷った時、どんな基準で決めていますか？」');
    
    // コミュニティの話題
    topics.push('「CloudNative Daysで印象に残ったセッションはありますか？」');
    
    return topics.slice(0, 7); // 最大7個まで
  }

  /**
   * 強みの生成
   */
  private generateStrengths(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): string[] {
    const strengths: string[] = [];
    
    // 共通のスキルがある場合
    const skills1 = profile1.details?.skills || [];
    const skills2 = profile2.details?.skills || [];
    const commonSkills = skills1.filter(s => skills2.includes(s));
    
    if (commonSkills.length > 0) {
      strengths.push(`${commonSkills[0]}の深い知見を共有できる`);
    }
    
    // 補完的なスキル
    const uniqueSkills1 = skills1.filter(s => !skills2.includes(s));
    const uniqueSkills2 = skills2.filter(s => !skills1.includes(s));
    
    if (uniqueSkills1.length > 0 && uniqueSkills2.length > 0) {
      strengths.push('お互いの専門分野が補完的');
    }
    
    // デフォルトの強み
    strengths.push(
      '技術的な好奇心が旺盛',
      'Cloud Nativeへの情熱を共有',
      'イノベーションを推進する相性'
    );
    
    return strengths.slice(0, 3);
  }

  /**
   * 機会の生成
   */
  private generateOpportunities(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): string[] {
    const opportunities: string[] = [];
    
    // スキルベースの機会
    const hasGo = this.hasSkill(profile1, 'Go') || this.hasSkill(profile2, 'Go');
    const hasKubernetes = this.hasSkill(profile1, 'Kubernetes') || this.hasSkill(profile2, 'Kubernetes');
    
    if (hasGo) {
      opportunities.push('Go言語でのOSSプロジェクト開発');
    }
    
    if (hasKubernetes) {
      opportunities.push('Kubernetesオペレーターの共同開発');
    }
    
    // デフォルトの機会
    opportunities.push(
      '技術ブログの共同執筆',
      'ハッカソンでのチーム参加',
      'Lightning Talkでの共同発表',
      'コミュニティイベントの企画'
    );
    
    return opportunities.slice(0, 3);
  }

  /**
   * アドバイスの生成
   */
  private generateAdvice(
    profile1: PrairieProfile,
    profile2: PrairieProfile
  ): string {
    const advices = [
      'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
      '定期的な技術ディスカッションの時間を設けると、より深い理解が得られるでしょう。',
      '一緒にOSSプロジェクトに貢献することで、実践的なコラボレーションができます。',
      'それぞれの視点を大切にしながら、共通の目標に向かって進みましょう。',
      'お互いの成功体験を共有することで、より強固な関係が築けるでしょう。'
    ];
    
    return advices[Math.floor(Math.random() * advices.length)];
  }

  /**
   * 主要な技術を抽出
   */
  private extractMainTech(profile: PrairieProfile): string {
    const skills = profile.details?.skills || [];
    
    // 優先順位の高い技術
    const priorityTechs = ['Go', 'Kubernetes', 'Docker', 'Terraform', 'AWS', 'GCP', 'React', 'TypeScript'];
    
    for (const tech of priorityTechs) {
      if (skills.some(s => s.toLowerCase().includes(tech.toLowerCase()))) {
        return tech;
      }
    }
    
    // スキルリストの最初の要素
    if (skills.length > 0) {
      return skills[0];
    }
    
    // 会社名から推測
    if (profile.basic.company) {
      if (profile.basic.company.includes('Red Hat')) return 'Red Hat';
      if (profile.basic.company.includes('Google')) return 'Google Cloud';
      if (profile.basic.company.includes('Amazon')) return 'AWS';
      if (profile.basic.company.includes('Microsoft')) return 'Azure';
    }
    
    return 'Cloud Native';
  }

  /**
   * 特定のスキルを持っているか確認
   */
  private hasSkill(profile: PrairieProfile, skill: string): boolean {
    const skills = profile.details?.skills || [];
    return skills.some(s => s.toLowerCase().includes(skill.toLowerCase()));
  }

  /**
   * ラッキーアイテムの生成
   */
  private generateLuckyItem(profile1: PrairieProfile, profile2: PrairieProfile): string {
    const items = [
      '🎧 ノイズキャンセリングヘッドフォン（集中力UP）',
      '☕ エスプレッソマシン（ペアプログラミングのお供）',
      '🦆 ラバーダック（デバッグの相棒）',
      '🌱 観葉植物（酸素供給とメンタルケア）',
      '🎲 20面ダイス（意思決定の友）',
      '🖊️ ホワイトボードマーカー（アイデア共有）',
      '🧘 瞑想クッション（マインドフルネス）',
      '🚀 SpaceXモデルロケット（モチベーション向上）',
      '📚 『Clean Code』（バイブル）',
      '🍕 ピザカッター（チーム懇親会用）',
      '🎮 レトロゲーム機（息抜き用）',
      '🧩 ルービックキューブ（問題解決力向上）',
      '🌈 RGB LEDライト（開発環境の演出）',
      '🎹 MIDIキーボード（創造性刺激）',
      '🔧 Swissアーミーナイフ（万能ツール）'
    ];
    
    // プロフィールのハッシュ値から決定的に選択
    const hash = (profile1.basic.name + profile2.basic.name).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return items[hash % items.length];
  }

  /**
   * ラッキーアクションの生成
   */
  private generateLuckyAction(profile1: PrairieProfile, profile2: PrairieProfile): string {
    const actions = [
      '🎯 一緒にハッカソンに参加する',
      '📝 技術ブログを共同執筆する',
      '🎤 Lightning Talkで共同発表する',
      '☕ モブプログラミングセッションを開催',
      '🌟 OSSプロジェクトにペアでコントリビュート',
      '🍜 ラーメン屋で技術談義',
      '🏃 朝のランニングミーティング',
      '🎨 システムアーキテクチャをホワイトボードに描く',
      '📚 技術書の輪読会を開催',
      '🎮 オンラインゲームでチームビルディング',
      '🏗️ マイクロサービスを一緒に設計',
      '🔍 コードレビューの相互実施',
      '🎬 技術系YouTubeチャンネルを開設',
      '🌏 海外カンファレンスに一緒に参加',
      '🤖 AIチャットボットを共同開発'
    ];
    
    // プロフィールから決定的に選択（名前と会社名を使用）
    const hash = ((profile1.basic.company || '') + (profile2.basic.title || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return actions[hash % actions.length];
  }

  /**
   * IDの生成
   */
  private generateId(): string {
    return `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// シングルトンインスタンスのエクスポート
export const astrologicalDiagnosisEngine = AstrologicalDiagnosisEngine.getInstance();