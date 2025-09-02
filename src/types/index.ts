/**
 * Fortune grade constants with Japanese meanings
 * 占い結果のグレード定数
 */
export const FORTUNE_GRADES = {
  DAIKICHI: 'daikichi' as const,  // 大吉 - Great blessing
  KICHI: 'kichi' as const,         // 吉 - Good fortune
  CHUKICHI: 'chukichi' as const,   // 中吉 - Middle fortune
  SHOKICHI: 'shokichi' as const,   // 小吉 - Small fortune
  SUEKICHI: 'suekichi' as const,   // 末吉 - Future fortune
  KYO: 'kyo' as const              // 凶 - Misfortune (rarely used)
} as const;

export type FortuneGrade = typeof FORTUNE_GRADES[keyof typeof FORTUNE_GRADES];

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DiagnosisApiResponse extends ApiResponse<{
  result: DiagnosisResult;
}> {
  // Extends ApiResponse with specific result structure
}

export interface PrairieApiResponse extends ApiResponse<PrairieProfile> {
  // Extends ApiResponse for Prairie profile data
}

export interface ResultApiResponse extends ApiResponse<{
  result: DiagnosisResult;
}> {
  // Extends ApiResponse for result retrieval
}

export interface PrairieProfile {
  basic: {
    name: string;
    title: string;
    company: string;
    bio: string;
    avatar?: string;
  };
  details: {
    tags: string[];
    skills: string[];
    interests: string[];
    certifications: string[];
    communities: string[];
    motto?: string;
  };
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    blog?: string;
    qiita?: string;
    zenn?: string;
  };
  custom: Record<string, unknown>;
  meta: {
    createdAt?: string;
    updatedAt?: string;
    connectedBy?: string;
    hashtag?: string;
    isPartialData?: boolean;
    sourceUrl?: string;
  };
}

export interface FortuneTelling {
  overall: number;
  tech: number;
  collaboration: number;
  growth: number;
  message: string;
}

// Analysis metadata for detailed diagnosis results
export interface AnalysisMetadata {
  astrologicalAnalysis?: string;
  techStackCompatibility?: string;
  participant1?: string;
  participant2?: string;
  profiles?: string;
  timestamp?: string;
  calculatedScore?: {
    technical?: number;
    communication?: number;
    values?: number;
    growth?: number;
  };
}

export interface DiagnosisResult {
  id: string;
  mode: 'duo' | 'group';
  type: string;
  compatibility: number;
  summary: string;
  strengths: string[];
  opportunities: string[];
  advice: string;
  participants: PrairieProfile[];
  createdAt: string;
  aiPowered?: boolean;
  fortuneTelling?: FortuneTelling;
  // V4 Astological style fields
  astrologicalAnalysis?: string;
  techStackCompatibility?: string;
  conversationTopics?: string[];
  // Legacy fields for backward compatibility
  score?: number;
  message?: string;
  conversationStarters?: string[];
  hiddenGems?: string;
  shareTag?: string;
  luckyItem?: string;
  luckyAction?: string;
  luckyProject?: string; // CNCFプロジェクト
  luckyProjectDescription?: string; // プロジェクトの説明
  modelUsed?: string; // 使用したAIモデル
  // Fortune telling elements (点取り占い)
  fortuneScore?: number; // 0-100点の運勢スコア
  fortuneGrade?: FortuneGrade; // 運勢グレード (大吉/吉/中吉/小吉/末吉/凶)
  fortuneMessage?: string; // 今日の運勢メッセージ
  luckyColor?: string; // ラッキーカラー
  luckyNumber?: number; // ラッキーナンバー
  techFortune?: string; // 技術運（例：「今日はバグが少ない日」）
  // V3 engine metadata
  metadata?: {
    engine?: string;
    model?: string;
    analysis?: AnalysisMetadata;
  };
}

export interface CND2State {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  result: DiagnosisResult | null;
}

export interface Participant {
  id: string;
  url: string;
  profile: PrairieProfile | null;
  status: 'empty' | 'loading' | 'loaded' | 'error';
}

export interface DiagnosisMode {
  type: 'duo' | 'group';
  title: string;
  description: string;
  icon: string;
  minParticipants: number;
  maxParticipants: number;
}

export interface AnimationConfig {
  duration: number;
  delay?: number;
  repeat?: number | 'infinite';
  ease?: string;
}

export interface ShareData {
  title: string;
  text: string;
  url: string;
  hashtags: string[];
}