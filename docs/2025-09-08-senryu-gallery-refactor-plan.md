# 川柳ゲーム ギャラリー機能改修計画

## 📅 作成日: 2025-09-08

## 📝 概要

現在の川柳ゲームのランキング機能を廃止し、よりカジュアルで参加しやすい「作品ギャラリー」形式に改修する。
スコアによる序列化ではなく、「いいね」による評価システムに移行し、参加者が気軽に作品を共有・鑑賞できる環境を構築する。

## 🎯 改修の目的

1. **参加ハードルの低減**: ランキングによる競争要素を排除し、気軽に参加できる環境を作る
2. **創造性の促進**: 順位を気にせず、自由な発想で川柳を楽しめるようにする
3. **コミュニティ形成**: 「いいね」機能により、ポジティブな相互作用を促進
4. **プライバシー配慮**: 公開/非公開、実名/匿名を選択可能にし、多様な参加スタイルに対応

## 🔄 現状分析

### 現在の実装

#### データフロー
1. **ゲーム参加時**: `rankingPreference` (allowRanking, anonymousRanking) を設定
2. **ゲーム終了時**: スコア集計後、ランキングエントリーとして自動保存
3. **ランキング表示**: スコアと参加人数で重み付けしてソート表示

#### 関連ファイル
- `/functions/api/senryu/ranking.js`: ランキング取得・削除API
- `/functions/api/senryu/room/[id]/score.js`: ゲーム終了時のランキング保存処理
- `/src/app/senryu/ranking/page.tsx`: ランキング表示画面
- `/src/lib/senryu/types.ts`: 型定義

#### データ構造（現在）
```typescript
interface RankingEntry {
  id: string;
  senryu: Senryu;
  playerName: string;
  playerId: string;
  anonymousRanking: boolean;
  scores: {
    total: number;
    average: number;
    details: ScoreDetail[];
  };
  scorers: string[];
  playerCount: number;
  timestamp: string;
  roomId: string;
  roomCode: string;
  isPublic: boolean;
}
```

## 🚀 新設計

### 1. データ構造

#### GalleryEntry（新規）
```typescript
interface GalleryEntry {
  id: string;                    // エントリーID
  senryu: Senryu;                // 川柳本体
  authorName: string;             // 作者名（"詠み人知らず"または実名）
  authorId: string | null;        // 作者ID（匿名の場合null）
  isAnonymous: boolean;           // 匿名投稿フラグ
  likes: number;                  // いいね数
  likedBy: string[];             // いいねしたユーザーID/セッションID
  createdAt: string;              // 作成日時
  roomId: string;                 // 元のゲームルームID
  roomCode: string;               // 元のルームコード
  gameDate: string;               // ゲーム実施日
  playerCount: number;            // ゲーム参加人数（コンテキスト情報）
}
```

#### PublicationPreference（新規）
```typescript
interface PublicationPreference {
  shareToGallery: boolean;        // ギャラリーに公開するか
  displayName: 'real' | 'anonymous'; // 実名/匿名の選択
}
```

### 2. UI/UX設計

#### A. 作品ギャラリー画面（`/senryu/gallery`）
- **レイアウト**: Pinterest風のカード型グリッド表示
- **ソート**: 新着順 / いいね順 / ランダム
- **フィルター**: 期間 / 参加人数
- **インタラクション**: 
  - ハートアイコンでいいね（ゲストも可能）
  - 作品カードクリックで詳細表示
  - SNS共有ボタン

#### B. ゲーム終了後の公開設定画面
```typescript
interface PublicationSettingsProps {
  senryu: Senryu;
  playerName: string;
  onSubmit: (preference: PublicationPreference) => void;
}

// UI要素
- [ ] ギャラリーに作品を公開する
  └─ 公開する場合の表示名:
     ( ) 実名で投稿（山田太郎）
     ( ) 匿名で投稿（詠み人知らず）
```

#### C. いいね機能の実装
- **認証不要**: セッションIDベースで管理
- **重複防止**: 同一セッション/ユーザーは1作品1いいねまで
- **リアルタイム更新**: WebSocket/SSEで即座に反映
- **アニメーション**: ハートが飛ぶエフェクト

### 3. API設計

#### 新規エンドポイント

##### POST `/api/senryu/gallery/publish`
```typescript
// リクエスト
{
  roomId: string;
  playerId: string;
  preference: PublicationPreference;
}

// レスポンス
{
  entryId: string;
  success: boolean;
}
```

##### GET `/api/senryu/gallery/list`
```typescript
// クエリパラメータ
{
  sort?: 'latest' | 'popular' | 'random';
  filter?: {
    dateFrom?: string;
    dateTo?: string;
    playerCount?: [min: number, max: number];
  };
  offset?: number;
  limit?: number;
}

// レスポンス
{
  entries: GalleryEntry[];
  total: number;
  hasMore: boolean;
}
```

##### POST `/api/senryu/gallery/[id]/like`
```typescript
// リクエスト
{
  sessionId: string;  // クライアント生成のセッションID
}

// レスポンス
{
  likes: number;
  liked: boolean;
}
```

##### DELETE `/api/senryu/gallery/[id]/like`
```typescript
// いいね取り消し用（同様の構造）
```

### 4. データ移行戦略

#### Phase 1: 並行稼働（2週間）
- 既存のランキング機能を維持
- 新ギャラリー機能を追加実装
- 新規ゲームから公開設定を適用

#### Phase 2: 移行期間（1週間）
- 既存ランキングデータをギャラリー形式に変換
- anonymousRankingフラグを尊重して移行
- 過去のスコアは参考値として保持（表示はしない）

#### Phase 3: 完全移行
- ランキング関連コードを削除
- URLリダイレクト設定（`/senryu/ranking` → `/senryu/gallery`）
- ドキュメント更新

## 🔧 実装タスク

### フェーズ1: 基盤構築（3日）
- [ ] 新しい型定義の追加（`GalleryEntry`, `PublicationPreference`）
- [ ] KVストレージスキーマの設計
- [ ] Gallery APIエンドポイントの実装
- [ ] いいね機能のバックエンド実装

### フェーズ2: UI実装（4日）
- [ ] ギャラリー画面のコンポーネント作成
- [ ] 公開設定モーダルの実装
- [ ] いいねボタンとアニメーション
- [ ] フィルター・ソート機能

### フェーズ3: 統合とテスト（2日）
- [ ] ゲーム終了フローへの組み込み
- [ ] セッション管理の実装
- [ ] E2Eテストの作成
- [ ] パフォーマンステスト

### フェーズ4: 移行と最適化（2日）
- [ ] データ移行スクリプトの作成
- [ ] 既存データのマイグレーション
- [ ] ランキング機能の段階的無効化
- [ ] ドキュメント更新

## 🎨 デザイン仕様

### カラースキーム
- **背景**: グラデーション（blue-50 → white → orange-50）継続
- **カード**: 白背景 + orange-200ボーダー
- **いいねボタン**: 
  - 未選択: gray-400
  - 選択済み: red-500（アニメーション付き）

### レスポンシブ対応
- **デスクトップ**: 3-4列グリッド
- **タブレット**: 2列グリッド
- **モバイル**: 1列表示

### アニメーション
- **カード表示**: フェードイン + スライドアップ
- **いいね**: ハートが拡大→縮小 + 数字のカウントアップ
- **フィルター切替**: スムーズな並び替えアニメーション

## 🔒 セキュリティ考慮事項

1. **レート制限**: 1セッション/IPあたり1分間に10いいねまで
2. **XSS対策**: 全ユーザー入力のサニタイズ継続
3. **プライバシー**: 匿名投稿時はplayerIdを完全に秘匿
4. **不適切コンテンツ**: 管理者による削除機能を維持

## 📊 成功指標

1. **エンゲージメント**: ギャラリー公開率 > 60%
2. **インタラクション**: 平均いいね数 > 3
3. **リテンション**: 再訪問率の向上
4. **パフォーマンス**: ページロード時間 < 2秒

## 🚧 リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 既存ユーザーの混乱 | 中 | 移行期間中の丁寧な案内、両機能の並行稼働 |
| いいねのbot/スパム | 高 | レート制限、セッションベースの管理 |
| データ移行の失敗 | 高 | バックアップ取得、段階的移行、ロールバック計画 |
| パフォーマンス低下 | 中 | ページネーション、遅延読み込み、CDNキャッシュ |

## 📅 スケジュール

| 週 | タスク | 担当 |
|----|--------|------|
| Week 1 | フェーズ1: 基盤構築 | Backend |
| Week 2 | フェーズ2: UI実装 | Frontend |
| Week 3 | フェーズ3: 統合とテスト | Full Stack |
| Week 4 | フェーズ4: 移行と最適化 | DevOps |

## 📝 備考

- WebSocket移行と並行して進める場合は、リアルタイムいいね更新を優先実装
- CloudNative Days Winter 2025までに完成させる場合は、最小機能セットで先行リリースも検討
- ユーザーフィードバックを早期に収集し、イテレーティブに改善

---

*最終更新: 2025-09-08*
*作成者: Claude Code (Deep Think Mode)*