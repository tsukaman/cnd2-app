/**
 * Simplified Diagnosis Engine v3
 * Prairie CardのHTML全体をAIに渡して診断を行うシンプルな実装
 */

import OpenAI from 'openai';
import { DiagnosisResult, PrairieProfile } from '@/types';
import { AIResponse } from '@/types/ai-response';
import { nanoid } from 'nanoid';
import { DiagnosisCache } from './diagnosis-cache';
import { PrairieProfileExtractor } from './prairie-profile-extractor';
import { DIAGNOSIS_PROMPTS } from './prompts/diagnosis-prompts';
import { HTML_SIZE_LIMIT, SCORE_DISTRIBUTION, TIMEOUTS } from './constants/scoring';
import { getRandomCNCFProject, getRandomLuckyItem, getRandomLuckyAction } from './constants/cncf-projects';
import { parseLuckyProject } from './utils/lucky-project-parser';

// 定数定義
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
    
    // プロンプトテンプレートから生成
    return DIAGNOSIS_PROMPTS.USER_TEMPLATE
      .replace('{profile1}', profileStr1)
      .replace('{profile2}', profileStr2);
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
        const participants: PrairieProfile[] = [
          {
            basic: { 
              name: fallbackNames[0],
              title: '',
              company: '',
              bio: ''
            },
            details: {
              tags: [],
              skills: [],
              interests: [],
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
              name: fallbackNames[1],
              title: '',
              company: '',
              bio: ''
            },
            details: {
              tags: [],
              skills: [],
              interests: [],
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
        ];
        return this.generateFallbackDiagnosis(participants);
      }
      
      const prompt = this.buildDiagnosisPrompt(html1, html2);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',  // コスト効率的で高速なモデルを使用
        messages: [
          {
            role: 'system',
            content: DIAGNOSIS_PROMPTS.SYSTEM
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

      const aiResult: AIResponse = JSON.parse(content);
      
      // AIが生成したラッキーアイテム/アクション/プロジェクトをそのまま使用
      // （LLMが自由に生成するため、多様性が保証される）
      const luckyItem = aiResult.diagnosis.luckyItem || getRandomLuckyItem();
      const luckyAction = aiResult.diagnosis.luckyAction || getRandomLuckyAction();
      const luckyProjectInfo = aiResult.diagnosis.luckyProject;
      
      // luckyProjectの処理（共通関数を使用）
      let luckyProject = '';
      let luckyProjectDescription = '';
      if (luckyProjectInfo) {
        const parsed = parseLuckyProject(luckyProjectInfo);
        luckyProject = parsed.name;
        luckyProjectDescription = parsed.description;
      } else {
        // フォールバック：CNCFプロジェクトをランダムに選択
        const randomProject = getRandomCNCFProject();
        luckyProject = `${randomProject.name} ${randomProject.emoji}`;
        luckyProjectDescription = randomProject.description;
      }
      
      // AIの結果を既存のDiagnosisResult形式に変換
      const diagnosisResult: DiagnosisResult = {
        id: nanoid(10),
        mode: 'duo' as const,
        type: aiResult.diagnosis.type,
        // 新しい必須フィールド
        compatibility: aiResult.diagnosis.score || 0,
        summary: aiResult.diagnosis.message || '',
        strengths: this.extractStrengths(aiResult),
        opportunities: this.extractOpportunities(aiResult),
        advice: aiResult.diagnosis.hiddenGems || '',
        // レガシーフィールド（後方互換性）
        score: aiResult.diagnosis.score,
        message: aiResult.diagnosis.message,
        conversationStarters: aiResult.diagnosis.conversationStarters || [],
        hiddenGems: aiResult.diagnosis.hiddenGems,
        luckyItem,
        luckyAction,
        luckyProject,
        luckyProjectDescription,
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
   * AIの結果から強みを抽出
   */
  private extractStrengths(aiResult: AIResponse): string[] {
    // まず診断結果に直接strengths配列があるか確認
    if (aiResult.diagnosis?.strengths && Array.isArray(aiResult.diagnosis.strengths)) {
      return aiResult.diagnosis.strengths;
    }
    
    // metadata内のcalculatedScoreから強みを推定
    const strengths = [];
    const scores = aiResult.diagnosis?.metadata?.calculatedScore;
    
    if (scores) {
      if (scores.technical >= 20) {
        strengths.push('高い技術的親和性');
      }
      if (scores.communication >= 15) {
        strengths.push('良好なコミュニケーション');
      }
      if (scores.values >= 15) {
        strengths.push('共通の価値観');
      }
      if (scores.growth >= 15) {
        strengths.push('相互成長の可能性');
      }
    }
    
    // プロフィールから共通スキルを探す
    const person1Skills = aiResult.extracted_profiles?.person1?.skills || [];
    const person2Skills = aiResult.extracted_profiles?.person2?.skills || [];
    const commonSkills = person1Skills.filter((skill: string) => 
      person2Skills.some((s: string) => s.toLowerCase() === skill.toLowerCase())
    );
    
    if (commonSkills.length > 0) {
      strengths.push(`共通スキル: ${commonSkills.slice(0, 3).join(', ')}`);
    }
    
    // デフォルトの強み
    if (strengths.length === 0) {
      strengths.push('技術への情熱', '学習意欲の高さ', 'チームワーク');
    }
    
    return strengths.slice(0, 5); // 最大5個まで
  }

  /**
   * AIの結果から改善機会を抽出
   */
  private extractOpportunities(aiResult: AIResponse): string[] {
    // まず診断結果に直接opportunities配列があるか確認
    if (aiResult.diagnosis?.opportunities && Array.isArray(aiResult.diagnosis.opportunities)) {
      return aiResult.diagnosis.opportunities;
    }
    
    const opportunities = [];
    const scores = aiResult.diagnosis?.metadata?.calculatedScore;
    
    // スコアが低い領域を改善機会として提案
    if (scores) {
      if (scores.technical < 20) {
        opportunities.push('技術スキルの共有と学習');
      }
      if (scores.communication < 15) {
        opportunities.push('コミュニケーション機会の増加');
      }
      if (scores.values < 15) {
        opportunities.push('新しい共通の興味を発見');
      }
      if (scores.growth < 15) {
        opportunities.push('相互メンタリングの実施');
      }
    }
    
    // プロフィールから補完的なスキルを探す
    const person1Skills = aiResult.extracted_profiles?.person1?.skills || [];
    const person2Skills = aiResult.extracted_profiles?.person2?.skills || [];
    
    const unique1 = person1Skills.filter((skill: string) => 
      !person2Skills.some((s: string) => s.toLowerCase() === skill.toLowerCase())
    );
    const unique2 = person2Skills.filter((skill: string) => 
      !person1Skills.some((s: string) => s.toLowerCase() === skill.toLowerCase())
    );
    
    if (unique1.length > 0 || unique2.length > 0) {
      opportunities.push('お互いのユニークなスキルから学ぶ');
    }
    
    // conversationStartersから機会を抽出
    if (aiResult.diagnosis?.conversationStarters && aiResult.diagnosis.conversationStarters.length > 0) {
      opportunities.push('会話を深める機会が豊富');
    }
    
    // デフォルトの機会
    if (opportunities.length === 0) {
      opportunities.push(
        'コラボレーションプロジェクトの可能性',
        '知識共有の機会',
        '新しい技術へのチャレンジ'
      );
    }
    
    return opportunities.slice(0, 5); // 最大5個まで
  }

  /**
   * フォールバック診断結果を生成
   */
  private generateFallbackDiagnosis(participants: PrairieProfile[]): DiagnosisResult {
    // フォールバック用のスコア分布をリアルに
    const rand = Math.random();
    let randomScore;
    
    // SCORE_DISTRIBUTION定数を使用
    if (rand < SCORE_DISTRIBUTION.RARE.threshold) {
      const [min, max] = SCORE_DISTRIBUTION.RARE.range;
      randomScore = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (rand < SCORE_DISTRIBUTION.CHALLENGING.threshold) {
      const [min, max] = SCORE_DISTRIBUTION.CHALLENGING.range;
      randomScore = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (rand < SCORE_DISTRIBUTION.GROWING.threshold) {
      const [min, max] = SCORE_DISTRIBUTION.GROWING.range;
      randomScore = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (rand < SCORE_DISTRIBUTION.BALANCED.threshold) {
      const [min, max] = SCORE_DISTRIBUTION.BALANCED.range;
      randomScore = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (rand < SCORE_DISTRIBUTION.EXCELLENT.threshold) {
      const [min, max] = SCORE_DISTRIBUTION.EXCELLENT.range;
      randomScore = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      const [min, max] = SCORE_DISTRIBUTION.PERFECT.range;
      randomScore = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const types = ['クラウドネイティブ型', 'アジャイル型', 'イノベーティブ型', 'コラボレーティブ型'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // ランダムにラッキーアイテムとアクションを選択
    const luckyProject = getRandomCNCFProject();
    const luckyItem = getRandomLuckyItem();
    const luckyAction = getRandomLuckyAction();

    // スコアに応じたメッセージを生成
    let message = '';
    if (randomScore < 20) {
      message = `奇跡のレアケース！相性${randomScore}%は話題作りに最高です！こんな組み合わせは滅多にありません。`;
    } else if (randomScore < 40) {
      message = `チャレンジングでワクワクする相性${randomScore}%！成長の余地が無限大です。`;
    } else if (randomScore < 60) {
      message = `これからが本番の相性${randomScore}%！可能性に満ちています。`;
    } else if (randomScore < 80) {
      message = `バランスの良い相性${randomScore}%！お互いの良さを引き出せます。`;
    } else {
      message = `最高の相性${randomScore}%！運命的な出会いかもしれません。`;
    }

    return {
      id: `fallback-${Date.now()}`,
      mode: 'duo',
      type: randomType,
      participants: participants,
      compatibility: randomScore,
      summary: message,
      message: message,
      conversationStarters: [
        '最近気になる技術トレンドは？',
        'エンジニアになったきっかけは？',
        '休日はどんな風に過ごしていますか？',
        '好きなコーヒーやお茶はありますか？',
        '参加したカンファレンスで印象的だったセッションは？'
      ],
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
      hiddenGems: 'お二人の出会いは、新しい可能性の扉を開くきっかけになるでしょう。',
      luckyItem,
      luckyAction,
      luckyProject: `${luckyProject.name} ${luckyProject.emoji}`,
      luckyProjectDescription: luckyProject.description,
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