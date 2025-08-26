import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DiagnosisEngine } from '@/lib/diagnosis-engine';
import { PrairieProfile } from '@/types';
import { withApiMiddleware, validateRequestBody, createSuccessResponse } from '@/lib/api-middleware';
import { ApiError } from '@/lib/api-errors';
import { getServerConfig } from '@/lib/env';
import OpenAI from 'openai';

// Request validation schema
const diagnosisRequestSchema = z.object({
  profiles: z.array(z.any()).min(1).max(6),
  mode: z.enum(['duo', 'group']),
});

// Initialize OpenAI client (singleton)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const config = getServerConfig();
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Generate AI-powered diagnosis using OpenAI
 */
async function generateAIDiagnosis(
  profiles: PrairieProfile[],
  mode: 'duo' | 'group'
): Promise<{
  score: number;
  summary: string;
  details: string;
  advice: string;
}> {
  const config = getServerConfig();
  const openai = getOpenAIClient();

  // Prepare profile summaries for the prompt
  const profileSummaries = profiles.map((profile, index) => {
    const skills = profile.skills?.join(', ') || 'スキル情報なし';
    const interests = profile.interests?.join(', ') || '興味分野なし';
    const bio = profile.basic.bio || '自己紹介なし';
    
    return `
プロフィール${index + 1}:
- 名前: ${profile.basic.name}
- 役職: ${profile.basic.title || '不明'}
- 会社: ${profile.basic.company || '不明'}
- 自己紹介: ${bio}
- スキル: ${skills}
- 興味分野: ${interests}
    `.trim();
  }).join('\n\n');

  const systemPrompt = `あなたはCloudNative Daysのイベント参加者の相性を診断する専門家です。
参加者のプロフィール情報を基に、技術的な相性、コラボレーション可能性、学習機会などを分析し、
建設的で前向きなアドバイスを提供してください。

診断結果は以下の形式で出力してください：
- 相性スコア（0-100の整数）
- 簡潔な要約（1-2文）
- 詳細な分析（技術的な共通点、補完関係、コラボレーション可能性など）
- 実践的なアドバイス（具体的な次のステップ）`;

  const userPrompt = mode === 'duo' 
    ? `以下の2人のCloudNative Days参加者の相性を診断してください：\n\n${profileSummaries}`
    : `以下のグループのCloudNative Days参加者たちの相性を診断してください：\n\n${profileSummaries}`;

  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('OpenAI response is empty');
    }

    const result = JSON.parse(response);
    
    // Validate and normalize the response
    return {
      score: Math.max(0, Math.min(100, parseInt(result.score) || 70)),
      summary: result.summary || '相性診断を完了しました',
      details: result.details || '詳細な分析結果',
      advice: result.advice || '今後のコラボレーションに期待できます',
    };
  } catch (error) {
    console.error('[OpenAI] Error generating diagnosis:', error);
    
    // Fallback to rule-based engine if OpenAI fails
    const engine = DiagnosisEngine.getInstance();
    let fallbackResult;
    
    if (mode === 'duo' && profiles.length === 2) {
      fallbackResult = await engine.generateDuoDiagnosis(profiles as [PrairieProfile, PrairieProfile]);
    } else {
      fallbackResult = await engine.generateGroupDiagnosis(profiles);
    }
    
    return {
      score: fallbackResult.score,
      summary: fallbackResult.summary,
      details: fallbackResult.analysis.details.join('\n'),
      advice: fallbackResult.advice.join('\n'),
    };
  }
}

export const POST = withApiMiddleware(async (request: NextRequest) => {
  // Validate request body
  const { profiles, mode } = await validateRequestBody(request, diagnosisRequestSchema);
  
  // Additional validation for mode-specific requirements
  if (mode === 'duo' && profiles.length !== 2) {
    throw ApiError.validation('2人診断には2つのプロフィールが必要です');
  }

  if (mode === 'group' && (profiles.length < 3 || profiles.length > 6)) {
    throw ApiError.validation('グループ診断は3-6人で実施してください');
  }

  try {
    // Check if OpenAI is configured
    const config = getServerConfig();
    const useAI = config.openai.apiKey && config.openai.apiKey !== 'your-openai-api-key-here';
    
    let result;
    if (useAI) {
      // Use AI-powered diagnosis
      const aiResult = await generateAIDiagnosis(profiles, mode);
      
      // Structure the result to match expected format
      result = {
        id: crypto.randomUUID(),
        score: aiResult.score,
        summary: aiResult.summary,
        analysis: {
          strengths: [],
          opportunities: [],
          challenges: [],
          details: aiResult.details.split('\n').filter(Boolean),
        },
        advice: aiResult.advice.split('\n').filter(Boolean),
        createdAt: new Date().toISOString(),
      };
    } else {
      // Fall back to rule-based engine
      const engine = DiagnosisEngine.getInstance();
      
      if (mode === 'duo') {
        result = await engine.generateDuoDiagnosis(profiles as [PrairieProfile, PrairieProfile]);
      } else {
        result = await engine.generateGroupDiagnosis(profiles);
      }
    }
    
    return createSuccessResponse({
      result,
      aiPowered: useAI,
    });
  } catch (error) {
    console.error('[Diagnosis API] Error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Check for timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout('診断処理がタイムアウトしました');
    }
    
    throw ApiError.internal('診断の生成に失敗しました');
  }
});