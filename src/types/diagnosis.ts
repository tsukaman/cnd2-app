/**
 * 診断関連の型定義
 */

export interface DiagnosisParticipant {
  name: string;
  prairieUrl?: string;
  prairieData?: {
    name?: string;
    bio?: string;
    interests?: string[];
    skills?: string[];
    company?: string;
    role?: string;
    twitter?: string;
    github?: string;
    tags?: string[];
  };
}

export interface DiagnosisResult {
  id: string;
  mode: 'duo' | 'group';
  type: string;
  compatibility: number;
  description: string;
  tips: string[];
  hashtag: string;
  participants: DiagnosisParticipant[];
  metadata: {
    createdAt: string;
    expiresAt: string;
    version: string;
  };
}

export interface AIResponse {
  type: string;
  compatibility: number;
  description: string;
  tips: string[];
}