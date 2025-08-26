# Deployment Guide

このドキュメントでは、CND²アプリケーションのデプロイ方法について説明します。

## 📋 前提条件

- Node.js 20.0.0以上
- npm 10.0.0以上
- GitHub アカウント（CI/CD連携用）
- Cloudflare アカウント（推奨デプロイ先）

## 🚀 Cloudflare Pages（推奨）

### なぜCloudflare Pagesを推奨するのか

1. **商業イベント利用での無料枠**: CloudNative Days Winterは商業イベントであり、Vercelの利用規約では有料プランが必要
2. **エッジパフォーマンス**: グローバルなCDNネットワークによる高速配信
3. **Workers KV統合**: 診断結果の永続化に最適
4. **セキュリティ**: 標準でDDoS防御とWAF機能を提供
5. **コスト効率**: 無料枠が寛大で、商業利用でも問題なし

### セットアップ手順

#### 1. プロジェクトのビルド

```bash
# 依存関係のインストール
npm ci

# プロダクションビルド（静的エクスポート）
npm run build

# ビルド成功確認（outディレクトリが生成される）
ls -la out/
```

#### 2. Cloudflare Pagesの設定

**オプション A: Wrangler CLIを使用**

```bash
# Wrangler CLIのインストール（グローバル）
npm install -g wrangler

# Cloudflareにログイン
wrangler login

# デプロイ実行
wrangler pages deploy out --project-name=cnd2-app

# カスタムドメイン設定（オプション）
wrangler pages deployment create --branch=main
```

**オプション B: GitHub連携（推奨）**

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. "Pages" → "Create a project" → "Connect to Git"
3. GitHubリポジトリを選択
4. ビルド設定：
   ```yaml
   Build command: npm run build
   Build output directory: out
   Root directory: /
   Node version: 20.x
   ```

#### 3. 環境変数の設定

Cloudflare Dashboard → プロジェクト → Settings → Environment variables

```bash
# 必須環境変数
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://cnd2.cloudnativedays.jp

# Sentry設定（オプション）
SENTRY_DSN=https://xxxxx@o4508811871485952.ingest.us.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o4508811871485952.ingest.us.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxx
```

#### 4. Workers KV設定

```bash
# KV Namespaceの作成
wrangler kv:namespace create "CND2_RESULTS"
wrangler kv:namespace create "CND2_RESULTS" --preview

# wrangler.tomlに追加される設定を確認
cat wrangler.toml
```

`wrangler.toml`に以下を追加：
```toml
[[kv_namespaces]]
binding = "CND2_RESULTS"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

#### 5. カスタムドメイン設定

1. Cloudflare Dashboard → Pages → Custom domains
2. "Set up a custom domain"をクリック
3. `cnd2.cloudnativedays.jp`を入力
4. DNS設定を確認

```bash
# DNS設定例
cnd2.cloudnativedays.jp CNAME cnd2-app.pages.dev
```

### セキュリティ設定

`wrangler.toml`のヘッダー設定を確認：

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://my.prairie.cards https://*.sentry.io"
```

## 🔄 CI/CD パイプライン

### GitHub Actions設定

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
      
      - name: Deploy to Cloudflare Pages
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cnd2-app
          directory: out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### デプロイ前チェックリスト

- [ ] すべてのテストが成功している
- [ ] TypeScriptの型エラーがない
- [ ] ESLintエラーがない
- [ ] 環境変数が正しく設定されている
- [ ] ビルドが成功する
- [ ] バンドルサイズが適切（`npm run analyze`で確認）
- [ ] セキュリティヘッダーが設定されている
- [ ] CSP設定が適切
- [ ] Sentryが正しく設定されている
- [ ] KV Namespaceが作成されている

## 🔍 デプロイ後の確認

### ヘルスチェック

```bash
# アプリケーションの起動確認
curl https://cnd2.cloudnativedays.jp

# APIエンドポイントの確認
curl https://cnd2.cloudnativedays.jp/api/health

# セキュリティヘッダーの確認
curl -I https://cnd2.cloudnativedays.jp
```

### パフォーマンステスト

```bash
# Lighthouseでパフォーマンステスト
npx lighthouse https://cnd2.cloudnativedays.jp --view

# WebPageTestでの測定
# https://www.webpagetest.org/
```

### モニタリング確認

1. Sentryダッシュボードでエラーレポートを確認
2. Cloudflare Analyticsでトラフィックを確認
3. Workers KVの使用状況を確認

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### ビルドエラー

```bash
# キャッシュクリア
rm -rf .next out node_modules
npm ci
npm run build
```

#### 環境変数が読み込まれない

- Cloudflare Dashboardで環境変数を確認
- プレビューと本番で別々に設定が必要
- ビルド時とランタイムの変数の違いに注意

#### KV Namespace接続エラー

```bash
# バインディング確認
wrangler kv:namespace list

# 権限確認
wrangler whoami
```

#### CSPエラー

- ブラウザのコンソールでCSP違反を確認
- 必要に応じて`connect-src`や`script-src`を調整

## 📊 本番環境の監視

### メトリクス

- **可用性**: 99.9%以上を目標
- **レスポンスタイム**: P95で1秒以下
- **エラー率**: 1%未満
- **診断API成功率**: 95%以上

### アラート設定

Cloudflare Notificationsで以下を設定：

- Origin Error Rate > 5%
- Edge Error Rate > 5%
- 5xx Error Rate > 1%
- DDoS Attack Detection

## 🔄 ロールバック手順

問題が発生した場合のロールバック：

```bash
# Wrangler CLIでのロールバック
wrangler pages deployment list
wrangler pages deployment rollback --deployment-id=<previous-deployment-id>

# または、Cloudflare Dashboardから
# Pages → Deployments → Rollback
```

## 📚 参考資料

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Workers KV Documentation](https://developers.cloudflare.com/kv/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)