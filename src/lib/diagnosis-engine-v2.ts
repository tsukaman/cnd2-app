/**
 * Cloudflare Workers対応の診断エンジン
 */
import { DiagnosisRequest } from './validators/diagnosis';
import { KVStorage } from './workers/kv-storage-v2';
import { nanoid } from 'nanoid';
import { DiagnosisResult, AIResponse } from '@/types/diagnosis';
import { logger } from './logger';

export class DiagnosisEngine {
  private kvStorage: KVStorage;
  
  constructor() {
    this.kvStorage = new KVStorage();
  }

  async diagnose(request: DiagnosisRequest): Promise<DiagnosisResult> {
    const resultId = nanoid(10);
    const timestamp = new Date().toISOString();
    
    // OpenAI API呼び出し
    const aiResponse = await this.callOpenAI(request);
    
    // 結果を整形
    const result: DiagnosisResult = {
      id: resultId,
      mode: request.mode,
      type: aiResponse.type || this.generateType(request),
      compatibility: aiResponse.compatibility || this.calculateCompatibility(request),
      description: aiResponse.description || this.generateDescription(request),
      tips: aiResponse.tips || this.generateTips(request),
      hashtag: '#CNDxCnD',
      participants: request.participants,
      metadata: {
        createdAt: timestamp,
        expiresAt: this.getExpiryDate(),
        version: '2.0',
      },
    };
    
    // KVに保存（7日間の有効期限付き）
    await this.kvStorage.save(resultId, result, {
      expirationTtl: 7 * 24 * 60 * 60, // 7日間（秒単位）
    });
    
    return result;
  }

  private async callOpenAI(request: DiagnosisRequest): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    
    if (!apiKey || apiKey === 'dummy') {
      // モックレスポンス（開発用）
      return this.generateMockResponse(request);
    }
    
    // タイムアウト設定（10秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: this.buildUserPrompt(request),
            },
          ],
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      return JSON.parse(content);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // タイムアウトエラーの判別
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('OpenAI API timeout after 10 seconds');
      } else {
        logger.error('OpenAI API call failed, using fallback', error);
      }
      
      return this.generateMockResponse(request);
    }
  }

  private getSystemPrompt(): string {
    return `あなたはCloudNative Days Winter 2025の相性診断AI「CND²」です。
参加者のプロフィール情報から、イベントでの出会いと交流を促進する診断結果を生成してください。

出力は以下のJSON形式で返してください：
{
  "type": "診断タイプ名（例：テックリーダー型、コラボレーター型など）",
  "compatibility": 相性スコア（0-100の整数）,
  "description": "診断結果の詳細説明",
  "tips": ["アドバイス1", "アドバイス2", "アドバイス3"]
}

診断は前向きで建設的な内容にし、CloudNativeコミュニティでの交流を促進する内容にしてください。`;
  }

  private buildUserPrompt(request: DiagnosisRequest): string {
    const participants = request.participants
      .map((p, i) => `
参加者${i + 1}: ${p.name}
${p.prairieData?.bio ? `自己紹介: ${p.prairieData.bio}` : ''}
${p.prairieData?.interests ? `興味: ${p.prairieData.interests.join(', ')}` : ''}
${p.prairieData?.skills ? `スキル: ${p.prairieData.skills.join(', ')}` : ''}
${p.prairieData?.company ? `会社: ${p.prairieData.company}` : ''}
${p.prairieData?.role ? `役職: ${p.prairieData.role}` : ''}
`)
      .join('\n');

    return `${request.mode === 'duo' ? '2人' : 'グループ'}の相性診断を行ってください。

${participants}

CloudNative技術とコミュニティの観点から、相性と交流のアドバイスを提供してください。`;
  }

  private generateMockResponse(request: DiagnosisRequest): AIResponse {
    const types = [
      'イノベーター型',
      'コラボレーター型',
      'メンター型',
      'エクスプローラー型',
      'ビルダー型',
    ];
    
    return {
      type: types[Math.floor(Math.random() * types.length)],
      compatibility: 70 + Math.floor(Math.random() * 30),
      description: 'CloudNative技術への情熱を共有する素晴らしいマッチングです！',
      tips: [
        '技術的な話題から始めて、徐々にプロジェクトの話に展開してみましょう',
        'ハンズオンセッションで一緒に手を動かすと良い関係が築けそうです',
        'コミュニティイベントでの再会を約束して、長期的な関係を築きましょう',
      ],
    };
  }

  private generateType(request: DiagnosisRequest): string {
    const hasCloudNative = request.participants.some(p => 
      p.prairieData?.interests?.some(i => i.toLowerCase().includes('cloud')) ||
      p.prairieData?.skills?.some(s => s.toLowerCase().includes('kubernetes'))
    );
    
    return hasCloudNative ? 'CloudNativeエキスパート型' : 'テックエンスージアスト型';
  }

  private calculateCompatibility(request: DiagnosisRequest): number {
    // 共通の興味・スキルをカウント
    if (request.mode === 'duo' && request.participants.length === 2) {
      const p1 = request.participants[0].prairieData;
      const p2 = request.participants[1].prairieData;
      
      if (!p1 || !p2) return 75;
      
      const commonInterests = p1.interests?.filter(i => 
        p2.interests?.includes(i)
      ).length || 0;
      
      const commonSkills = p1.skills?.filter(s => 
        p2.skills?.includes(s)
      ).length || 0;
      
      return Math.min(100, 70 + commonInterests * 5 + commonSkills * 3);
    }
    
    return 80;
  }

  private generateDescription(request: DiagnosisRequest): string {
    const participantNames = request.participants.map(p => p.name).join('と');
    return `${participantNames}の組み合わせは、CloudNativeコミュニティで新しい価値を生み出す可能性を秘めています。`;
  }

  private generateTips(request: DiagnosisRequest): string[] {
    return [
      'まずは軽い技術談義から始めてみましょう',
      'お互いの現在のプロジェクトについて共有してみてください',
      'イベント後もSlackやTwitterで繋がりを保ちましょう',
    ];
  }

  private getExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString();
  }

  private getApiKey(): string | undefined {
    // Edge Runtime互換のAPIキー取得
    if (typeof process !== 'undefined' && process.env) {
      return process.env.OPENAI_API_KEY;
    }
    
    // Cloudflare Workers環境の場合
    if (typeof globalThis !== 'undefined') {
      const env = (globalThis as { env?: { OPENAI_API_KEY?: string }; OPENAI_API_KEY?: string }).env || (globalThis as { OPENAI_API_KEY?: string });
      return env.OPENAI_API_KEY;
    }
    
    return undefined;
  }
}