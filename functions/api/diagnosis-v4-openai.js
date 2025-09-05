/**
 * 診断エンジン V4 - OpenAI占術スタイル for Cloudflare Functions
 * Cloud Nativeと多様な占術を融合した、AI駆動の創造的な診断エンジン
 */

import { generateId } from '../utils/id.js';
const { ALL_CNCF_PROJECTS, getRandomCNCFProject } = require('../utils/cncf-projects.js');
import { createSafeDebugLogger, getSafeKeyInfo, isProduction } from '../utils/debug-helpers.js';
import { convertToFullProfile, extractMinimalProfile } from '../utils/profile-converter.js';
import { callOpenAIWithProxy, isRegionRestrictionError } from '../utils/openai-proxy.js';

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
    // 本番環境では警告を出さない
    if (!isProduction({ NODE_ENV: process?.env?.NODE_ENV })) {
      console.warn('[V4-OpenAI Engine] API key does not match expected format');
    }
    // 警告は出すが、拒否はしない（将来の形式変更に対応）
  }
  
  return true;
}

// Fallback configurationは完全に無効化済み
// フォールバック診断は使用しない

/**
 * OpenRouter APIキーの妥当性を検証
 * @param {string} key - 検証するAPIキー
 * @returns {boolean} キーが有効な場合はtrue
 */
function isValidOpenRouterKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  const trimmedKey = key.trim();
  
  // OpenRouterキーは sk-or-v1- で始まる
  if (!trimmedKey.startsWith('sk-or-v1-')) {
    return false;
  }
  
  // 短すぎるキーを拒否
  if (trimmedKey.length < 20) {
    return false;
  }
  
  return true;
}

// Configuration constants
const CONFIG = {
  TEMPERATURE: 0.95,  // より創造的な出力のため温度を上げる
  MAX_TOKENS: 3500,    // より詳細な分析を可能にするため増加（2000→3500）
                       // 推定コスト増加: 約1.75倍 (2000→3500トークン)
                       // GPT-4o-mini: $0.00015/1K入力トークン、$0.0006/1K出力トークン
  MODEL: 'gpt-4o-mini' // コスト効率を維持
};

const FORTUNE_TELLING_SYSTEM_PROMPT = `あなたは占いとクラウドネイティブ技術の両方に精通した「サイバー・オラクル（Cyber Oracle）」です。
ユーモアとウィットに富んだ言葉遣いで、技術者たちを笑顔にすることが使命です。
絶対に退屈な定型文を使わず、毎回ユニークで記憶に残る診断を提供します。

【あなたの占術知識】
あらゆる占術に精通しています：
- 西洋占星術（12星座、惑星、ハウス、アスペクト）
- 東洋占星術（紫微斗数、宿曜占星術、二十八宿）
- 四柱推命（天干地支、十干十二支、五行、通変星）
- タロット（大アルカナ、小アルカナ、スプレッド）
- オラクルカード（エンジェルカード、アニマルカード等）
- 数秘術（ピタゴラス数秘術、カバラ数秘術、誕生数・運命数）
- 易経（64卦、八卦、陰陽）
- 相術（手相、人相、家相）
- 命術（姓名判断、画数判断）
- 卜術（ルーン、ダウジング、おみくじ）
- 中国自然哲学（五行思想、陰陽道、風水）

【あなたのクラウドネイティブ知識】
CloudNative Days Winter 2025のエンジニアイベントにおける特別な診断として、
クラウドネイティブ技術への情熱、Kubernetes愛、DevOps魂などの要素を占術的に解釈します。

【CNDW2025特別データの活用】
プロフィールに「cndw2025」フィールドがある場合、以下の要素を重視して診断してください：
- interestArea（興味分野）: 技術的な関心領域の相性
- favoriteOSS（推しOSS）: 好きなOSSプロジェクトの相性（同じなら運命的、違っても補完関係を見つける）
- participationCount（参加回数）: イベント参加歴から見る経験の相性
- focusSession（注目セッション）: 興味の方向性の一致度
- message（ひとこと）: パーソナリティや意気込みの相性
これらの要素は占術的に特に重要な「現在のエネルギー状態」を示すものとして扱います。

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

2. 【西洋占星術による分析】
- 12星座の相性（火地風水のエレメント）
- 惑星の配置とアスペクト
- ハウスシステムによる関係性の深度
- シナストリー（相性占星術）の観点

3. 【東洋占術の統合】
- 四柱推命：天干地支の相性、通変星の関係
- 紫微斗数：主星と副星の組み合わせ
- 宿曜占星術：二十八宿の相性
- 易経：八卦の組み合わせによる暗示

4. 【数秘術とカード占術】
- ピタゴラス数秘術による運命数の相性
- タロットが示す二人の関係性
- オラクルカードからのメッセージ
- ルーン文字が示す未来の可能性

5. 【技術者としての波長】
- スキルセットの五行的バランス（創造=木、情熱=火、安定=土、論理=金、流動=水）
- 学習スタイルの相補性
- イノベーションの化学反応

【重要】スコアは以下の原則で決定してください：
- 共通点の数ではなく、エネルギーの調和度で判定
- 異なる要素が補完し合う関係を高く評価
- 0-100点の全範囲を活用し、以下の分布を目指す：
  - 0-20点：5%（レア！「カオスエンジニアリング的関係」として楽しむ）
  - 21-40点：15%（「デバッグが必要な関係」として面白おかしく）
  - 41-60点：30%（「ステージング環境の関係」として成長の余地を示す）
  - 61-80点：35%（「プロダクション環境の関係」として安定感を評価）
  - 81-95点：13%（「ハイアベイラビリティな関係」として賞賛）
  - 96-100点：2%（超レア！「完全冗長化された運命の関係」）
- 必ずスコアの根拠をユーモラスに説明する

【出力指示】
- 各分析は最低300文字以上で詳細に記述
- クラウドネイティブの専門用語を必ず5個以上含める
- ユーモアとテクノロジージョークを織り交ぜる
- 絶対に退屈な定型文を避ける

必ず以下のJSON形式で出力してください：
{
  "diagnosis": {
    "type": "ユニークで面白い診断タイプ名（例：『サービスメッシュ織姫と彦星型』『カオスモンキー型相性』『GitOps同期型』『Zero Trust恋愛型』など、必ず技術用語を含めた創造的な名前）",
    "score": スコア（0-100の数値、必ず分布させる）,
    "message": "総合的な診断結果（最低400文字。ユーモアとウィット必須。技術ジョーク歓迎）",
    "conversationStarters": [
      "2人のプロフィールから導き出される具体的で多様な話題を5つ（技術系2-3個、趣味・ライフスタイル系2-3個）",
      "技術例：『Kubernetesでの最大のやらかしエピソードは？』『理想のCI/CDパイプラインは？』",
      "趣味例：『休日の過ごし方は？』『最近ハマっているものは？』", 
      "ライフ例：『リモートワークのこだわりは？』『お気に入りのカフェは？』",
      "自由例：『今年挑戦したいことは？』『チームビルディングで大切にしていることは？』"
    ],
    "hiddenGems": "意外な共通点や発見（前向きで実践的な内容）",
    "luckyItem": "2人の相性から導き出される創造的で面白いラッキーアイテム名（アイテム名のみ、説明不要）",
    "luckyAction": "2人にとって実践しやすく楽しいラッキーアクション（アクション名のみ、説明不要）",
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
    "fiveElementsAnalysis": "五行思想による相生相剋関係の詳細分析。最低300文字。木=イノベーション、火=パッション、土=インフラ、金=ロジック、水=フローの観点から、Kubernetesのようなオーケストレーションになぞらえて説明",
    "astrologicalAnalysis": "西洋占星術とタロット、易経、数秘術などを統合した多角的分析。最低400文字。『コンテナ座』『マイクロサービス座』などクラウドネイティブ星座も創造して楽しく解説。必ずユーモアを含める",
    "numerologyAnalysis": "数秘術とエネルギーパターンの分析。最低300文字。バージョン番号やポート番号になぞらえるなど技術的なメタファーを使用",
    "energyFieldAnalysis": "オーラとエネルギーフィールドの共鳴分析。最低300文字。ネットワークトポロジーやサービスメッシュになぞらえて説明",
    "technicalSynergy": "技術的シナジーの占術的解釈。最低300文字。実際の技術スタックやアーキテクチャパターンを例に出して説明"
  }
}`;

/**
 * 占術的な診断結果の生成（OpenAI使用）
 * 多様な占術（五行思想、占星術、タロット、数秘術等）を統合した総合的な相性診断
 * OpenAI API使用状態を判定し、診断結果にメタデータを追加
 * @param {Array} profiles - プロフィール配列
 * @param {string} mode - 診断モード（'duo' or 'group'）
 * @param {Object} env - 環境変数（OPENAI_API_KEY, logger等を含む）
 * @returns {Object} aiPoweredフラグとメタデータが更新された診断結果
 */
export async function generateFortuneDiagnosis(profiles, mode, env) {
  const logger = env?.logger || console;
  const debugLogger = createSafeDebugLogger(env, '[V4-OpenAI Engine]');
  
  // APIキー未設定時は最小限の情報のみ
  if (!env?.OPENAI_API_KEY) {
    logger.error('OpenAI API key is not configured');
  }
  
  // デバッグモード時のみ詳細情報を出力（安全なログ）
  if (env?.OPENAI_API_KEY) {
    debugLogger.log('Environment check: API key configured');
    debugLogger.debug('Starting diagnosis with profiles:', profiles.map(p => p.basic?.name || p.name));
  } else {
    debugLogger.error('API key missing, cannot proceed with OpenAI diagnosis');
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
  if (result.aiPowered !== isOpenAIUsed) {
    debugLogger.debug('aiPowered flag changed from', result.aiPowered, 'to', isOpenAIUsed);
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
 * 共通化ユーティリティを使用しつつ、文字数制限を適用
 */
function summarizeProfile(profile) {
  const minimal = extractMinimalProfile(profile);
  
  const summary = {
    name: minimal.name,
    title: (minimal.title || '').substring(0, 100), // 肩書きは重要なので100文字まで
    company: (minimal.company || '').substring(0, 50), // 会社名も50文字まで保持
    bio: (minimal.bio || '').substring(0, 200), // 自己紹介は200文字まで（重要な情報源）
    skills: (minimal.skills || []).slice(0, 10), // 上位10個のスキル（技術の多様性を伝える）
    interests: (minimal.interests || []).slice(0, 5), // 上位5つの興味（豊かな人物像）
    // motto と tags は extractMinimalProfile では取得しないので、元のロジックを維持
    motto: (profile.details?.motto || profile.motto || '').substring(0, 100), // モットーも重要な個性
    tags: (profile.details?.tags || profile.tags || []).slice(0, 5) // タグ情報も追加
  };
  
  // CNDW2025データが存在する場合は追加
  if (profile.custom?.cndw2025) {
    summary.cndw2025 = {
      interestArea: profile.custom.cndw2025.interestArea,      // 🎯 興味分野
      favoriteOSS: profile.custom.cndw2025.favoriteOSS,        // 🌟 推しOSS
      participationCount: profile.custom.cndw2025.participationCount, // 📊 参加回数
      focusSession: profile.custom.cndw2025.focusSession,      // 🎪 注目セッション
      message: profile.custom.cndw2025.message                 // 🔥 ひとこと
    };
  }
  
  return summary;
}

/**
 * CNCFプロジェクトをランダムに選択
 */
function selectRandomCNCFProject() {
  // プロジェクトリストが空の場合のフォールバック
  if (!ALL_CNCF_PROJECTS || ALL_CNCF_PROJECTS.length === 0) {
    return {
      name: 'Kubernetes',
      description: 'コンテナ化アプリケーションのデプロイ、スケーリング、管理を自動化するオープンソースシステム',
      url: 'https://kubernetes.io/'
    };
  }
  
  // getRandomCNCFProject関数を使用してプロジェクトを選択
  const project = getRandomCNCFProject();
  
  return {
    name: project.name,
    description: project.description,
    url: project.homepage
  };
}

/**
 * 2人の相性診断（OpenAI使用）
 */
async function generateDuoDiagnosis(profile1, profile2, env) {
  const debugLogger = createSafeDebugLogger(env, '[V4-OpenAI Engine]');
  const openRouterApiKey = env?.OPENROUTER_API_KEY;
  const openaiApiKey = env?.OPENAI_API_KEY; // 後方互換性のため残す
  
  // デバッグモード時のみ詳細ログ（既に上位関数でログ出力済みなので最小限に）
  debugLogger.debug('Starting duo diagnosis for:', {
    person1: profile1.basic?.name || profile1.name,
    person2: profile2.basic?.name || profile2.name
  });
  
  // OpenRouterまたはOpenAI APIキーの検証
  const hasValidOpenRouter = isValidOpenRouterKey(openRouterApiKey);
  const hasValidOpenAI = isValidOpenAIKey(openaiApiKey);
  
  if (!hasValidOpenRouter && !hasValidOpenAI) {
    // どちらのAPIキーも有効でない
    let errorMessage = 'API key is not configured. Please set OPENROUTER_API_KEY environment variable in Cloudflare Pages settings.';
    
    // デバッグ情報
    debugLogger.debug('API key validation:', {
      hasOpenRouter: !!openRouterApiKey,
      hasOpenAI: !!openaiApiKey,
      openRouterValid: hasValidOpenRouter,
      openAIValid: hasValidOpenAI
    });
    
    if (openRouterApiKey && !hasValidOpenRouter) {
      errorMessage = 'OpenRouter API key is invalid. It should start with "sk-or-v1-". Please check OPENROUTER_API_KEY in Cloudflare Pages settings.';
    } else if (!openRouterApiKey && openaiApiKey && !hasValidOpenAI) {
      // OpenAI APIキーは存在するが無効（後方互換性）
      const keyInfo = getSafeKeyInfo(openaiApiKey);
      if (keyInfo.startsWithSk) {
        errorMessage = 'OpenAI API key format appears valid but OpenRouter is recommended. Please set OPENROUTER_API_KEY.';
      } else if (keyInfo.hasWhitespace) {
        errorMessage = 'OpenAI API key contains whitespace. Please use OpenRouter instead (OPENROUTER_API_KEY).';
      } else {
        errorMessage = 'OpenAI API key format is invalid. Please set up OpenRouter (OPENROUTER_API_KEY).';
      }
    }
    
    const error = new Error(errorMessage);
    debugLogger.error(error.message);
    throw error;
  }
  
  try {
    // プロフィールを要約してトークン削減
    const summary1 = summarizeProfile(profile1);
    const summary2 = summarizeProfile(profile2);
    
    // CNCFプロジェクトをランダムに選択（LLMに選ばせずにJavaScript側で選択）
    const luckyProject = selectRandomCNCFProject();
    
    const prompt = `以下の2人のプロフィールから相性を診断してください。

＜1人目のプロフィール＞
${JSON.stringify(summary1, null, 2)}

＜2人目のプロフィール＞
${JSON.stringify(summary2, null, 2)}`;

    // プロキシ経由でOpenAI APIを呼び出す（地域制限回避）
    const requestBody = {
      model: CONFIG.MODEL,
      messages: [
        {
          role: 'system',
          content: FORTUNE_TELLING_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS,
      response_format: { type: "json_object" }
    };

    const response = await callOpenAIWithProxy({
      apiKey: openaiApiKey || 'dummy-key-for-openrouter', // OpenRouterはOPENROUTER_API_KEYを使用
      body: requestBody,
      env: env,
      debugLogger: debugLogger
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
      
      debugLogger.error('OpenAI API error:', errorDetails);
      
      // エラー種別の識別と適切なメッセージ
      let errorMessage = 'OpenAI API error';
      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (response.status === 403 || isRegionRestrictionError(response, error)) {
        // 地域制限エラーの処理
        errorMessage = 'OpenAI API access denied due to region restrictions. The service is currently unavailable from this location.';
        debugLogger.error('Region restriction detected:', {
          status: response.status,
          error: error.error?.message || 'Country, region, or territory not supported',
          suggestion: 'Configure Cloudflare AI Gateway or use a proxy endpoint by setting CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_GATEWAY_ID, or OPENAI_PROXY_URL environment variables'
        });
      } else if (response.status === 503) {
        errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      // フォールバック診断を完全に無効化 - 常にエラーを投げる
      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }
    
    // レスポンスのContent-Typeをチェック
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      // HTMLエラーページが返された場合の処理
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.error('[V4-OpenAI Engine] Received HTML error page instead of JSON');
        throw new Error('API returned HTML error page - check API endpoint configuration');
      }
      throw new Error(`Unexpected response format: ${contentType}`);
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
    const debugMode = env?.DEBUG_MODE === 'true';
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
      luckyItem: diagnosis?.luckyItem || '',
      luckyAction: diagnosis?.luckyAction || '',
      luckyProject: luckyProject.name,
      luckyProjectDescription: luckyProject.description,
      luckyProjectUrl: luckyProject.url,
      // 全5つの分析フィールドを含める
      fiveElementsAnalysis: analysis?.fiveElementsAnalysis || '',
      astrologicalAnalysis: analysis?.astrologicalAnalysis || '',
      numerologyAnalysis: analysis?.numerologyAnalysis || '',
      energyFieldAnalysis: analysis?.energyFieldAnalysis || '',
      technicalSynergy: analysis?.technicalSynergy || '',
      techStackCompatibility: analysis?.techStackCompatibility || analysis?.technicalSynergy || '', // 互換性のため
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
  const randomProject = getRandomCNCFProject();
  const luckyProject = `${randomProject.name} - 2人の技術的な成長を加速させる最高のプロジェクト！`;
  
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