/**
 * Lucky Project Parser Utility
 * CNCFプロジェクト情報の解析用ユーティリティ
 */

/**
 * Lucky Projectの文字列を解析して名前と説明に分離
 * @param luckyProject - "プロジェクト名 - 説明" または "プロジェクト名" 形式の文字列
 * @returns プロジェクト名と説明のオブジェクト
 */
export function parseLuckyProject(luckyProject: string | undefined): {
  name: string;
  description: string;
} {
  if (!luckyProject) {
    return { name: '', description: '' };
  }

  // " - " で分割（ハイフンの前後にスペースがある場合）
  if (luckyProject.includes(' - ')) {
    const [name, ...descParts] = luckyProject.split(' - ');
    return {
      name: name.trim(),
      description: descParts.join(' - ').trim()
    };
  }

  // ":" で分割（コロン区切りの場合）
  if (luckyProject.includes(':')) {
    const [name, ...descParts] = luckyProject.split(':');
    return {
      name: name.trim(),
      description: descParts.join(':').trim()
    };
  }

  // 区切り文字がない場合は全体を名前として扱う
  return { 
    name: luckyProject.trim(), 
    description: '' 
  };
}

/**
 * プロジェクト名から絵文字を抽出
 * @param projectName - プロジェクト名（絵文字付きの可能性あり）
 * @returns 名前と絵文字を分離したオブジェクト
 */
export function extractProjectEmoji(projectName: string): {
  name: string;
  emoji: string;
} {
  // 絵文字パターン（Unicode絵文字の範囲）
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = projectName.match(emojiRegex);
  
  if (emojis && emojis.length > 0) {
    // 絵文字を除去した名前
    const nameWithoutEmoji = projectName.replace(emojiRegex, '').trim();
    return {
      name: nameWithoutEmoji,
      emoji: emojis.join('')
    };
  }

  return {
    name: projectName,
    emoji: ''
  };
}