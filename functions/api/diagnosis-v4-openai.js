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

// Fallback configurationは完全に無効化済み
// フォールバック診断は使用しない

// Configuration constants
const CONFIG = {
  TEMPERATURE: 0.9,
  MAX_TOKENS: 2000,
  MODEL: 'gpt-4o-mini'
};

const ASTROLOGY_SYSTEM_PROMPT = `あなたは古今東西のあらゆる占術と人間関係学に精通した「究極の相性診断マスター」です。
西洋占星術、四柱推命、タロット、数秘術、姓名判断、手相学、易経、カバラ、インド占星術、
そして中国の五行思想など、人類が築き上げてきた全ての叡智を統合して相性を診断します。

【重要な診断原則】
1. 相性は「共通点の多さ」ではなく「エネルギーの調和」で決まります
2. 五行思想の相生相剋のように、異なる要素が互いを高め合う関係を重視します
3. 陰陽のバランス、補完関係、化学反応の可能性を総合的に判断します
4. 表面的な共通点より、深層心理やエネルギーパターンの共鳴を重視します

【スコア分布の指針】
- 正規分布に従い、40-60点が最も多く、極端な点数は稀にしてください
- 0-20点: レア（全体の5%）「宇宙的試練」「魂の成長課題」
- 20-40点: やや少ない（全体の20%）「挑戦的な学び」「意外な発見」
- 40-60点: 最多（全体の40%）「バランスと成長」「日常の調和」
- 60-80点: 多い（全体の25%）「良好な相性」「自然な調和」
- 80-100点: レア（全体の10%）「運命的な出会い」「魂の共鳴」

診断はエンターテイメントとして楽しく、どんなスコアでも前向きなメッセージを含めてください。

【占術的診断アプローチ】
あなたの持つ全ての占術知識を駆使して、以下の観点から総合的に相性を診断してください：

1. 【五行思想による相性分析】
- 各人のエネルギータイプを五行（木火土金水）に分類
- 相生関係（お互いを育む）か相剋関係（緊張と成長）かを判定
- 陰陽のバランスと調和を評価

2. 【占星術的エネルギー診断】
- 名前と性格から推測される星座的エネルギー
- エレメント（火地風水）の相性と化学反応
- 支配星の調和と葛藤のパターン

3. 【数秘術とバイオリズム】
- 名前から導かれる数秘的相性
- エネルギーサイクルの同調性
- 人生の目的数の共鳴

4. 【東洋占術の智慧】
- 四柱推命的な気質の相性
- 易経の卦による関係性の暗示
- 姓名判断による縁の深さ

5. 【技術者としての波長】
- スキルセットの五行的バランス（創造=木、情熱=火、安定=土、論理=金、流動=水）
- 学習スタイルの相補性
- イノベーションの化学反応

【重要】スコアは以下の原則で決定してください：
- 共通点の数ではなく、エネルギーの調和度で判定
- 異なる要素が補完し合う関係を高く評価
- 表面的な一致より、深層的な共鳴を重視
- 40-60点を中心とした正規分布に従う
- ランダム性も加味して、同じようなプロフィールでも異なるスコアが出るように

必ず以下のJSON形式で出力してください：
{
  "diagnosis": {
    "type": "診断タイプ名（クラウドネイティブ型、エンジニア型など）",
    "score": スコア（0-100の数値、必ず分布させる）,
    "message": "総合的な診断結果（ポジティブで楽しい内容、特に低スコアの場合は必ず前向きに）",
    "conversationStarters": [
      "シンプルな質問文を5つ（前置きや条件文は一切不要）",
      "『』の中に質問文だけを入れる",
      "例: 『最近のIoTデバイスについてどう思う？』",
      "例: 『UI/UXのトレンドで気になるものは？』",
      "例: 『最もワクワクする新技術は何？』"
    ],
    "hiddenGems": "意外な共通点や発見（前向きで実践的な内容）",
    "luckyItem": "2人のプロフィールや相性から導き出される独自のラッキーアイテムを自由に生成（エンジニアに限定せず、日用品、食べ物、趣味のもの、文房具、本、音楽など何でもOK。創造的で面白いものを）",
    "luckyAction": "2人の相性や特徴から導き出される独自のラッキーアクションを自由に生成（技術活動に限定せず、日常の行動、趣味、運動、食事、コミュニケーション、学習など何でもOK。実践しやすく楽しいものを）",
    "luckyProject": "CNCFプロジェクトから1つ選択して、なぜそれが2人にとってラッキーなのか短い説明付きで（プロジェクト名は正確に）",
    "metadata": {
      "participant1": "1人目の名前",
      "participant2": "2人目の名前",
      "calculatedScore": {
        "fiveElements": "五行相性スコア（0-100）",
        "astrology": "占星術的調和度（0-100）",
        "numerology": "数秘術的共鳴度（0-100）",
        "energy": "エネルギー調和度（0-100）",
        "finalScore": "総合スコア（上記を統合した最終スコア）"
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
    "fiveElementsAnalysis": "五行思想による相生相剋関係の詳細分析（木火土金水のバランス、相生・相剋の関係性）",
    "astrologicalAnalysis": "西洋占星術による総合的な相性分析（エレメント、星座、支配星の観点から）",
    "numerologyAnalysis": "数秘術とエネルギーパターンの分析",
    "energyFieldAnalysis": "オーラとエネルギーフィールドの共鳴分析",
    "technicalSynergy": "技術的シナジーの占術的解釈（五行的バランスで説明）"
  }
}`;

/**
 * 占星術的な診断結果の生成（OpenAI使用）
 * OpenAI API使用状態を判定し、診断結果にメタデータを追加
 * @param {Array} profiles - プロフィール配列
 * @param {string} mode - 診断モード（'duo' or 'group'）
 * @param {Object} env - 環境変数（OPENAI_API_KEY, logger等を含む）
 * @returns {Object} aiPoweredフラグとメタデータが更新された診断結果
 */
export async function generateAstrologicalDiagnosis(profiles, mode, env) {
  const logger = env?.logger || console;
  const debugMode = env?.DEBUG_MODE === 'true';
  
  if (debugMode) {
    logger.log('[DEBUG] V4-OpenAI Engine - Starting diagnosis with profiles:', JSON.stringify(profiles.map(p => p.basic?.name)));
  }
  
  // OpenAI APIキーの存在を確認してaiPoweredフラグを返す
  const result = mode === 'duo' && profiles.length === 2
    ? await generateDuoDiagnosis(profiles[0], profiles[1], env)
    : await (async () => {
        // グループモードの場合、簡易的に最初の2人で診断
        const baseResult = await generateDuoDiagnosis(profiles[0], profiles[1], env);
        baseResult.mode = 'group';
        baseResult.participants = profiles;
        return baseResult;
      })();
  
  // OpenAI APIが実際に使用されたかどうかを明確にする
  const isOpenAIUsed = isValidOpenAIKey(env?.OPENAI_API_KEY) && result.aiPowered === true;
  
  // デバッグモードでaiPowered状態の変化をログ出力
  if (debugMode && result.aiPowered !== isOpenAIUsed) {
    logger.log('[DEBUG] aiPowered flag changed from', result.aiPowered, 'to', isOpenAIUsed);
  }
  
  return {
    ...result,
    aiPowered: isOpenAIUsed,
    metadata: {
      ...result.metadata,
      engine: isOpenAIUsed ? 'openai-v4' : 'fallback-v4',
      model: isOpenAIUsed ? CONFIG.MODEL : 'none'
    }
  };
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
    // フォールバック診断を完全に無効化 - 常にエラーを投げる
    const error = new Error('OpenAI API key is not configured or invalid. Please check OPENAI_API_KEY environment variable in Cloudflare Pages settings.');
    console.error('[V4-OpenAI Engine] ' + error.message);
    console.error('[V4-OpenAI Engine] Key validation failed. Key length:', openaiApiKey ? openaiApiKey.length : 0);
    throw error;
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
      
      // フォールバック診断を完全に無効化 - 常にエラーを投げる
      throw new Error(`${errorMessage} (Status: ${response.status})`);
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
      
      // フォールバック診断を完全に無効化 - 常にエラーを投げる
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    
    // 必須フィールドの存在チェック
    if (!result.diagnosis || typeof result.diagnosis !== 'object') {
      console.error('[V4-OpenAI Engine] Invalid response structure: missing diagnosis field');
      
      // フォールバック診断を完全に無効化 - 常にエラーを投げる
      throw new Error('Invalid OpenAI response structure: missing required fields');
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
      luckyItem: diagnosis?.luckyItem || ''
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
    // フォールバック診断を完全に無効化 - 常にエラーを投げる
    console.error('[V4-OpenAI Engine] Failed to generate diagnosis:', error);
    throw error;
  }
}

/**
 * フォールバック診断（廃止済み - 使用禁止）
 * この関数は互換性のために残されていますが、呼び出されることはありません
 * @deprecated フォールバック診断は完全に無効化されました
 */
// eslint-disable-next-line no-unused-vars
function generateFallbackDiagnosis_DEPRECATED(profile1, profile2, env) {
  // この関数は呼び出されることはありませんが、互換性のために保持
  throw new Error('Fallback diagnosis has been completely disabled. Please configure OPENAI_API_KEY.');
  
  /* 以下のコードは実行されません（デッドコード）
  
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
  
  // CNCFプロジェクトからランダムに選択
  const randomProject = CNCF_PROJECTS[Math.floor(Math.random() * CNCF_PROJECTS.length)];
  const luckyProject = `${randomProject} - 2人の技術的な成長を加速させる最高のプロジェクト！`;
  
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
    conversationStarters: [
      '最近触った新しい技術は？',
      'デバッグで一番苦労した経験は？',
      'コードレビューで重視するポイントは？',
      '理想の開発環境について教えて',
      'プログラミングを始めたきっかけは？'
    ],
    hiddenGems: 'お互いの技術的な視点が補完的で、一緒にプロジェクトを進めると素晴らしい成果が期待できます。',
    luckyItem: luckyItems[Math.floor(Math.random() * luckyItems.length)],
    luckyAction: luckyActions[Math.floor(Math.random() * luckyActions.length)],
    luckyProject: luckyProject,
    astrologicalAnalysis: `二人のエンジニアリング・エナジーが美しく調和し、まさに分散システムのように補完し合っています。`,
    techStackCompatibility: `お互いの技術スタックが素晴らしい相性を示しています。`,
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
    participants: [profile1, profile2],
    createdAt: new Date().toISOString(),
    aiPowered: false,
    metadata: {
      participant1: name1,
      participant2: name2,
      ...(isDevelopment ? FALLBACK_CONFIG.METADATA : {})
    },
    ...(isDevelopment ? { warning: FALLBACK_CONFIG.WARNING_MESSAGE.DEVELOPMENT } : {})
  };
  */
}