# 川柳ゲーム WebSocket実装 - イベント準備計画

*作成日: 2025-09-27*
*CloudNative Days Winter 2025 対応*

## 📋 概要

SSEからWebSocketへの移行が完了し、Claude Review評価 5.0/5.0を獲得しました。
本ドキュメントは、イベント本番に向けた準備作業の詳細計画です。

## 🎯 目標

1. **本番環境での安定稼働**を確保
2. **運用スタッフが迷わない**ドキュメント整備
3. **障害発生時の迅速な対応**を可能にする
4. **将来的な拡張性**を確保

## 📅 実施スケジュール

### Phase 1: 本番環境検証（即時対応）
**期限**: 2025-09-28
**目的**: WebSocket実装が本番環境で正しく動作することを確認

#### 1.1 デプロイ状況確認
- [ ] Cloudflare Pages のビルド成功確認
- [ ] 環境変数の設定確認
- [ ] KV Namespace のバインディング確認

#### 1.2 WebSocket疎通テスト
- [ ] `/senryu/room-ws` エンドポイントの応答確認
- [ ] WebSocket接続の確立確認
- [ ] Ping/Pong機構の動作確認
- [ ] 自動再接続機能の検証

#### 1.3 ゲームフロー検証
- [ ] ルーム作成機能
- [ ] プレイヤー参加機能
- [ ] ゲーム進行（発表→採点→次へ）
- [ ] 結果表示機能

#### 1.4 監視設定
- [ ] Cloudflare Analytics設定
- [ ] エラーログ監視（Wrangler tail）
- [ ] アラート設定

### Phase 2: 運用ドキュメント整備（イベント前必須）
**期限**: 2025-09-30
**目的**: イベントスタッフが迷わず運用できるドキュメントを提供

#### 2.1 イベント運用手順書
- [ ] セットアップ手順
- [ ] ゲーム開始から終了までのフロー
- [ ] 管理者操作ガイド
- [ ] 参加者向け案内文例

#### 2.2 トラブルシューティングガイド
- [ ] よくあるエラーと対処法
- [ ] 接続問題の診断フロー
- [ ] データリカバリー手順
- [ ] 緊急時の連絡先

#### 2.3 技術リファレンス
- [ ] WebSocketメッセージ仕様
- [ ] APIエンドポイント一覧
- [ ] 環境変数設定ガイド
- [ ] ログ確認方法

### Phase 3: Durable Objects実装（安定性向上）
**期限**: 2025-10-05
**目的**: in-memoryストレージからDurable Objectsへ移行し、堅牢性を向上

#### 3.1 設計フェーズ
- [ ] 現在のin-memory実装の分析
- [ ] Durable Objectsアーキテクチャ設計
- [ ] マイグレーション計画策定

#### 3.2 実装フェーズ
- [ ] SenryuRoomクラスの実装
- [ ] WebSocketハンドラーの移行
- [ ] ステート管理の実装
- [ ] wrangler.toml設定

#### 3.3 検証フェーズ
- [ ] ユニットテスト作成
- [ ] 統合テスト実施
- [ ] 段階的ロールアウト計画

### Phase 4: テストカバレッジ改善（品質向上）
**期限**: 2025-10-10
**目的**: WebSocket実装の品質と信頼性を向上

#### 4.1 ユニットテスト
- [ ] WebSocketClientクラスのテスト
- [ ] メッセージハンドラーのテスト
- [ ] エラーハンドリングのテスト

#### 4.2 React Hooksテスト
- [ ] useSenryuWebSocketのテスト
- [ ] 接続・切断シナリオ
- [ ] 状態管理のテスト

#### 4.3 E2Eテスト
- [ ] ゲーム全体フローのテスト
- [ ] 複数プレイヤーシナリオ
- [ ] エラーリカバリーテスト

## 🔧 技術スタック

- **フロントエンド**: Next.js 15.5.2, React, TypeScript
- **バックエンド**: Cloudflare Workers, Pages Functions
- **WebSocket**: Native WebSocket API
- **ストレージ**: Cloudflare KV (現在), Durable Objects (予定)
- **デプロイ**: Cloudflare Pages

## 📊 成功指標

1. **接続成功率**: 99%以上
2. **自動再接続成功率**: 95%以上
3. **レスポンスタイム**: < 100ms
4. **同時接続数**: 500以上対応
5. **エラー率**: < 1%

## ⚠️ リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| WebSocket接続失敗 | 高 | 低 | 自動再接続、フォールバック |
| スケールの問題 | 高 | 中 | Durable Objects実装 |
| ネットワーク断絶 | 中 | 低 | 状態の永続化、リカバリー機能 |
| ブラウザ互換性 | 低 | 低 | Polyfill、エラーハンドリング |

## 📝 参考資料

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
- [川柳ゲーム仕様書](./SENRYU_GAME_SPEC.md)

## 🚀 次のステップ

1. 本番環境での動作確認を即座に開始
2. 運用ドキュメントの作成を並行して進める
3. Durable Objects実装の設計を開始
4. テスト計画の詳細化

---

*最終更新: 2025-09-27*