/**
 * 診断エンジン V4 - OpenAI占術スタイル for Cloudflare Functions
 * Cloud Nativeと多様な占術を融合した、AI駆動の創造的な診断エンジン
 */

import { generateId } from '../utils/id.js';
import { CNCF_PROJECTS, getProjectDetails } from '../utils/cncf-projects.js';
import { isDebugMode, getFilteredEnvKeys, getSafeKeyInfo } from '../utils/debug-helpers.js';

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
  const debugMode = isDebugMode(env);
  
  // APIキー未設定時は最小限の情報のみ
  if (!env?.OPENAI_API_KEY) {
    console.error('[V4-OpenAI Engine] OpenAI API key is not configured');
  }
  
  // デバッグモード時のみ詳細情報を出力
  if (debugMode) {
    if (env?.OPENAI_API_KEY) {
      console.log('[V4-OpenAI Engine] === DEBUG MODE ===');
      console.log('[V4-OpenAI Engine] Environment check: API key configured');
      
      // プロファイル情報のみ出力（APIキー情報は出力しない）
      logger.log('[DEBUG] Starting diagnosis with profiles:', profiles.map(p => p.basic?.name || p.name));
    } else {
      // APIキー未設定時も状況を出力
      console.log('[V4-OpenAI Engine] === DEBUG MODE (No API Key) ===');
      const filteredKeys = getFilteredEnvKeys(env);
      console.log('[V4-OpenAI Engine] Available env keys count:', filteredKeys.length);
    }
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
 * CNCFプロジェクトをランダムに選択
 */
function selectRandomCNCFProject() {
  // プロジェクトリストが空の場合のフォールバック
  if (!CNCF_PROJECTS || CNCF_PROJECTS.length === 0) {
    return {
      name: 'Kubernetes',
      description: 'コンテナ化アプリケーションのデプロイ、スケーリング、管理を自動化するオープンソースシステム',
      url: 'https://www.cncf.io/projects/kubernetes/'
    };
  }
  
  // ランダムにプロジェクト名を選択
  const randomIndex = Math.floor(Math.random() * CNCF_PROJECTS.length);
  const projectName = CNCF_PROJECTS[randomIndex];
  
  // プロジェクトの詳細情報を取得
  const projectDetails = getProjectDetails(projectName);
  
  // プロジェクト名をURLフレンドリーにする（より堅牢な処理）
  const urlName = projectName.toLowerCase()
    .replace(/\s+/g, '-')           // スペース → ハイフン
    .replace(/[^\w-]/g, '')         // 英数字とハイフン以外を削除
    .replace(/-+/g, '-')            // 連続ハイフンを1つに
    .replace(/^-|-$/g, '');         // 前後のハイフンを削除
  
  return {
    name: projectName,
    description: projectDetails ? projectDetails.description : `CNCFの${projectName}プロジェクト`,
    url: `https://www.cncf.io/projects/${urlName}/`
  };
}

/**
 * 2人の相性診断（OpenAI使用）
 */
async function generateDuoDiagnosis(profile1, profile2, env) {
  const debugMode = isDebugMode(env);
  const openaiApiKey = env?.OPENAI_API_KEY;
  
  // デバッグモード時のみ詳細ログ（既に上位関数でログ出力済みなので最小限に）
  if (debugMode) {
    console.log('[V4-OpenAI Engine] Starting duo diagnosis for:', {
      person1: profile1.basic?.name || profile1.name,
      person2: profile2.basic?.name || profile2.name
    });
  }
  
  // APIキーの妥当性を検証
  if (!isValidOpenAIKey(openaiApiKey)) {
    // フォールバック診断を完全に無効化 - 常にエラーを投げる
    let errorMessage = 'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable in Cloudflare Pages settings.';
    
    if (openaiApiKey && openaiApiKey.length > 0) {
      // キーは存在するが無効な形式
      const keyInfo = getSafeKeyInfo(openaiApiKey);
      if (keyInfo.startsWithSk) {
        errorMessage = 'OpenAI API key format appears valid but may be expired or incorrect. Please verify the OPENAI_API_KEY in Cloudflare Pages settings.';
      } else if (keyInfo.hasWhitespace) {
        errorMessage = 'OpenAI API key contains whitespace. Please check for extra spaces in OPENAI_API_KEY environment variable.';
      } else {
        errorMessage = 'OpenAI API key format is invalid. It should start with "sk-". Please check OPENAI_API_KEY in Cloudflare Pages settings.';
      }
    }
    
    const error = new Error(errorMessage);
    console.error('[V4-OpenAI Engine] ' + error.message);
    
    // 詳細なデバッグ情報はDEBUG_MODEまたは開発環境でのみ出力
    if (debugMode) {
      console.error('[V4-OpenAI Engine] Validation details:', keyInfo);
    }
    
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