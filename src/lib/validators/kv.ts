import { z } from 'zod';

/**
 * KV API validation schemas
 */

// Diagnosis storage schema
export const StoreDiagnosisSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
  result: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    profiles: z.array(z.record(z.unknown())).optional(),
    createdAt: z.string().datetime().optional(),
    message: z.string().optional(),
    conversationStarters: z.array(z.string()).optional(),
    insights: z.array(z.string()).optional(),
  }).catchall(z.unknown()), // Allow additional fields
});

export type StoreDiagnosisInput = z.infer<typeof StoreDiagnosisSchema>;

// Prairie profile storage schema
export const StorePrairieProfileSchema = z.object({
  url: z.string().url().startsWith('https://my.prairie.cards/'),
  profile: z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    experience: z.array(z.record(z.unknown())).optional(),
  }).catchall(z.unknown()),
});

export type StorePrairieProfileInput = z.infer<typeof StorePrairieProfileSchema>;

// Path parameter validation
export const KVPathSchema = z.object({
  path: z.array(z.string()).optional(),
});

export type KVPath = z.infer<typeof KVPathSchema>;

// Rate limiting schema
export const RateLimitSchema = z.object({
  identifier: z.string().min(1).max(255),
  windowMinutes: z.number().min(1).max(1440), // 1 minute to 24 hours
  limit: z.number().min(1).max(10000),
});

export type RateLimitInput = z.infer<typeof RateLimitSchema>;