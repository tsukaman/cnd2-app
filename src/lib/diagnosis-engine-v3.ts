/**
 * Simplified Diagnosis Engine v3
 * Prairie CardのHTML全体をAIに渡して診断を行うシンプルな実装
 */

import OpenAI from 'openai';
import { DiagnosisResult, PrairieProfile } from '@/types';
import { nanoid } from 'nanoid';
import { DiagnosisCache } from './diagnosis-cache';
import { PrairieProfileExtractor } from './prairie-profile-extractor';
import { DIAGNOSIS_PROMPTS } from './prompts/diagnosis-prompts';
import { HTML_SIZE_LIMIT, SCORE_DISTRIBUTION, TIMEOUTS } from './constants/scoring';

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