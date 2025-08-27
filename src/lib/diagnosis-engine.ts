import OpenAI from 'openai';
import { PrairieProfile, DiagnosisResult } from '@/types';
import { CND2_CONFIG } from '@/config/cnd2.config';
import { 
  CND2_SYSTEM_PROMPT, 
  buildDuoDiagnosisPrompt, 
  buildGroupDiagnosisPrompt 
} from './prompts';
import { nanoid } from 'nanoid';

import { DiagnosisCache } from './diagnosis-cache';

export class DiagnosisEngine {
  private openai: OpenAI | null = null;
  private static instance: DiagnosisEngine;
  private cache: DiagnosisCache;

  private constructor() {
    // キャッシュを初期化
    this.cache = DiagnosisCache.getInstance();
    
    // サーバーサイドでのみOpenAI APIキーを使用
    if (typeof window === 'undefined') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && apiKey !== 'your_openai_api_key_here') {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
      } else {
        console.warn('[CND²] OpenAI APIキーが設定されていません。モック診断を使用します。');
      }
    }
  }

  // シングルトンパターン
  static getInstance(): DiagnosisEngine {
    if (!DiagnosisEngine.instance) {
      DiagnosisEngine.instance = new DiagnosisEngine();
    }
    return DiagnosisEngine.instance;
  }

  // APIキーが設定されているかチェック
  isConfigured(): boolean {
    return this.openai !== null;
  }

  // 2人診断
  async generateDuoDiagnosis(profiles: [PrairieProfile, PrairieProfile]): Promise<DiagnosisResult> {
    // キャッシュをチェック
    const cached = this.cache.get(profiles, 'duo');
    if (cached) {
      console.log('[CND²] キャッシュからAI診断を返します');
      return cached;
    }

    if (!this.isConfigured()) {
      console.warn('[CND²] OpenAI APIキーが設定されていません。モック診断を返します。');
      return this.generateMockDiagnosis(profiles);
    }

    const prompt = buildDuoDiagnosisPrompt(profiles);
    
    try {
      console.log('[CND²] AI診断を生成中...');
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: CND2_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('AI応答が空でした');
      }

      const result = JSON.parse(content);
      
      const diagnosisResult: DiagnosisResult = {
        ...result,
        mode: 'duo' as const,
        participants: profiles,
        createdAt: new Date().toISOString(),
        id: nanoid(10),
      };

      // キャッシュに保存
      this.cache.set(profiles, 'duo', diagnosisResult);
      
      return diagnosisResult;
    } catch (error) {
      console.error('[CND²] AI診断生成エラー:', error);
      
      // エラー時はモック診断を返す
      return this.generateMockDiagnosis(profiles);
    }
  }

  // グループ診断
  async generateGroupDiagnosis(profiles: PrairieProfile[]): Promise<DiagnosisResult> {
    // キャッシュをチェック
    const cached = this.cache.get(profiles, 'group');
    if (cached) {
      console.log('[CND²] キャッシュからグループAI診断を返します');
      return cached;
    }

    if (!this.isConfigured()) {
      console.warn('[CND²] OpenAI APIキーが設定されていません。モック診断を返します。');
      return this.generateMockGroupDiagnosis(profiles);
    }

    const prompt = buildGroupDiagnosisPrompt(profiles);
    
    try {
      console.log('[CND²] グループAI診断を生成中...');
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: CND2_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('AI応答が空でした');
      }

      const result = JSON.parse(content);
      
      const diagnosisResult: DiagnosisResult = {
        ...result,
        mode: 'group' as const,
        participants: profiles,
        createdAt: new Date().toISOString(),
        id: nanoid(10),
      };

      // キャッシュに保存
      this.cache.set(profiles, 'group', diagnosisResult);
      
      return diagnosisResult;
    } catch (error) {
      console.error('[CND²] グループAI診断生成エラー:', error);
      
      // エラー時はモック診断を返す
      return this.generateMockGroupDiagnosis(profiles);
    }
  }

  // モック診断（開発・テスト用）
  private generateMockDiagnosis(profiles: PrairieProfile[]): DiagnosisResult {
    const mockTypes = [
      'Perfect Pod Pair型',
      'Service Mesh型',
      'Distributed System型',
      'Load Balancer型',
      'Container Orchestration型',
      'Kubernetes Native型',
      'Cloud Native Pioneer型',
      'Microservices Mesh型'
    ];

    const mockMessages = [
      '二人の技術スタックが完璧に補完し合い、まるでKubernetesのPodとServiceのような理想的な関係です！Scaling Together²の精神で、出会いを二乗でスケールしていけるでしょう。',
      'お互いのスキルセットがService Meshのように緊密に連携し、高可用性の関係を構築できそうです。CND²が予測する相性は最高レベル！',
      '分散システムのように、それぞれが独立しながらも協調して動く素晴らしいパートナーシップが期待できます。出会いを二乗でスケール！'
    ];

    const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
    const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    const randomScore = 70 + Math.floor(Math.random() * 30); // 70-99

    return {
      id: nanoid(10),
      mode: 'duo' as const,
      type: randomType,
      compatibility: randomScore,
      summary: randomMessage,
      strengths: [
        `${profiles[0].basic.name}さんと${profiles[1]?.basic.name || 'みなさん'}の共通のスキルが多い`,
        'CloudNative技術への情熱を共有',
        '学習意欲が高い組み合わせ'
      ],
      opportunities: [
        '共同でOSSプロジェクトに貢献',
        '技術ブログの共同執筆',
        'ハッカソンでのチーム参加'
      ],
      advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
      participants: profiles,
      createdAt: new Date().toISOString(),
      // Legacy fields for backward compatibility
      score: randomScore,
      message: randomMessage,
      conversationStarters: [
        `${profiles[0].basic.name}さんと${profiles[1]?.basic.name || 'みなさん'}の共通のスキルについて話してみましょう`,
        'CloudNative Daysでの思い出を共有してみては？',
        '最近取り組んでいるプロジェクトについて情報交換してみましょう'
      ],
      hiddenGems: 'お二人とも技術への情熱が素晴らしく、学習意欲が高いところが共通しています！',
      shareTag: `相性${randomScore}%！ ${randomType}の二人が #CNDxCnD で出会いを二乗でスケール中！`,
    };
  }

  // グループ用モック診断
  private generateMockGroupDiagnosis(profiles: PrairieProfile[]): DiagnosisResult {
    const mockTypes = [
      'Kubernetes Cluster型',
      'Microservices Orchestra型',
      'DevOps Pipeline型',
      'Cloud Native Collective型'
    ];

    const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
    const randomScore = 75 + Math.floor(Math.random() * 25); // 75-99

    return {
      id: nanoid(10),
      mode: 'group' as const,
      type: randomType,
      compatibility: randomScore,
      summary: `${profiles.length}人のグループは${randomType}として完璧に機能します！`,
      strengths: [
        'グループ全員が学習意欲が高い',
        '多様な技術スタックをカバー',
        'お互いを高め合える関係'
      ],
      opportunities: [
        'グループでハッカソンに参加',
        '技術勉強会の開催',
        'オープンソースプロジェクトの立ち上げ'
      ],
      advice: 'それぞれの専門分野を活かして、革新的なプロジェクトに挑戦してみましょう。',
      participants: profiles,
      createdAt: new Date().toISOString(),
      // Legacy fields for backward compatibility
      score: randomScore,
      message: `${profiles.length}人のグループは${randomType}として完璧に機能します！${profiles.length}² = ${profiles.length * profiles.length}通りの相性が見事に調和し、Scaling Together²を実現！`,
      conversationStarters: [
        'グループでハッカソンに参加してみては？',
        '技術勉強会を開催してみましょう',
        'オープンソースプロジェクトを始めてみるのはどうでしょう'
      ],
      hiddenGems: 'グループ全員が学習意欲が高く、お互いを高め合える関係です！',
      shareTag: `${profiles.length}人で相性${randomScore}%！ ${randomType}として #CNDxCnD で二乗の出会い！`,
    };
  }
}