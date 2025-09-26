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

export type DiagnosisApiResponse = ApiResponse<{
  result: DiagnosisResult;
}>;

export type XProfileApiResponse = ApiResponse<XProfile>;

export type ResultApiResponse = ApiResponse<{
  result: DiagnosisResult;
}>;

// X (Twitter) Profile structure
export interface XProfile {
  basic: {
    id?: string;
    username: string;       // @なしのユーザー名
    name: string;           // 表示名
    bio: string;            // 自己紹介
    location?: string;
    website?: string;
    avatar?: string;        // プロフィール画像URL
    banner?: string;        // ヘッダー画像URL
    verified?: boolean;
    protected?: boolean;    // 非公開アカウント
    createdAt?: string;     // アカウント作成日
  };
  metrics: {
    followers: number;
    following: number;
    tweets: number;
    listed?: number;
  };
  details: {
    recentTweets: Array<{
      id: string;
      text: string;
      createdAt: string;
      metrics?: {
        likes: number;
        retweets: number;
        replies: number;
      };
    }>;
    topics: string[];         // 投稿から抽出した技術トピック
    hashtags: string[];       // 使用頻度の高いハッシュタグ
    mentionedUsers: string[]; // よくメンションするユーザー
    languages?: string[];     // 検出された言語
    activeHours?: number[];   // アクティブな時間帯
  };
  analysis?: {
    techStack: string[];      // 推定される技術スタック
    interests: string[];      // 興味のある分野
    personality?: string;     // コミュニケーションスタイル
  };
  metadata?: {
    fetchedAt: string;
    cacheAge: number;
    embedAvailable: boolean;
    scrapingAvailable: boolean;
  };
}

// Legacy Prairie Profile type for backward compatibility during migration
export interface PrairieProfile extends XProfile {
  // Maps old Prairie structure to new X structure
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    blog?: string;
    qiita?: string;
    zenn?: string;
  };
  custom?: Record<string, unknown>;
  meta?: {
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
  // 新しい占術的分析フィールド
  fiveElementsAnalysis?: string;
  astrologicalAnalysis?: string;
  numerologyAnalysis?: string;
  energyFieldAnalysis?: string;
  technicalSynergy?: string;
  // 既存フィールド（下位互換性）
  techStackCompatibility?: string;
  participant1?: string;
  participant2?: string;
  profiles?: string;
  timestamp?: string;
  calculatedScore?: {
    // 新しい占術的スコアフィールド
    fiveElements?: number;
    astrology?: number;
    numerology?: number;
    energy?: number;
    finalScore?: number;
    // 既存フィールド（下位互換性）
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
  participants: XProfile[];
  createdAt: string;
  aiPowered?: boolean;
  fortuneTelling?: FortuneTelling;
  // V4 Fortune telling style fields - 占術的分析フィールド
  fiveElementsAnalysis?: string;  // 五行思想分析
  astrologicalAnalysis?: string;  // 占星術分析
  numerologyAnalysis?: string;  // 数秘術分析
  energyFieldAnalysis?: string;  // エネルギーフィールド分析
  technicalSynergy?: string;  // 技術的シナジー分析
  techStackCompatibility?: string;  // 技術スタック相性（technicalSynergyの別名）
  fortuneAnalysis?: string;  // 多様な占術を統合した分析
  conversationTopics?: string[];
  // Legacy fields for backward compatibility
  score?: number;
  message?: string;
  conversationStarters?: string[];
  hiddenGems?: string;
  luckyItem?: string;
  luckyAction?: string;
  luckyProject?: string; // CNCFプロジェクト
  luckyProjectDescription?: string; // プロジェクトの説明
  luckyProjectUrl?: string; // プロジェクトのURL
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
  username: string;  // URLからusernameに変更
  profile: XProfile | null;
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