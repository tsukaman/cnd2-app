/**
 * Cloudflare Pages Function - Diagnosis v3
 * Prairie CardのHTML全体をAIに渡して診断を行う
 */

// 定数定義
const HTML_SIZE_LIMIT = 50000;
const REGEX_MAX_LENGTH = 500;
const META_ATTR_MAX_LENGTH = 200;

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // CORSヘッダー
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    // リクエストボディを取得
    const body = await request.json();
    
    // URLのバリデーション
    if (!body.urls || !Array.isArray(body.urls) || body.urls.length !== 2) {
      return new Response(
        JSON.stringify({ error: '2つのPrairie Card URLが必要です' }),
        { status: 400, headers }
      );
    }
    
    const [url1, url2] = body.urls;
    
    // URL検証
    for (const url of [url1, url2]) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
          return new Response(
            JSON.stringify({ error: 'HTTPSのURLのみ対応しています' }),
            { status: 400, headers }
          );
        }
        const validHosts = ['prairie.cards', 'my.prairie.cards'];
        const isValid = validHosts.includes(parsed.hostname) || 
                       parsed.hostname.endsWith('.prairie.cards');
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Prairie CardのURLを指定してください' }),
            { status: 400, headers }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: '無効なURLです' }),
          { status: 400, headers }
        );
      }
    }
    
    // OpenAI APIキーのチェック
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI APIキーが設定されていません' }),
        { status: 503, headers }
      );
    }
    
    console.log('[Diagnosis v3] Starting diagnosis for:', url1, url2);
    
    // Prairie Card HTMLを並列取得
    const [html1, html2] = await Promise.all([
      fetch(url1, {
        headers: {
          'User-Agent': 'CND2/1.0 DiagnosisEngine',
          'Accept': 'text/html'
        }
      }).then(r => r.text()),
      fetch(url2, {
        headers: {
          'User-Agent': 'CND2/1.0 DiagnosisEngine',
          'Accept': 'text/html'
        }
      }).then(r => r.text())
    ]);
    
    // HTMLを適切なサイズに制限（各50KB）
    const trimmedHtml1 = html1.substring(0, 50000);
    const trimmedHtml2 = html2.substring(0, 50000);
    
    // 診断プロンプトを構築
    const prompt = buildDiagnosisPrompt(trimmedHtml1, trimmedHtml2);
    
    // OpenAI APIを直接呼び出し（fetch使用）
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたはCloudNative Days Tokyo 2025の相性診断を行う専門AIです。与えられたHTMLから情報を正確に抽出し、詳細な相性診断を提供してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!openaiResponse.ok) {
      console.error('[Diagnosis v3] OpenAI API error:', await openaiResponse.text());
      throw new Error('AI診断に失敗しました');
    }
    
    const openaiData = await openaiResponse.json();
    const aiResult = JSON.parse(openaiData.choices[0].message.content);
    
    // 診断結果を整形
    const diagnosisResult = {
      id: generateId(),
      mode: 'duo',
      type: aiResult.diagnosis.type,
      score: aiResult.diagnosis.score,
      message: aiResult.diagnosis.message,
      conversationStarters: aiResult.diagnosis.conversationStarters,
      hiddenGems: aiResult.diagnosis.hiddenGems,
      shareTag: aiResult.diagnosis.shareTag,
      participants: [
        createProfile(aiResult.extracted_profiles.person1),
        createProfile(aiResult.extracted_profiles.person2)
      ],
      createdAt: new Date().toISOString(),
      metadata: {
        engine: 'v3-cloudflare',
        model: 'gpt-4o-mini',
        analysis: aiResult.analysis
      }
    };
    
    // KVに結果を保存（オプション）
    if (env.DIAGNOSIS_KV) {
      const cacheKey = `diagnosis:${diagnosisResult.id}`;
      await env.DIAGNOSIS_KV.put(
        cacheKey,
        JSON.stringify(diagnosisResult),
        { expirationTtl: 86400 * 7 } // 7日間
      );
    }
    
    return new Response(
      JSON.stringify(diagnosisResult),
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error('[Diagnosis v3] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '診断中にエラーが発生しました'
      }),
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }}
    );
  }
}

// OPTIONSリクエスト対応（CORS）
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// 診断プロンプト生成関数
/**
 * HTMLを構造を保持しながらサイズ制限する
 * @param {string} html 元のHTML
 * @param {number} maxLength 最大文字数
 * @returns {string} トリミングされたHTML
 */
function trimHtmlSafely(html, maxLength = 50000) {
  if (html.length <= maxLength) {
    return html;
  }

  // 重要なセクションを優先的に保持
  const importantPatterns = [
    /<head[^>]*>([\s\S]*?)<\/head>/i,
    /<meta[^>]*og:[^>]*>/gi,
    /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi,
    /<(title|name|role|company|skill|interest)[^>]*>([\s\S]*?)<\/\1>/gi
  ];

  let extractedContent = '';
  for (const pattern of importantPatterns) {
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

function buildDiagnosisPrompt(html1, html2) {
  // HTMLを構造を保持しながらサイズ制限
  const trimmedHtml1 = trimHtmlSafely(html1, 50000);
  const trimmedHtml2 = trimHtmlSafely(html2, 50000);
  
  return `
あなたはCloudNative Days Tokyo 2025の相性診断AIです。
以下の手順で2つのPrairie CardのHTMLから相性診断を実施してください。

【処理手順】
1. 情報抽出フェーズ
   各HTMLから以下の情報を探して抽出してください：
   - 名前（og:title, title, h1タグなど）
   - 職業・役職（title, role, 職業関連のキーワード）
   - 所属組織（company, 会社, organization）
   - 技術スキル（skill, 技術名, プログラミング言語）
   - 興味・関心（interest, 好き, 興味がある）
   - 自己紹介文（bio, description, about）
   - コミュニティ活動（community, 活動, 参加）
   ※見つからない項目は「不明」として処理続行

2. 分析フェーズ
   以下の観点で相性を分析：
   - 技術スタックの重複度（0-40点）
     * 同じ技術: +10点
     * 関連技術: +5点（例: KubernetesとDocker）
   - 興味分野の一致度（0-30点）
     * 完全一致: +10点
     * 部分一致: +5点
   - コミュニティの関連性（0-20点）
   - 補完性（0-10点）
     * 異なるが補完的なスキル: +5点

3. 診断結果生成フェーズ
   スコアに基づいて相性タイプを決定：
   - 90-100: "Perfect Pod Pair型"（完璧な相性）
   - 75-89: "Service Mesh型"（強い連携）  
   - 60-74: "Sidecar Container型"（良い補完関係）
   - 40-59: "Different Namespace型"（接点を見つけよう）
   - 0-39: "Cross Cluster型"（新しい発見の機会）

【判断基準】
- CloudNative/Kubernetes関連の要素を重視
- 技術的な共通点を最重視
- 異なる分野でも補完関係があれば評価
- ネガティブな表現は避け、ポジティブに表現

【出力フォーマット】
必ず以下のJSON形式で返答してください：
{
  "extracted_profiles": {
    "person1": {
      "name": "抽出した名前",
      "title": "役職（不明の場合は空文字）",
      "company": "所属（不明の場合は空文字）",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "30文字以内の人物要約"
    },
    "person2": {
      "name": "抽出した名前",
      "title": "役職（不明の場合は空文字）",
      "company": "所属（不明の場合は空文字）",
      "skills": ["スキル1", "スキル2"],
      "interests": ["興味1", "興味2"],
      "summary": "30文字以内の人物要約"
    }
  },
  "analysis": {
    "common_skills": ["共通スキル1", "共通スキル2"],
    "common_interests": ["共通の興味1"],
    "complementary_points": ["補完ポイント1"],
    "score_breakdown": {
      "technical": 35,
      "interests": 25,
      "community": 15,
      "complementary": 10,
      "total": 85
    }
  },
  "diagnosis": {
    "type": "Service Mesh型",
    "score": 85,
    "message": "2人の技術スタックは見事に連携し、CloudNativeの世界で素晴らしいシナジーを生み出します！",
    "conversationStarters": [
      "Kubernetesのオートスケーリング戦略について意見交換してみては？",
      "お互いのCI/CDパイプラインの工夫を共有してみましょう",
      "次のCNCFプロジェクトで協力できそうですね"
    ],
    "hiddenGems": "実は2人ともGo言語での開発経験があり、マイクロサービス設計の話で盛り上がりそう！",
    "shareTag": "#CNDxCnD で最高のService Meshペアを発見！"
  }
}

【Prairie Card HTML 1】
${trimmedHtml1}

【Prairie Card HTML 2】
${trimmedHtml2}
`;
}

// ID生成関数
function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// プロファイル作成関数
function createProfile(extractedProfile) {
  return {
    basic: {
      name: extractedProfile.name || '名前未設定',
      title: extractedProfile.title || '',
      company: extractedProfile.company || '',
      bio: extractedProfile.summary || ''
    },
    details: {
      skills: extractedProfile.skills || [],
      interests: extractedProfile.interests || [],
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
  };
}