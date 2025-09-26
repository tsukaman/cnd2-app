/**
 * プレイヤー名をサニタイズする
 * HTMLタグやスクリプトインジェクションを防ぐ
 */
export function sanitizePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // HTMLタグを削除
  let sanitized = name.replace(/<[^>]*>/g, '');
  
  // 危険な文字をエスケープ
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
  
  // 制御文字を削除
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // 長さ制限（20文字）
  sanitized = sanitized.slice(0, 20);
  
  // 前後の空白を削除
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * 部屋コードをサニタイズする
 */
export function sanitizeRoomCode(code) {
  if (!code || typeof code !== 'string') {
    return '';
  }
  
  // 大文字英数字のみ許可
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}