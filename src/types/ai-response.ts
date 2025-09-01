/**
 * AI診断レスポンスの型定義
 */

/**
 * 診断スコアの詳細
 */
export interface CalculatedScore {
  technical: number;
  communication: number;
  values: number;
  growth: number;
}

/**
 * 診断メタデータ
 */
export interface DiagnosisMetadata {
  participant1: string;
  participant2: string;
  calculatedScore: CalculatedScore;
}

/**
 * 診断データ
 */
export interface DiagnosisData {
  type: string;
  score: number;
  message: string;
  conversationStarters?: string[];
  hiddenGems?: string;
  shareTag?: string;
  luckyItem?: string;
  luckyAction?: string;
  luckyProject?: string;
  strengths?: string[];
  opportunities?: string[];
  metadata?: DiagnosisMetadata;
}

/**
 * 抽出されたプロフィール情報
 */
export interface ExtractedProfile {
  name: string;
  title?: string;
  company?: string;
  skills?: string[];
  interests?: string[];
  summary?: string;
}

/**
 * 抽出されたプロフィール群
 */
export interface ExtractedProfiles {
  person1: ExtractedProfile;
  person2: ExtractedProfile;
}

/**
 * 分析データ
 */
export interface AnalysisData {
  astrologicalAnalysis?: string;
  techStackCompatibility?: string;
}

/**
 * AI診断レスポンス全体
 */
export interface AIResponse {
  diagnosis: DiagnosisData;
  extracted_profiles: ExtractedProfiles;
  analysis: AnalysisData;
}

/**
 * 運勢情報
 */
export interface FortuneTellingData {
  overall: number;
  tech: number;
  collaboration: number;
  growth: number;
  message: string;
}

/**
 * 統合エンジンのAIレスポンス
 */
export interface UnifiedAIResponse {
  type: string;
  compatibility: number;
  summary: string;
  astrologicalAnalysis?: string;
  techStackCompatibility?: string;
  conversationTopics?: string[];
  conversationStarters?: string[];
  strengths?: string[];
  opportunities?: string[];
  advice?: string;
  luckyItem?: string;
  luckyAction?: string;
  luckyProject?: string;
  fortuneTelling?: FortuneTellingData;
}