import { CND2_CONFIG } from '@/config/cnd2.config';
import { PrairieProfile } from '@/types';

export const CND2_SYSTEM_PROMPT = `
あなたはCND²（CloudNative Days × Connect 'n' Discover）の診断システムです。
「出会いを二乗でスケール」するという理念のもと、
参加者同士の交流を楽しく促進する診断を行います。

診断の特徴：
- Cloud Native/Kubernetes用語を楽しく活用
- エンターテイメント性重視
- 技術的な共通点と人間的な共通点の両方を発見
- #CNDxCnD でシェアされやすい結果
- Prairie Cardの全情報を最大限活用

必ず「Scaling Together²」の精神を反映させてください。
`;

export function buildDuoDiagnosisPrompt(profiles: [PrairieProfile, PrairieProfile]): string {
  return `
タグライン: ${CND2_CONFIG.app.tagline}
ハッシュタグ: ${CND2_CONFIG.app.hashtag}

以下の2人の相性を診断してください：

=== 参加者1 ===
名前: ${profiles[0].basic.name}
役職: ${profiles[0].basic.title || '未設定'}
会社: ${profiles[0].basic.company || '未設定'}
自己紹介: ${profiles[0].basic.bio || '未設定'}
スキル: ${profiles[0].details.skills.join(', ') || 'なし'}
興味: ${profiles[0].details.interests.join(', ') || 'なし'}
コミュニティ: ${profiles[0].details.communities.join(', ') || 'なし'}
モットー: ${profiles[0].details.motto || '未設定'}

=== 参加者2 ===
名前: ${profiles[1].basic.name}
役職: ${profiles[1].basic.title || '未設定'}
会社: ${profiles[1].basic.company || '未設定'}
自己紹介: ${profiles[1].basic.bio || '未設定'}
スキル: ${profiles[1].details.skills.join(', ') || 'なし'}
興味: ${profiles[1].details.interests.join(', ') || 'なし'}
コミュニティ: ${profiles[1].details.communities.join(', ') || 'なし'}
モットー: ${profiles[1].details.motto || '未設定'}

診断結果は以下のJSON形式で返してください：
{
  "type": "Kubernetes用語を使った楽しい相性タイプ名（例：Perfect Pod Pair型、Service Mesh型など）",
  "score": 相性スコア（0-100の整数）,
  "message": "「Scaling Together²」を感じさせる診断メッセージ（200文字程度）",
  "conversationStarters": [
    "具体的な会話のきっかけ1",
    "具体的な会話のきっかけ2",
    "具体的な会話のきっかけ3"
  ],
  "hiddenGems": "Prairie Card情報から見つけた意外な共通点や面白い発見",
  "shareTag": "#CNDxCnD でシェアしたくなる一言メッセージ"
}
`;
}

export function buildGroupDiagnosisPrompt(profiles: PrairieProfile[]): string {
  const participantsInfo = profiles.map((profile, index) => `
=== 参加者${index + 1} ===
名前: ${profile.basic.name}
役職: ${profile.basic.title || '未設定'}
会社: ${profile.basic.company || '未設定'}
自己紹介: ${profile.basic.bio || '未設定'}
スキル: ${profile.details.skills.join(', ') || 'なし'}
興味: ${profile.details.interests.join(', ') || 'なし'}
コミュニティ: ${profile.details.communities.join(', ') || 'なし'}
`).join('\n');

  return `
タグライン: ${CND2_CONFIG.app.tagline}
ハッシュタグ: ${CND2_CONFIG.app.hashtag}

${profiles.length}人のグループ診断を行います。
${profiles.length}² = ${profiles.length * profiles.length}通りの相性を分析してください。

${participantsInfo}

診断結果は以下のJSON形式で返してください：
{
  "type": "Kubernetes Cluster型などグループの特徴を表す名前",
  "score": グループ全体の相性スコア（0-100の整数）,
  "message": "グループの「Scaling Together²」メッセージ（200文字程度）",
  "roles": {
    "参加者名1": "Control Plane役などの役割",
    "参加者名2": "Worker Node役などの役割"
  },
  "conversationStarters": [
    "グループ活動の提案1",
    "グループ活動の提案2",
    "グループ活動の提案3"
  ],
  "hiddenGems": "グループ全体の意外な共通点や発見",
  "shareTag": "#CNDxCnD でシェアしたくなるグループメッセージ"
}
`;
}