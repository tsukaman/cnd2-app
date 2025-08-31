/**
 * OpenAI Diagnosis Implementation for Cloudflare Functions
 */

// エラー分類定数
const ERROR_TYPES = {
  API_KEY_MISSING: 'API_KEY_MISSING',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

// エラーメッセージマッピング
const ERROR_MESSAGES = {
  [ERROR_TYPES.API_KEY_MISSING]: 'OpenAI API key not configured',
  [ERROR_TYPES.NETWORK_ERROR]: 'Network request failed',
  [ERROR_TYPES.RATE_LIMIT]: 'OpenAI API rate limit exceeded',
  [ERROR_TYPES.INVALID_RESPONSE]: 'Invalid response from OpenAI API',
  [ERROR_TYPES.JSON_PARSE_ERROR]: 'Failed to parse OpenAI response as JSON',
  [ERROR_TYPES.TIMEOUT]: 'Request timeout',
  [ERROR_TYPES.UNKNOWN]: 'Unknown error occurred'
};

const CND2_SYSTEM_PROMPT = `あなたはCND² - CloudNative Days × Connect 'n' Discoverの相性診断AIアシスタントです。
エンジニアのPrairieカード情報から、技術的な相性やコラボレーション可能性を診断します。

診断結果は以下のJSON形式で返してください：
{
  "type": "診断タイプ名（クリエイティブな名前）",
  "compatibility": 相性スコア（0-100）,
  "summary": "診断結果のサマリー（100文字程度）",
  "strengths": ["強み1", "強み2", "強み3"],
  "opportunities": ["機会1", "機会2"],
  "advice": "アドバイス（100文字程度）",
  "fortuneTelling": {
    "overall": "総合運の点数（100点満点）",
    "tech": "技術運の点数（100点満点）",
    "collaboration": "コラボ運の点数（100点満点）",
    "growth": "成長運の点数（100点満点）",
    "message": "運勢メッセージ（50文字程度）"
  }
}

診断は前向きで建設的な内容にし、技術的な共通点や補完関係を見つけてください。
点取り占いは、プロフィールの内容から判断して、各運勢を100点満点で評価してください。`;

/**
 * Sanitize profile to remove PII before sending to OpenAI
 */
function sanitizeProfile(profile) {
  // Only include non-sensitive information
  return {
    basic: {
      tags: profile.basic?.tags || [],
      company: profile.basic?.company ? '企業' : undefined, // Generic label
      // Exclude: name, email, twitter, avatar
    },
    interests: profile.interests || {},
    // Exclude any other sensitive fields
  };
}

async function generateOpenAIDiagnosis(profiles, mode, env) {
  const debugMode = env.DEBUG_MODE === 'true';
  
  // Check if OpenAI API key is configured
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log(`[CND²] ${ERROR_MESSAGES[ERROR_TYPES.API_KEY_MISSING]}, using fallback`);
    return {
      error: ERROR_TYPES.API_KEY_MISSING,
      message: ERROR_MESSAGES[ERROR_TYPES.API_KEY_MISSING],
      fallback: true
    };
  }

  try {
    // Sanitize profiles to protect PII
    const sanitizedProfiles = profiles.map(sanitizeProfile);
    
    if (debugMode) {
      console.log('[DEBUG] Sanitized profiles:', JSON.stringify(sanitizedProfiles, null, 2));
    }
    
    // Build prompt based on mode
    let prompt = '';
    if (mode === 'duo') {
      prompt = `以下の2人のエンジニアの相性を診断してください：

エンジニア1:
${JSON.stringify(sanitizedProfiles[0], null, 2)}

エンジニア2:
${JSON.stringify(sanitizedProfiles[1], null, 2)}

両者の技術スタック、興味分野、経験を考慮して、コラボレーションの可能性を評価してください。`;
    } else {
      prompt = `以下の${sanitizedProfiles.length}人のエンジニアグループの相性を診断してください：

${sanitizedProfiles.map((p, i) => `エンジニア${i + 1}:\n${JSON.stringify(p, null, 2)}`).join('\n\n')}

グループ全体のダイナミクスと、チームとしての強みを評価してください。`;
    }
    
    if (debugMode) {
      console.log('[DEBUG] OpenAI prompt:', prompt);
    }

    // Call OpenAI API using fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
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
      })
    });

    if (!response.ok) {
      // Classify error based on HTTP status
      let errorType = ERROR_TYPES.UNKNOWN;
      let errorMessage = `HTTP ${response.status}`;
      
      if (response.status === 429) {
        errorType = ERROR_TYPES.RATE_LIMIT;
        errorMessage = ERROR_MESSAGES[ERROR_TYPES.RATE_LIMIT];
      } else if (response.status >= 500) {
        errorType = ERROR_TYPES.NETWORK_ERROR;
        errorMessage = `${ERROR_MESSAGES[ERROR_TYPES.NETWORK_ERROR]} (HTTP ${response.status})`;
      } else if (response.status === 401) {
        errorType = ERROR_TYPES.API_KEY_MISSING;
        errorMessage = 'Invalid API key';
      }
      
      console.error(`[CND²] OpenAI API error: ${errorMessage}`);
      return {
        error: errorType,
        message: errorMessage,
        statusCode: response.status
      };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (debugMode) {
      console.log('[DEBUG] OpenAI raw response:', content);
      console.log('[DEBUG] Token usage:', data.usage);
    }
    
    if (!content) {
      console.error('[CND²] Empty OpenAI response');
      return null;
    }

    // Validate JSON before parsing
    let result;
    try {
      // First, check if content is valid JSON
      result = JSON.parse(content);
      
      if (debugMode) {
        console.log('[DEBUG] Parsed diagnosis result:', result);
      }
    } catch (parseError) {
      console.error('[CND²] OpenAI response is not valid JSON:', content);
      console.error('[CND²] Parse error:', parseError);
      if (debugMode) {
        console.log('[DEBUG] Failed content:', content);
      }
      return null;
    }

    // Return the parsed result with aiPowered flag
    try {
      return {
        ...result,
        aiPowered: true
      };
    } catch (error) {
      console.error('[CND²] Failed to process parsed result:', error);
      return null;
    }
    
  } catch (error) {
    // Classify the error type
    let errorType = ERROR_TYPES.UNKNOWN;
    let errorMessage = ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorType = ERROR_TYPES.TIMEOUT;
      errorMessage = ERROR_MESSAGES[ERROR_TYPES.TIMEOUT];
    } else if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      errorType = ERROR_TYPES.NETWORK_ERROR;
      errorMessage = ERROR_MESSAGES[ERROR_TYPES.NETWORK_ERROR];
    }
    
    console.error(`[CND²] OpenAI diagnosis failed: ${errorMessage}`, {
      type: errorType,
      message: error.message,
      name: error.name
    });
    
    return {
      error: errorType,
      message: errorMessage,
      originalError: error.message
    };
  }
}

/**
 * Generate fallback diagnosis when OpenAI is not available
 */
function generateFallbackDiagnosis(profiles, mode) {
  // Extract skills and interests from profiles
  const allSkills = new Set();
  const allInterests = new Set();
  
  profiles.forEach(profile => {
    if (profile.basic?.tags) {
      profile.basic.tags.forEach(tag => allSkills.add(tag));
    }
    if (profile.interests) {
      Object.values(profile.interests).forEach(interest => {
        if (Array.isArray(interest)) {
          interest.forEach(item => allInterests.add(item));
        }
      });
    }
  });

  // Calculate compatibility based on common skills
  const commonSkills = Array.from(allSkills).slice(0, 3);
  const compatibility = Math.min(95, 70 + commonSkills.length * 5 + Math.floor(Math.random() * 10));

  const types = [
    'クラウドネイティブ・パートナー',
    'イノベーション・デュオ',
    'テクノロジー・シナジー',
    'オープンソース・コラボレーター',
    'アジャイル・チーム'
  ];

  // 点取り占い機能の追加
  const calculateFortune = () => {
    // スキル数や興味分野の多さに基づいて運勢を計算
    const skillCount = allSkills.size;
    const interestCount = allInterests.size;
    
    // 基本スコア（60〜90点のレンジ）
    const baseScore = 60 + Math.floor(Math.random() * 30);
    
    return {
      overall: Math.min(100, baseScore + Math.floor(skillCount * 2)),
      tech: Math.min(100, baseScore + Math.floor(skillCount * 3)),
      collaboration: Math.min(100, baseScore + Math.floor(compatibility * 0.8)),
      growth: Math.min(100, baseScore + Math.floor(interestCount * 2.5)),
      message: commonSkills.length > 0 
        ? `${commonSkills[0]}での大きな飛躍が期待できる！` 
        : '新しい技術との出会いが運気を上げる！'
    };
  };

  return {
    type: types[Math.floor(Math.random() * types.length)],
    compatibility,
    summary: `共通の技術領域での強い相性が見られます。特に${commonSkills.join('、')}での協力が期待できます。`,
    strengths: [
      '技術的な興味の共通点が多い',
      '補完的なスキルセットを持つ',
      'コミュニケーションスタイルが合う'
    ],
    opportunities: [
      '一緒にOSSプロジェクトに貢献',
      '技術勉強会の共同開催'
    ],
    advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
    fortuneTelling: calculateFortune(),
    aiPowered: false
  };
}

module.exports = {
  generateOpenAIDiagnosis,
  generateFallbackDiagnosis
};