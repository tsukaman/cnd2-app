/**
 * 診断関連の型定義
 * 
 * Note: FortuneTelling と DiagnosisResult は index.ts から再エクスポート
 */

// index.ts から型をインポート
import type { FortuneTelling, DiagnosisResult } from './index';

// 型を再エクスポート
export type { FortuneTelling, DiagnosisResult };

// diagnosis.ts 固有の型定義
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

export interface AIResponse {
  type: string;
  compatibility: number;
  description: string;
  tips: string[];
  fortuneTelling?: FortuneTelling;
}