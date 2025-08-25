import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisEngine } from '@/lib/diagnosis-engine';
import { PrairieProfile } from '@/types';
import { withErrorHandler, validateRequestBody, withTimeout } from '@/lib/api-middleware';
import { ApiError, ApiErrorCode } from '@/lib/api-errors';
import { z } from 'zod';

// Prairie Profileのスキーマ
const prairieProfileSchema = z.object({
  basic: z.object({
    name: z.string(),
    title: z.string(),
    company: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
  }),
  details: z.object({
    tags: z.array(z.string()),
    skills: z.array(z.string()),
    interests: z.array(z.string()),
    certifications: z.array(z.string()),
    communities: z.array(z.string()),
    motto: z.string().optional(),
  }),
  social: z.object({
    twitter: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
    blog: z.string().optional(),
    qiita: z.string().optional(),
    zenn: z.string().optional(),
  }),
  custom: z.record(z.unknown()),
  meta: z.object({
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    connectedBy: z.string().optional(),
    hashtag: z.string().optional(),
  }),
});

// 診断リクエストのスキーマ
const diagnosisRequestSchema = z.object({
  profiles: z.array(prairieProfileSchema),
  mode: z.enum(['duo', 'group']),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // リクエストボディをバリデーション
  const { profiles, mode } = await validateRequestBody(request, diagnosisRequestSchema);
  
  // モードに応じたプロフィール数のバリデーション
  if (mode === 'duo' && profiles.length !== 2) {
    throw ApiError.validationError(
      '2人診断には2つのプロフィールが必要です',
      { receivedCount: profiles.length }
    );
  }

  if (mode === 'group' && (profiles.length < 3 || profiles.length > 6)) {
    throw ApiError.validationError(
      'グループ診断は3-6人で実施してください',
      { receivedCount: profiles.length }
    );
  }

  const engine = DiagnosisEngine.getInstance();
  
  // 診断実行（15秒タイムアウト）
  const result = await withTimeout(
    mode === 'duo'
      ? engine.generateDuoDiagnosis(profiles as [PrairieProfile, PrairieProfile])
      : engine.generateGroupDiagnosis(profiles),
    15000
  ).catch((error) => {
    // Check for ApiError timeout first
    if (error instanceof ApiError && error.code === ApiErrorCode.TIMEOUT_ERROR) {
      throw error; // Re-throw the timeout error as-is
    }
    throw ApiError.internalServerError('診断の生成に失敗しました');
  });
  
  return NextResponse.json({
    success: true,
    result,
  });
});