/**
 * 川柳ギャラリー用セッションID管理フック
 * いいね機能のセッション管理に使用
 */

import { useEffect, useState } from 'react';

const SESSION_KEY = 'senryu-gallery-session';

/**
 * セッションIDを生成・管理するフック
 * ブラウザごとに一意のIDを生成し、localStorage に保存
 */
export function useSenryuSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    // 既存のセッションIDを取得
    let storedId = localStorage.getItem(SESSION_KEY);
    
    // 存在しない場合は新規生成
    if (!storedId) {
      storedId = generateSessionId();
      localStorage.setItem(SESSION_KEY, storedId);
    }
    
    setSessionId(storedId);
  }, []);
  
  return sessionId;
}

/**
 * セッションIDを生成
 * 形式: sess_[timestamp]_[random]
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${random}`;
}