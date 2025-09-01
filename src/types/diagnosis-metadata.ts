/**
 * 診断結果のメタデータ型定義
 */

export interface DiagnosisCalculatedScore {
  technical?: number;
  communication?: number;
  values?: number;
  growth?: number;
}

export interface DiagnosisMetadata {
  calculatedScore?: DiagnosisCalculatedScore;
  participant1?: string;
  participant2?: string;
  analysis?: {
    astrologicalAnalysis?: string;
    techStackCompatibility?: string;
  };
  // フォールバック診断用
  isFallback?: boolean;
  fallbackReason?: string;
}

// トークン推定用の定数
export const TOKEN_ESTIMATION = {
  CHARS_PER_TOKEN: 4, // 1トークンあたりの平均文字数（経験則）
  JAPANESE_CHARS_PER_TOKEN: 2, // 日本語の場合の平均文字数
} as const;

/**
 * 文字列からトークン数を推定
 * @param text - 推定対象のテキスト
 * @param isJapanese - 日本語テキストかどうか
 * @returns 推定トークン数
 */
export function estimateTokens(text: string | undefined, isJapanese = false): number {
  if (!text) return 0;
  const charsPerToken = isJapanese 
    ? TOKEN_ESTIMATION.JAPANESE_CHARS_PER_TOKEN 
    : TOKEN_ESTIMATION.CHARS_PER_TOKEN;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * フィールドごとのトークン推定値
 */
export const FIELD_TOKEN_ESTIMATES = {
  astrologicalAnalysis: { min: 100, max: 150, description: '占星術的分析' },
  techStackCompatibility: { min: 100, max: 150, description: '技術スタック互換性' },
  extracted_profiles: { min: 200, max: 300, description: '抽出されたプロフィール' },
  calculatedScore: { min: 50, max: 50, description: '詳細スコア' },
  shareTag: { min: 10, max: 10, description: '共有タグ（固定値）' },
  participant_names: { min: 20, max: 20, description: '参加者名（重複）' },
} as const;

/**
 * 削減可能なトークン数の合計を計算
 */
export function calculateTotalSavings(): { min: number; max: number } {
  const values = Object.values(FIELD_TOKEN_ESTIMATES);
  return {
    min: values.reduce((sum, field) => sum + field.min, 0),
    max: values.reduce((sum, field) => sum + field.max, 0),
  };
}