# イベント運用ガイド - CloudNative Days Winter 2025

## 🎯 運用方針

**イベント中は不具合を即座に検知して対応することを最優先とする**

⚠️ **重要**: PR #169以降、フォールバック診断機能は完全に無効化されています。  
OpenRouterまたはOpenAI APIが必須となり、APIキー未設定時はエラーが発生します。  
🌏 **地域制限対策**: OpenRouterを使用することで香港リージョン等の地域制限を回避できます。

## 📚 関連ドキュメント

- [環境変数設定ガイド](./ENVIRONMENT_VARIABLES.md) - すべての環境変数の詳細
- [プロジェクトステータス](./PROJECT_STATUS_2025-09-01_FINAL.md)

## 📋 イベント前の準備

### 1. 環境変数の設定（Cloudflare Dashboard）

```bash
# 必須設定（どちらか一方または両方）
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # 推奨：地域制限回避
# OPENAI_API_KEY=sk-xxxxx          # オプション：後方互換性

# AI Gateway設定（OpenRouterと併用推奨）
CLOUDFLARE_ACCOUNT_ID=xxxxx       # AI GatewayアカウントID
CLOUDFLARE_GATEWAY_ID=xxxxx       # AI Gateway ID

# 基本設定
NODE_ENV=production               # 本番環境フラグ

# イベント時の推奨設定
DEBUG_MODE=false                  # 本番環境ではデバッグログ無効
# ※フォールバック診断はPR #169で完全無効化済み
```

### 2. APIキーの確認

```bash
# Cloudflare Dashboardで確認
# 優先順位：
# 1. OPENROUTER_API_KEY（推奨）
# 2. OPENAI_API_KEY（後方互換性）

# OpenRouter使用時の確認事項
# - sk-or-v1-で始まることを確認
# - OpenRouterダッシュボードでクレジット残高確認

# フォールバック診断は利用不可（PR #169で無効化）
```

## 🚨 エラー発生時の対応

### パターン1：APIエラー

**症状**
- 診断ボタンクリック後にエラー
- コンソール：`API error: 401 Unauthorized`または`403 Forbidden`

**対応手順**
1. Cloudflare DashboardでAPIキーを確認
   - `OPENROUTER_API_KEY`が設定されているか
   - `sk-or-v1-`で始まっているか
   - 代替として`OPENAI_API_KEY`が設定されているか
2. OpenRouter/OpenAI Dashboardで利用状況を確認
   - 利用制限に達していないか
   - APIキーが有効か
   - クレジット残高があるか
3. 必要に応じて新しいAPIキーを発行・設定
4. 403エラーの場合は地域制限の可能性も確認

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

## 🔄 緊急時の対応

**フォールバック診断は利用できません**

### OpenAI API障害時の対応
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
- [ ] APIキーの確認（OpenRouter優先、OpenAI代替）
- [ ] AI Gateway設定の確認（任意但推奨）
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
- [ ] APIの残高確認（OpenRouterまたはOpenAI）
- [ ] APIキーの有効性確認
- [ ] OpenRouter使用時は`sk-or-v1-`プレフィックス確認
- [ ] 本番環境でのテスト完了
- [ ] `ENABLE_FALLBACK=false`設定確認（またはデフォルト）

### イベント当日
- [ ] Cloudflare Dashboardにアクセス可能
- [ ] OpenRouter DashboardまたはOpenAI Dashboardにアクセス可能
- [ ] エラー対応手順の確認
- [ ] ログ監視画面の準備

### イベント後
- [ ] エラーログの分析
- [ ] 改善点の洗い出し
- [ ] ドキュメント更新

## 🔧 トラブルシューティング

### よくある問題と対処法

#### 診断エラーが発生した場合
1. **Cloudflare Real-time logs** で詳細なエラーメッセージを確認
2. **環境変数の設定** が正しいか確認
   - `OPENROUTER_API_KEY`（優先）
   - `OPENAI_API_KEY`（代替）
   - `CLOUDFLARE_ACCOUNT_ID`と`CLOUDFLARE_GATEWAY_ID`（AI Gateway使用時）
3. **ファイル構造** に重複がないか確認
4. 必要に応じて **デバッグログ** を有効化（`DEBUG_MODE=true`）
5. **地域制限エラー（403）** の場合はOpenRouterへ切り替え

詳細は [診断エラー調査ログ](./2025-09-05-diagnosis-error-investigation.md) を参照

## 💡 Tips

- **エラーは悪いことではない**：即座に気づいて対応できることが重要
- **参加者への透明性**：問題が発生したら正直に伝える
- **準備が9割**：事前テストを徹底する
- **冷静な対応**：エラーが出ても慌てない
- **デバッグツール**：一時的なデバッグエンドポイントは強力だが、使用後は必ず削除

## 🌐 地域制限対策

### OpenRouter優先使用の背景
Cloudflare Pagesが香港（HKG）データセンターを使用する場合、OpenAI APIは403エラーを返します。OpenRouterを使用することでこの問題を完全に回避できます。

詳細は [OpenAI API 地域制限問題の解決方法](./OPENAI_REGION_RESTRICTION_FIX.md) を参照してください。

---

*最終更新: 2025-09-06*
*CloudNative Days Winter 2025 用*