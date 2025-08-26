import { z } from 'zod';

export const DiagnosisRequestSchema = z.object({
  mode: z.enum(['duo', 'group']),
  participants: z.array(z.object({
    name: z.string().min(1).max(100),
    prairieUrl: z.string().url().optional(),
    prairieData: z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      interests: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
      company: z.string().optional(),
      role: z.string().optional(),
      twitter: z.string().optional(),
      github: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }).optional(),
  })).min(1).max(10),
  options: z.object({
    language: z.enum(['ja', 'en']).default('ja'),
    detail: z.enum(['simple', 'detailed']).default('simple'),
  }).optional(),
});

export type DiagnosisRequest = z.infer<typeof DiagnosisRequestSchema>;

export function validateDiagnosisRequest(data: unknown): DiagnosisRequest {
  return DiagnosisRequestSchema.parse(data);
}