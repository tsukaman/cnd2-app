import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PrairieProfile, DiagnosisResult } from '@/types';
import { logger } from '@/lib/logger';

// Constants for diagnosis generation
const COMPATIBILITY_RANGE = {
  MIN: 70,
  MAX: 100,
  RANDOM_SPREAD: 30 // Generates 70-100%
} as const;

const AI_CONFIG = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 800
} as const;

// Rate limiting configuration
const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: 10  // 10 requests per minute per IP
} as const;

// Simple in-memory rate limiter (for Edge Runtime compatibility)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT.WINDOW_MS);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT.WINDOW_MS 
    });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Extended profile interface for backward compatibility
interface ExtendedPrairieProfile extends PrairieProfile {
  // Legacy fields that might exist in the data
  interests?: string[];
  skills?: string[];
  tags?: string[];
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Generate AI-powered diagnosis using OpenAI
async function generateAIDiagnosis(
  profiles: PrairieProfile[],
  mode: 'duo' | 'group'
): Promise<DiagnosisResult> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const profileSummaries = profiles.map(p => {
    const extended = p as ExtendedPrairieProfile;
    return {
      name: p.basic.name,
      title: p.basic.title,
      company: p.basic.company,
      bio: p.basic.bio,
      interests: extended.interests?.join(', ') || p.details?.interests?.join(', ') || '',
      skills: extended.skills?.join(', ') || p.details?.skills?.join(', ') || '',
      tags: extended.tags?.join(' ') || p.details?.tags?.join(' ') || '',
    };
  });

  const prompt = `あなたはCloudNative Days Tokyoのイベントで使用される相性診断システムです。
以下のエンジニアプロフィールを分析して、クラウドネイティブ技術の文脈で相性診断を行ってください。

プロフィール:
${profileSummaries.map((p, i) => `
${i + 1}人目: ${p.name}
役職: ${p.title || '未設定'}
会社: ${p.company || '未設定'}
Bio: ${p.bio || '未設定'}
興味分野: ${p.interests || '未設定'}
スキル: ${p.skills || '未設定'}
タグ: ${p.tags || '未設定'}
`).join('\n')}

以下の形式でJSON形式で回答してください:
{
  "type": "診断タイプ名（例: クラウドネイティブ・イノベーター）",
  "compatibility": 相性スコア（70-100の数値）,
  "summary": "診断結果のサマリー（100文字程度）",
  "strengths": ["強み1", "強み2", "強み3"],
  "opportunities": ["機会1", "機会2", "機会3"],
  "advice": "アドバイス（100文字程度）"
}

回答は必ず有効なJSONフォーマットで、日本語で記述してください。`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'あなたはクラウドネイティブ技術に精通した相性診断AIです。技術的な観点から建設的なアドバイスを提供します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: AI_CONFIG.MODEL,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      response_format: { type: 'json_object' },
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      id: generateId(),
      mode,
      type: aiResult.type || 'クラウドネイティブ・パートナー',
      compatibility: Math.min(
        COMPATIBILITY_RANGE.MAX, 
        Math.max(COMPATIBILITY_RANGE.MIN, aiResult.compatibility || 85)
      ),
      summary: aiResult.summary || `${profiles[0].basic.name}さんと${profiles[1]?.basic.name || 'チーム'}は、クラウドネイティブ技術への情熱を共有する素晴らしいパートナーです。`,
      strengths: aiResult.strengths || [
        '技術的な興味の共通点が多い',
        '学習意欲が高い組み合わせ',
        'イノベーションを推進する相性',
      ],
      opportunities: aiResult.opportunities || [
        '一緒にOSSプロジェクトに貢献',
        '技術ブログの共同執筆',
        'ハッカソンでのチーム参加',
      ],
      advice: aiResult.advice || 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
      participants: profiles,
      createdAt: new Date().toISOString(),
      aiPowered: true,
    };
  } catch (error) {
    logger.error('[AI Diagnosis] Error:', error);
    // Fallback to simple diagnosis if AI fails
    return generateSimpleDiagnosis(profiles, mode);
  }
}

// Generate simple diagnosis without AI
function generateSimpleDiagnosis(
  profiles: PrairieProfile[],
  mode: 'duo' | 'group'
): DiagnosisResult {
  const compatibility = Math.floor(
    Math.random() * COMPATIBILITY_RANGE.RANDOM_SPREAD
  ) + COMPATIBILITY_RANGE.MIN;
  
  return {
    id: generateId(),
    mode,
    type: 'クラウドネイティブ・パートナー',
    compatibility,
    summary: `${profiles[0].basic.name}さんと${profiles[1]?.basic.name || 'チーム'}は、クラウドネイティブ技術への情熱を共有する素晴らしいパートナーです。`,
    strengths: [
      '技術的な興味の共通点が多い',
      '学習意欲が高い組み合わせ',
      'イノベーションを推進する相性',
    ],
    opportunities: [
      '一緒にOSSプロジェクトに貢献',
      '技術ブログの共同執筆',
      'ハッカソンでのチーム参加',
    ],
    advice: 'お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。',
    participants: profiles,
    createdAt: new Date().toISOString(),
    aiPowered: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { status: 429 }
      );
    }
    
    const { profiles, mode } = await request.json();
    
    if (!profiles || !Array.isArray(profiles) || profiles.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least 2 profiles are required' 
        },
        { status: 400 }
      );
    }
    
    // Generate diagnosis (AI-powered if API key is available)
    let result: DiagnosisResult;
    let aiPowered = false;
    
    if (process.env.OPENAI_API_KEY) {
      try {
        result = await generateAIDiagnosis(profiles, mode);
        aiPowered = true;
      } catch (aiError) {
        logger.warn('[Diagnosis API] AI generation failed, falling back to simple:', aiError);
        result = generateSimpleDiagnosis(profiles, mode);
      }
    } else {
      logger.info('[Diagnosis API] OpenAI API key not configured, using simple diagnosis');
      result = generateSimpleDiagnosis(profiles, mode);
    }
    
    // Store in KV if available (for production)
    // Note: In Cloudflare Pages Functions, KV bindings are accessed differently
    // This will be properly configured during deployment
    if (process.env.KV_NAMESPACE) {
      try {
        // For Cloudflare Pages Functions, KV is accessed through the context
        // This is a placeholder that will work with the actual runtime binding
        logger.info(`[Diagnosis API] Storing result ${result.id} in KV`);
        
        // In production, this will be:
        // await context.env.DIAGNOSIS_KV.put(
        //   `diagnosis:${result.id}`,
        //   JSON.stringify(result),
        //   { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
        // );
      } catch (kvError) {
        logger.warn('[Diagnosis API] KV storage failed:', kvError);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        result,
        aiPowered,
      },
    });
  } catch (error) {
    logger.error('[Diagnosis API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate diagnosis' 
      },
      { status: 500 }
    );
  }
}