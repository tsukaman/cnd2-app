/**
 * 川柳ランダム生成機能
 * CNDW2025用
 */

import { KAMI_NO_KU, NAKA_NO_KU, SHIMO_NO_KU } from './senryu-data-large';
import { TECH_KEYWORDS, DAILY_KEYWORDS } from '@/lib/constants/senryu-keywords';

export interface Senryu {
  upper: string;   // 上の句（5文字）
  middle: string;  // 中の句（7文字）
  lower: string;   // 下の句（5-7文字）
  key?: string;    // ユニークキー
  category?: 'tech' | 'daily' | 'mixed';  // カテゴリ
}

/**
 * ランダムな川柳を1つ生成
 */
export function generateRandomSenryu(): Senryu {
  const upper = KAMI_NO_KU[Math.floor(Math.random() * KAMI_NO_KU.length)];
  const middle = NAKA_NO_KU[Math.floor(Math.random() * NAKA_NO_KU.length)];
  const lower = SHIMO_NO_KU[Math.floor(Math.random() * SHIMO_NO_KU.length)];

  const key = `${upper}-${middle}-${lower}`;
  const category = determineCategory(upper, middle, lower);

  return { upper, middle, lower, key, category };
}

/**
 * 複数の川柳を重複なしで生成
 */
export function generateUniqueSenryus(count: number): Senryu[] {
  const senryuMap = new Map<string, Senryu>();

  // 理論上の最大組み合わせ数をチェック
  const maxCombinations = KAMI_NO_KU.length * NAKA_NO_KU.length * SHIMO_NO_KU.length;
  if (count > maxCombinations) {
    console.warn(`Requested ${count} unique senryus, but only ${maxCombinations} combinations available`);
    count = Math.min(count, maxCombinations);
  }

  // 実用的な上限（10万個まで）
  if (count > 100000) {
    console.warn(`Limiting to 100000 senryus for performance reasons`);
    count = 100000;
  }

  let attempts = 0;
  const maxAttempts = count * 10; // 無限ループ防止

  while (senryuMap.size < count && attempts < maxAttempts) {
    const senryu = generateRandomSenryu();
    if (!senryuMap.has(senryu.key!)) {
      senryuMap.set(senryu.key!, senryu);
    }
    attempts++;
  }

  return Array.from(senryuMap.values());
}

/**
 * カテゴリを判定
 */
function determineCategory(upper: string, middle: string, lower: string): 'tech' | 'daily' | 'mixed' {
  const combinedText = (upper + middle + lower).toLowerCase();

  let techScore = 0;
  let dailyScore = 0;

  // インポートしたキーワードを使用
  for (const keyword of TECH_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      techScore++;
    }
  }

  for (const keyword of DAILY_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      dailyScore++;
    }
  }

  if (techScore > 0 && dailyScore > 0) {
    return 'mixed';
  } else if (techScore > 0) {
    return 'tech';
  } else if (dailyScore > 0) {
    return 'daily';
  } else {
    // デフォルトは技術系（最初の600個は主に技術系）
    const upperIndex = KAMI_NO_KU.indexOf(upper);
    const middleIndex = NAKA_NO_KU.indexOf(middle);
    const lowerIndex = SHIMO_NO_KU.indexOf(lower);

    const avgIndex = (upperIndex + middleIndex + lowerIndex) / 3;
    return avgIndex < 600 ? 'tech' : 'daily';
  }
}

/**
 * カテゴリ指定で川柳を生成
 */
export function generateSenryuByCategory(category: 'tech' | 'daily' | 'mixed'): Senryu {
  if (category === 'mixed') {
    // ミックスの場合は完全ランダム
    return generateRandomSenryu();
  }

  // カテゴリに応じてインデックス範囲を制限
  const techRange = { start: 0, end: 600 };
  const dailyRange = { start: 600, end: 1000 };

  const range = category === 'tech' ? techRange : dailyRange;

  const upperIndex = Math.floor(Math.random() * (range.end - range.start)) + range.start;
  const middleIndex = Math.floor(Math.random() * (range.end - range.start)) + range.start;
  const lowerIndex = Math.floor(Math.random() * (range.end - range.start)) + range.start;

  const upper = KAMI_NO_KU[upperIndex] || KAMI_NO_KU[0];
  const middle = NAKA_NO_KU[middleIndex] || NAKA_NO_KU[0];
  const lower = SHIMO_NO_KU[lowerIndex] || SHIMO_NO_KU[0];

  const key = `${upper}-${middle}-${lower}`;

  return { upper, middle, lower, key, category };
}

/**
 * 川柳リミックス（プレイヤー間で句を交換）
 */
export function remixSenryus(senryus: Senryu[]): Senryu[] {
  if (senryus.length < 2) return senryus;

  const uppers = senryus.map(s => s.upper);
  const middles = senryus.map(s => s.middle);
  const lowers = senryus.map(s => s.lower);

  // シャッフル
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledUppers = shuffleArray(uppers);
  const shuffledMiddles = shuffleArray(middles);
  const shuffledLowers = shuffleArray(lowers);

  return senryus.map((_, index) => {
    const upper = shuffledUppers[index];
    const middle = shuffledMiddles[index];
    const lower = shuffledLowers[index];
    const key = `${upper}-${middle}-${lower}`;
    const category = determineCategory(upper, middle, lower);

    return { upper, middle, lower, key, category };
  });
}

/**
 * 統計情報を取得
 */
export function getSenryuStats() {
  return {
    totalCombinations: KAMI_NO_KU.length * NAKA_NO_KU.length * SHIMO_NO_KU.length,
    upperCount: KAMI_NO_KU.length,
    middleCount: NAKA_NO_KU.length,
    lowerCount: SHIMO_NO_KU.length,
    techPercentage: 60,
    dailyPercentage: 40
  };
}