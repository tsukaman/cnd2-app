/**
 * CloudNative川柳カードゲーム - カードデータ（1000×1000×1000）
 * 10億通りの組み合わせを生成可能
 * CNDW2025用に拡張版
 */

// Import the expanded data
import { KAMI_NO_KU, NAKA_NO_KU, SHIMO_NO_KU } from './senryu-data-large.js';

// Convert to the format expected by the game API
// Add id, category and type fields for compatibility
function convertToCards(phrases, type, prefix) {
  return phrases.map((text, index) => {
    // Determine category based on content
    const category = determineCategory(text, type);
    return {
      id: `${prefix}${String(index + 1).padStart(3, '0')}`,
      text: text,
      category: category,
      type: type
    };
  });
}

// Category detection logic
function determineCategory(text, type) {
  const techKeywords = ['k8s', 'pod', 'docker', 'git', 'deploy', 'build', 'test', 'ci', 'cd',
    'yaml', 'json', 'api', 'db', 'sql', 'nosql', 'cloud', 'aws', 'gcp', 'azure',
    'server', 'client', 'frontend', 'backend', 'node', 'react', 'vue', 'angular',
    'コンテナ', 'ポッド', 'クラスタ', 'ノード', 'デプロイ', 'ビルド'];
  const timeKeywords = ['朝', '昼', '夜', '今日', '明日', '週末', '月曜', '金曜'];
  const emotionKeywords = ['嬉し', '楽し', '辛', '疲れ', '笑', '泣', '怒', '喜'];

  const lowerText = text.toLowerCase();

  if (type === 'upper') {
    if (techKeywords.some(k => lowerText.includes(k))) return 'cloudnative';
    if (timeKeywords.some(k => text.includes(k))) return 'daily';
    if (emotionKeywords.some(k => text.includes(k))) return 'emotion';
    return 'action';
  } else if (type === 'middle') {
    if (timeKeywords.some(k => text.includes(k))) return 'temporal';
    if (text.includes('いっぱい') || text.includes('全部') || text.includes('満載')) return 'quantity';
    if (text.includes('して') || text.includes('した')) return 'action';
    return 'state';
  } else {
    if (text.includes('成功') || text.includes('失敗') || text.includes('完了')) return 'result';
    if (emotionKeywords.some(k => text.includes(k))) return 'emotion';
    if (text.includes('ご飯') || text.includes('コーヒー') || text.includes('ビール')) return 'daily';
    return 'humor';
  }
}

// Export the converted cards
export const UPPER_CARDS = convertToCards(KAMI_NO_KU, 'upper', 'u');
export const MIDDLE_CARDS = convertToCards(NAKA_NO_KU, 'middle', 'm');
export const LOWER_CARDS = convertToCards(SHIMO_NO_KU, 'lower', 'l');