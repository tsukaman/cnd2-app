# Cloudflare Pages セットアップガイド

このドキュメントでは、CND²アプリケーションをCloudflare Pagesにデプロイする手順を説明します。

## 📋 前提条件

- Cloudflareアカウント
- GitHubリポジトリへのアクセス権限
- OpenAI APIキー

## 🚀 手動デプロイ手順

### 1. Wrangler CLIでログイン

```bash
# デプロイスクリプトを実行
./deploy-to-cloudflare.sh
```

このスクリプトは以下を実行します：
- Wrangler CLIのインストール確認
- Cloudflareへのログイン
- プロジェクトのビルド
- Cloudflare Pagesへのデプロイ

### 2. Cloudflare Dashboardでの設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Pages** セクションに移動
3. **cnd2-app** プロジェクトを選択

### 3. 環境変数の設定

プロジェクト設定 → 環境変数で以下を設定：

```bash
# 必須
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://cnd2.cloudnativedays.jp

# オプション（Sentry監視用）
SENTRY_DSN=https://xxxxx@o4508811871485952.ingest.us.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o4508811871485952.ingest.us.sentry.io/xxxxx
```

### 4. Workers KV Namespaceの作成

```bash
# KV Namespaceを作成
wrangler kv:namespace create "CND2_RESULTS"

# 出力されたIDをメモしておく
# 例: id = "xxxxxxxxxxxxxxxxxxxxx"
```

### 5. wrangler.tomlの更新

```toml
[[kv_namespaces]]
binding = "CND2_RESULTS"
id = "上記でメモしたID"
```

### 6. カスタムドメインの設定

1. Cloudflare Pages → Custom domains
2. "Set up a custom domain"をクリック
3. `cnd2.cloudnativedays.jp`を入力
4. DNS設定を確認

## 🔄 GitHub Actions経由での自動デプロイ

### 1. GitHub Secretsの設定

リポジトリ → Settings → Secrets and variablesで以下を追加：

- `CLOUDFLARE_API_TOKEN`: [APIトークンを作成](https://dash.cloudflare.com/profile/api-tokens)
  - 権限: Cloudflare Pages:Edit
- `CLOUDFLARE_ACCOUNT_ID`: アカウントIDを取得
- `OPENAI_API_KEY`: OpenAI APIキー
- `SENTRY_DSN`: Sentry DSN（オプション）
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry Public DSN（オプション）

### 2. 自動デプロイの確認

mainブランチにpushすると自動的にデプロイが実行されます：

```bash
git push origin main
```

GitHub Actions → Deploy to Cloudflare Pagesでステータスを確認

## 🔍 デプロイ後の確認

### ヘルスチェック

```bash
# アプリケーションの起動確認
curl https://cnd2.cloudnativedays.jp

# APIエンドポイントの確認
curl https://cnd2.cloudnativedays.jp/api/health
```

### Cloudflare Analyticsで確認

1. Cloudflare Dashboard → Pages → cnd2-app
2. Analytics タブで以下を確認：
   - リクエスト数
   - 帯域幅使用量
   - エラー率
   - レスポンスタイム

## 🚨 トラブルシューティング

### ビルドエラーの場合

```bash
# ローカルでビルドを確認
npm run build

# ESLintエラーの場合は修正
npm run lint:fix
```

### デプロイ失敗の場合

1. Cloudflare Pages → Deploymentsで詳細を確認
2. ログを確認して原因を特定
3. 必要に応じてロールバック

### KV接続エラーの場合

```bash
# KV Namespaceの確認
wrangler kv:namespace list

# バインディングの確認
cat wrangler.toml | grep CND2_RESULTS
```

## 📊 モニタリング

### Cloudflare通知設定

1. Notifications → Create
2. 以下のアラートを設定：
   - Origin Error Rate > 5%
   - 5xx Error Rate > 1%
   - DDoS Attack Detection

### パフォーマンス目標

- 可用性: 99.9%以上
- レスポンスタイム: P95で1秒以下
- エラー率: 1%未満

## 🔗 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Workers KV Documentation](https://developers.cloudflare.com/kv/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)