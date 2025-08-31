/**
 * 診断エンジン用プロンプト定義
 * 
 * このファイルには診断AIのプロンプトテンプレートを集約
 * 保守性向上のため外部ファイルとして管理
 */

import { PrairieProfile } from '@/types';

/**
 * システムプロンプト
 * AIの基本的な役割とコンテキストを定義
 */
export const CND2_SYSTEM_PROMPT = `
あなたはCND²（CloudNative Days × Connect 'n' Discover）の診断システムです。
「出会いを二乗でスケール」するという理念のもと、
参加者同士の交流を楽しく促進する診断を行います。

診断結果は前向きで建設的な内容にし、技術的な共通点や補完関係を見つけてください。
相性スコアは常に85点以上とし、ポジティブな体験を提供してください。
`;

/**
 * Duo（2人）診断用プロンプト生成
 * @param profiles 2人のプロフィール
 * @returns 診断プロンプト
 */
export const buildDuoDiagnosisPrompt = (profiles: [PrairieProfile, PrairieProfile]): string => {
  return `
以下の2人のエンジニアの相性を診断してください。

エンジニア1:
- 名前: ${profiles[0].basic.name}
- 会社: ${profiles[0].basic.company}
- スキル: ${profiles[0].details.skills.join(', ')}
- 興味: ${profiles[0].details.interests.join(', ')}

エンジニア2:
- 名前: ${profiles[1].basic.name}
- 会社: ${profiles[1].basic.company}
- スキル: ${profiles[1].details.skills.join(', ')}
- 興味: ${profiles[1].details.interests.join(', ')}

両者の技術スタック、興味分野、経験を考慮して、コラボレーションの可能性を評価してください。
`;
};

/**
 * Group（3人以上）診断用プロンプト生成
 * @param profiles グループメンバーのプロフィール
 * @returns 診断プロンプト
 */
export const buildGroupDiagnosisPrompt = (profiles: PrairieProfile[]): string => {
  const memberList = profiles.map((p, i) => `
エンジニア${i + 1}:
- 名前: ${p.basic.name}
- 会社: ${p.basic.company}
- スキル: ${p.details.skills.join(', ')}
- 興味: ${p.details.interests.join(', ')}
`).join('\n');

  return `
以下の${profiles.length}人のエンジニアグループの相性を診断してください。

${memberList}

グループ全体のダイナミクスと、チームとしての強みを評価してください。
`;
};

/**
 * Fortune Telling（点取り占い）用追加プロンプト
 * @returns 占い用プロンプト
 */
export const buildFortuneTellingPrompt = (): string => {
  return `
追加で「点取り占い」として、以下の4つの運勢を100点満点で評価してください：
- overall: 総合運
- tech: 技術運
- collaboration: コラボ運
- growth: 成長運

各運勢は85点以上とし、前向きなメッセージを添えてください。
`;
};