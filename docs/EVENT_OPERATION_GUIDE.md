# イベント運用ガイド - CloudNative Days Winter 2025

## 🎯 運用方針

**イベント中は不具合を即座に検知して対応することを最優先とする**

フォールバック診断で誤魔化すより、エラーで止まって即座に気づく方が確実な対応が可能。

## 📚 関連ドキュメント

- [環境変数設定ガイド](./ENVIRONMENT_VARIABLES.md) - すべての環境変数の詳細
- [プロジェクトステータス](./PROJECT_STATUS_2025-09-01_FINAL.md)

## 📋 イベント前の準備

### 1. 環境変数の設定（Cloudflare Dashboard）

```bash
# 必須設定
OPENAI_API_KEY=sk-xxxxx      # 本物のAPIキー
NODE_ENV=production           # 本番環境フラグ

# イベント時の推奨設定
ENABLE_FALLBACK=false         # フォールバック無効（デフォルト）
# ※PR115マージ後はフォールバック機能自体が削除予定
```

### 2. フォールバック設定の確認

```typescript
// src/lib/constants/fallback.ts
export const FALLBACK_CONFIG = {
  ALLOW_IN_DEVELOPMENT: false,  // 開発環境：無効
  ALLOW_IN_PRODUCTION: false,   // 本番環境：無効（イベント時）
  ...
}
```

## 🚨 エラー発生時の対応

### パターン1：OpenAI APIエラー

**症状**
- 診断ボタンクリック後にエラー
- コンソール：`OpenAI API error: 401 Unauthorized`

**対応手順**
1. Cloudflare DashboardでAPIキーを確認
2. OpenAI Dashboardで利用状況を確認
   - 利用制限に達していないか
   - APIキーが有効か
3. 必要に応じて新しいAPIキーを発行・設定

### パターン2：Prairie Card読み込みエラー

**症状**
- Prairie Card URLを入力してもエラー
- Prairie Cardサービス自体がダウン

**対応手順**
1. Prairie Cardサービスの状態確認
2. 必要に応じて手動入力モードに切り替え（要開発）

### パターン3：診断処理タイムアウト

**症状**
- 診断が長時間完了しない
- ネットワークエラー

**対応手順**
1. Cloudflare Functionsのログ確認
2. OpenAI APIのステータス確認
3. ネットワーク状態の確認

## 🔄 緊急時のフォールバック有効化

**どうしてもサービスを止められない場合のみ**

### 方法1：環境変数で即座に切り替え
```bash
# Cloudflare Dashboard
ENABLE_FALLBACK=true  # フォールバック有効化
```

### 方法2：コード修正（最終手段）
```typescript
// src/lib/constants/fallback.ts
ALLOW_IN_PRODUCTION: true  // 一時的に変更
```

## 📊 運用フロー

### イベント開始前（1時間前）
- [ ] OpenAI APIキーの確認
- [ ] 環境変数の設定確認（[環境変数一覧](./ENVIRONMENT_VARIABLES.md)参照）
- [ ] 本番環境で診断テスト実行
- [ ] エラーが出ないことを確認
- [ ] Cloudflare Functionsのログ監視開始

### イベント中
- [ ] リアルタイムでエラーログ監視
- [ ] 参加者からのフィードバック収集
- [ ] エラー発生時は即座に対応

### エラー発生時
1. **エラー内容の確認**（30秒以内）
2. **原因の特定**（1分以内）
3. **対応方針の決定**（2分以内）
   - APIキー再設定で解決 → 実行
   - 解決困難 → フォールバック有効化
4. **参加者への案内**（必要に応じて）

## 🎯 優先順位

1. **エラーの即座検知** > フォールバックでの継続
2. **根本解決** > 一時的な回避策
3. **透明性** > 問題の隠蔽

## 📝 チェックリスト

### イベント前日
- [ ] OpenAI APIの残高確認
- [ ] APIキーの有効性確認
- [ ] 本番環境でのテスト完了
- [ ] `ENABLE_FALLBACK=false`設定確認（またはデフォルト）

### イベント当日
- [ ] Cloudflare Dashboardにアクセス可能
- [ ] OpenAI Dashboardにアクセス可能
- [ ] エラー対応手順の確認
- [ ] ログ監視画面の準備

### イベント後
- [ ] エラーログの分析
- [ ] 改善点の洗い出し
- [ ] ドキュメント更新

## 💡 Tips

- **エラーは悪いことではない**：即座に気づいて対応できることが重要
- **参加者への透明性**：問題が発生したら正直に伝える
- **準備が9割**：事前テストを徹底する
- **冷静な対応**：エラーが出ても慌てない

---

*最終更新: 2025-09-01*
*CloudNative Days Winter 2025 用*