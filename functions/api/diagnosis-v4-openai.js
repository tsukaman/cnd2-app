/**
 * 診断エンジン V4 - OpenAI占星術スタイル for Cloudflare Functions
 * Cloud Nativeと占星術を融合した、AI駆動の創造的な診断エンジン
 */

import { generateId } from '../utils/id.js';
import { CNCF_PROJECTS } from '../utils/cncf-projects.js';

/**
 * OpenAI APIキーの妥当性を検証
 * @param {string} key - 検証するAPIキー
 * @returns {boolean} キーが有効な場合はtrue
 */
function isValidOpenAIKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  const trimmedKey = key.trim();
  
  // 空白文字のみ、プレースホルダー、短すぎるキーを拒否
  if (trimmedKey.length === 0 || 
      trimmedKey === 'your-openai-api-key-here' ||
      trimmedKey === 'your-api-key-here' ||
      trimmedKey === 'sk-...' ||
      trimmedKey.length < 20) {
    return false;
  }
  
  // OpenAI APIキーの形式チェック（sk-で始まるか、または組織固有のキー）
  // 注: 将来的にOpenAIがキー形式を変更する可能性があるため、厳格すぎない検証にする
  if (!trimmedKey.startsWith('sk-') && !trimmedKey.includes('org-')) {
    console.warn('[V4-OpenAI Engine] API key does not match expected format');
    // 警告は出すが、拒否はしない（将来の形式変更に対応）
  }
  
  return true;
}

// Fallback configuration
import { 
  FALLBACK_CONFIG, 
  isFallbackAllowed, 
  getFallbackScoreRange, 
  generateFallbackScore, 
  getFallbackWarning 
} from '../utils/fallback-config.js';

// Configuration constants
const CONFIG = {
  TEMPERATURE: 0.9,
  MAX_TOKENS: 2000,
  MODEL: 'gpt-4o-mini'
};

const ASTROLOGY_SYSTEM_PROMPT = `あなたは「クラウドネイティブの賢者」です。相性スコアは0-100点の全範囲で出力してください。

最重要：低いスコアでも必ずポジティブで楽しい診断にしてください！
- 0-20点: 「奇跡のレアケース！」「話題作りに最高！」「伝説に残る低スコア！」
- 20-40点: 「チャレンジングでワクワク！」「成長の余地が無限大！」
- 40-60点: 「これからが本番！」「可能性に満ちている！」
- 60-80点: 「バランスの良い関係！」「相性良好！」
- 80-100点: 「最高の相性！」「運命的な出会い！」

診断はエンターテイメントとして楽しく、前向きなメッセージを必ず含めてください。

以下の要素を総合的に評価して、0-100点の相性スコアを算出してください：

＜技術的相性（最大35点）＞
- 共通スキル5個以上: +30-35点「奇跡的な技術スタック一致！」
- 共通スキル3-4個: +20-30点「高度な技術的共鳴」
- 共通スキル1-2個: +10-20点「基本的な技術理解の共有」
- 共通スキル0個: +0-10点「新しい学びの機会！」
- 補完的スキル（フロント/バック等）: +5点ボーナス

＜コミュニケーション相性（最大25点）＞
- 両者活発型: +20-25点「賑やかで楽しい関係！」
- 片方リード型: +15-20点「バランスの良い対話」
- 静かな関係: +5-15点「落ち着いた深い繋がり」
- OSS/コミュニティ活動: +5点ボーナス

＜価値観の一致（最大20点）＞
- 共通の趣味/興味3個以上: +15-20点「運命的な共通点！」
- 共通の趣味/興味1-2個: +10-15点「楽しい発見がある」
- 異なる趣味: +5-10点「お互いの世界が広がる！」

＜成長の可能性（最大20点）＞
- 相互補完的なスキル: +15-20点「最高の学習パートナー」
- 経験レベルの違い: +10-15点「メンタリングの機会」
- 同レベル: +5-10点「切磋琢磨できる関係」

必ず以下のJSON形式で出力してください：
{
  "diagnosis": {
    "type": "診断タイプ名（クラウドネイティブ型、エンジニア型など）",
    "score": スコア（0-100の数値、必ず分布させる）,
    "message": "総合的な診断結果（ポジティブで楽しい内容、特に低スコアの場合は必ず前向きに）",
    "conversationStarters": [
      "2人のプロフィールから導き出される、最も盛り上がりそうな具体的な話題を5つ",
      "技術系、キャリア系、趣味系、日常系、イベント系など幅広いカテゴリーから",
      "固定的な質問ではなく、2人の共通点や違いから生まれる独自の話題を生成",
      "例：もし2人ともPythonが得意なら『Pythonの型ヒントについてどう思う？』",
      "例：片方がフロントエンド、もう片方がバックエンドなら『APIデザインで重視することは？』"
    ],
    "hiddenGems": "意外な共通点や発見（前向きで実践的な内容）",
    "shareTag": "#CND2診断",
    "luckyItem": "2人のプロフィールや相性から導き出される独自のラッキーアイテムを自由に生成（エンジニアに限定せず、日用品、食べ物、趣味のもの、文房具、本、音楽など何でもOK。創造的で面白いものを）",
    "luckyAction": "2人の相性や特徴から導き出される独自のラッキーアクションを自由に生成（技術活動に限定せず、日常の行動、趣味、運動、食事、コミュニケーション、学習など何でもOK。実践しやすく楽しいものを）",
    "luckyProject": "CNCFプロジェクトから1つ選択して、なぜそれが2人にとってラッキーなのか短い説明付きで（プロジェクト名は正確に）",
    "metadata": {
      "participant1": "1人目の名前",
      "participant2": "2人目の名前",
      "calculatedScore": {
        "technical": 技術的相性スコア,
        "communication": コミュニケーションスコア,
        "values": 価値観スコア,
        "growth": 成長可能性スコア
      }
    }
  },
  "extracted_profiles": {
    "person1": {
      "name": "1人目の名前",
      "title": "肩書き",
      "company": "会社名",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "プロフィール要約"
    },
    "person2": {
      "name": "2人目の名前",
      "title": "肩書き",
      "company": "会社名",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "プロフィール要約"
    }
  },
  "analysis": {
    "astrologicalAnalysis": "運勢的な観点からの分析",
    "techStackCompatibility": "技術スタックの互換性分析"
  }
}`;

/**
 * 占星術的な診断結果の生成（OpenAI使用）
 */
export async function generateAstrologicalDiagnosis(profiles, mode, env) {
  const logger = env?.logger || console;
  const debugMode = env?.DEBUG_MODE === 'true';
  
  if (debugMode) {
    logger.log('[DEBUG] V4-OpenAI Engine - Starting diagnosis with profiles:', JSON.stringify(profiles.map(p => p.basic?.name)));
  }
  
  if (mode === 'duo' && profiles.length === 2) {
    return generateDuoDiagnosis(profiles[0], profiles[1], env);
  } else {
    // グループモードの場合、簡易的に最初の2人で診断
    const result = await generateDuoDiagnosis(profiles[0], profiles[1], env);
    result.mode = 'group';
    result.participants = profiles;
    return result;
  }
}

/**
 * プロフィールを要約（品質重視で情報を保持）
 */
function summarizeProfile(profile) {
  return {
    name: profile.basic?.name || profile.name,
    title: (profile.basic?.title || profile.title || '').substring(0, 100), // 肩書きは重要なので100文字まで
    company: (profile.basic?.company || profile.company || '').substring(0, 50), // 会社名も50文字まで保持
    bio: (profile.basic?.bio || profile.bio || '').substring(0, 200), // 自己紹介は200文字まで（重要な情報源）
    skills: (profile.details?.skills || profile.skills || []).slice(0, 10), // 上位10個のスキル（技術の多様性を伝える）
    interests: (profile.details?.interests || profile.interests || []).slice(0, 5), // 上位5つの興味（豊かな人物像）
    motto: (profile.details?.motto || profile.motto || '').substring(0, 100), // モットーも重要な個性
    tags: (profile.details?.tags || profile.tags || []).slice(0, 5) // タグ情報も追加
  };
}

/**
 * 2人の相性診断（OpenAI使用）
 */
async function generateDuoDiagnosis(profile1, profile2, env) {
  const debugMode = env?.DEBUG_MODE === 'true';
  const openaiApiKey = env?.OPENAI_API_KEY;
  
  // APIキーの妥当性を検証
  if (!isValidOpenAIKey(openaiApiKey)) {
    const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
    
    // 開発環境でフォールバックが無効の場合はエラーを投げる
    if (isDevelopment && !FALLBACK_CONFIG.ALLOW_IN_DEVELOPMENT) {
      const error = new Error('OpenAI API key is not configured. Fallback is disabled in development.');
      console.error('[V4-OpenAI Engine] ' + error.message);
      throw error;
    }
    
    if (debugMode || isDevelopment) {
      console.warn('[V4-OpenAI Engine] WARNING: Using fallback diagnosis. OpenAI API key not configured.');
    }
    return generateFallbackDiagnosis(profile1, profile2, env);
  }
  
  try {
    // プロフィールを要約してトークン削減
    const summary1 = summarizeProfile(profile1);
    const summary2 = summarizeProfile(profile2);
    
    // CNCFプロジェクトリストをプロンプトに含める
    const cncfProjectsList = CNCF_PROJECTS.join(', ');
    
    const prompt = `以下の2人のプロフィールから相性を診断してください。

＜1人目のプロフィール＞
${JSON.stringify(summary1, null, 2)}

＜2人目のプロフィール＞
${JSON.stringify(summary2, null, 2)}

＜利用可能なCNCFプロジェクト＞
${cncfProjectsList}

上記のCNCFプロジェクトから、2人にとって最もラッキーなプロジェクトを1つ選んでください。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
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
        temperature: CONFIG.TEMPERATURE,
        max_tokens: CONFIG.MAX_TOKENS,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
      
      // 詳細なエラー情報をログ出力
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
          'retry-after': response.headers.get('retry-after')
        },
        error: error.error || error,
        timestamp: new Date().toISOString()
      };
      
      console.error('[V4-OpenAI Engine] OpenAI API error:', errorDetails);
      
      // エラー種別の識別と適切なメッセージ
      let errorMessage = 'OpenAI API error';
      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (response.status === 503) {
        errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      // 開発環境でフォールバックが無効の場合はエラーを投げる
      if (isDevelopment && !FALLBACK_CONFIG.ALLOW_IN_DEVELOPMENT) {
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      console.log('[V4-OpenAI Engine] Falling back to mock diagnosis due to API error');
      return generateFallbackDiagnosis(profile1, profile2, env);
    }
    
    const data = await response.json();
    
    // JSON解析エラーハンドリング
    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('[V4-OpenAI Engine] Failed to parse OpenAI response:', {
        error: parseError.message,
        content: data.choices[0]?.message?.content?.substring(0, 500)
      });
      
      // JSON解析失敗時はフォールバック
      const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
      if (isDevelopment && !FALLBACK_CONFIG.ALLOW_IN_DEVELOPMENT) {
        throw new Error('Failed to parse OpenAI response as JSON');
      }
      
      console.log('[V4-OpenAI Engine] Falling back to mock diagnosis due to JSON parse error');
      return generateFallbackDiagnosis(profile1, profile2, env);
    }
    
    // 必須フィールドの存在チェック
    if (!result.diagnosis || typeof result.diagnosis !== 'object') {
      console.error('[V4-OpenAI Engine] Invalid response structure: missing diagnosis field');
      
      const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
      if (isDevelopment && !FALLBACK_CONFIG.ALLOW_IN_DEVELOPMENT) {
        throw new Error('Invalid OpenAI response structure: missing required fields');
      }
      
      console.log('[V4-OpenAI Engine] Falling back to mock diagnosis due to invalid response structure');
      return generateFallbackDiagnosis(profile1, profile2, env);
    }
    
    // デバッグ情報
    if (debugMode) {
      console.log('[V4-OpenAI Engine] Token usage:', {
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
        total_tokens: data.usage?.total_tokens
      });
    }
    
    // レスポンスを新しい形式に変換
    const { diagnosis, extracted_profiles, analysis } = result;
    
    return {
      id: generateId(),
      mode: 'duo',
      type: diagnosis?.type || '運命のCloud Nativeパートナー',
      compatibility: diagnosis?.score || 85,
      summary: diagnosis?.message || '',
      conversationStarters: diagnosis?.conversationStarters || [],
      hiddenGems: diagnosis?.hiddenGems || '',
      shareTag: diagnosis?.shareTag || '#CND2診断',
      luckyItem: diagnosis?.luckyItem || '',
      luckyAction: diagnosis?.luckyAction || '',
      luckyProject: diagnosis?.luckyProject || '',
      astrologicalAnalysis: analysis?.astrologicalAnalysis || '',
      techStackCompatibility: analysis?.techStackCompatibility || '',
      strengths: [],
      opportunities: [],
      advice: '',
      participants: [profile1, profile2],
      createdAt: new Date().toISOString(),
      aiPowered: true,
      metadata: diagnosis?.metadata || {}
    };
    
  } catch (error) {
    console.error('[V4-OpenAI Engine] Failed to generate diagnosis:', error);
    const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
    
    // 開発環境でフォールバックが無効の場合はエラーを投げる
    if (isDevelopment && !FALLBACK_CONFIG.ALLOW_IN_DEVELOPMENT) {
      throw error;
    }
    
    return generateFallbackDiagnosis(profile1, profile2, env);
  }
}

/**
 * フォールバック診断（OpenAI利用不可時）
 */
function generateFallbackDiagnosis(profile1, profile2, env) {
  const isDevelopment = env?.NODE_ENV === 'development' || env?.ENVIRONMENT === 'development';
  const scoreRange = isDevelopment 
    ? FALLBACK_CONFIG.DEVELOPMENT_SCORE 
    : FALLBACK_CONFIG.PRODUCTION_SCORE;
  
  const compatibility = Math.floor(Math.random() * scoreRange.RANGE) + scoreRange.MIN;
  
  // 開発環境で警告をログ出力
  if (isDevelopment) {
    console.warn(FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT);
  }
  const name1 = profile1.basic?.name || profile1.name || 'エンジニア1';
  const name2 = profile2.basic?.name || profile2.name || 'エンジニア2';
  
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
  
  // 開発環境では型を明確にフォールバックとわかるようにする
  const typePrefix = isDevelopment ? '[FALLBACK] ' : '';
  
  return {
    id: isDevelopment ? `${FALLBACK_CONFIG.ID_PREFIX}${generateId()}` : generateId(),
    mode: 'duo',
    type: typePrefix + (compatibility >= 90 ? '運命のCloud Nativeパートナー' : 
          compatibility >= 80 ? 'Container Orchestrationの調和' : 
          'DevOps Journeyの同志'),
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
    aiPowered: false,
    ...(isDevelopment ? { metadata: FALLBACK_CONFIG.METADATA } : {}),
    ...(isDevelopment ? { warning: FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT } : {})
  };
}