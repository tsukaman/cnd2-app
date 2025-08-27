# Cloudflare Pages セットアップガイド

## 開発環境（現在稼働中）

### アクセスURL
- メインURL: https://cnd2-app.pages.dev
- ブランチプレビュー: https://[commit-hash].cnd2-app.pages.dev

### 環境変数設定

1. Cloudflare Dashboard → Pages → cnd2-app → Settings → Environment variables

必要な環境変数：
```
OPENAI_API_KEY=sk-xxxxx  # OpenAI APIキー（必須）
```

### KV Namespace設定

1. Workers & Pages → KV → Create namespace
2. 名前: `cnd2-diagnosis-kv`
3. Pages → cnd2-app → Settings → Functions → KV namespace bindings
4. Variable name: `DIAGNOSIS_KV` → Select KV namespace

### デプロイ方法

```bash
# 自動デプロイスクリプト
./deploy-to-cloudflare.sh

# または手動デプロイ
npm run build
wrangler pages deploy out --project-name=cnd2-app
```

## 本番環境（将来の設定）

### カスタムドメイン設定（開発完了後）

1. **DNS設定**
   - Pages → cnd2-app → Custom domains → Add custom domain
   - Domain: `cnd2.cloudnativedays.jp`
   - CNAMEレコードが自動追加される

2. **SSL証明書**
   - Cloudflareが自動的にSSL証明書を発行・管理
   - Universal SSLが自動適用

3. **環境変数の本番設定**
   ```
   NEXT_PUBLIC_APP_URL=https://cnd2.cloudnativedays.jp
   NODE_ENV=production
   ```

### セキュリティ設定

#### WAF（Web Application Firewall）
- Security → WAF → Create rule
- 基本的な攻撃パターンを自動ブロック

#### レート制限
- Security → Rate limiting
- `/api/*` エンドポイントに対して設定済み

#### DDoS保護
- Cloudflareのデフォルト設定で自動保護

### パフォーマンス設定

#### キャッシュ設定
- Caching → Configuration
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours

#### 画像最適化
- Speed → Optimization → Images
- Polish: Lossy
- WebP: On

#### Minification
- Speed → Optimization → Auto Minify
- JavaScript: On
- CSS: On
- HTML: On

### モニタリング

#### Analytics
- Analytics → Web Analytics
- 自動的に有効（追加設定不要）

#### エラートラッキング
- Sentry統合（オプション）
- 環境変数: `NEXT_PUBLIC_SENTRY_DSN`

### バックアップとリカバリ

#### デプロイロールバック
- Pages → cnd2-app → Deployments
- 任意のデプロイメントを選択 → Rollback

#### KVデータバックアップ
```bash
# KVデータのエクスポート
wrangler kv:key list --namespace-id=xxx > backup.json

# KVデータのインポート
wrangler kv:bulk put backup.json --namespace-id=xxx
```

## トラブルシューティング

### よくある問題

1. **503 Service Unavailable**
   - 原因: ビルド設定の問題
   - 解決: `output: 'export'` in next.config.ts

2. **API呼び出しが404**
   - 原因: Functions未設定
   - 解決: functions/ディレクトリを確認

3. **KVストレージエラー**
   - 原因: バインディング未設定
   - 解決: KV namespace bindingsを確認

### デバッグ方法

```bash
# ローカルでCloudflare環境をエミュレート
wrangler pages dev out

# ログを確認
wrangler tail --project-name=cnd2-app

# KVの中身を確認
wrangler kv:key list --namespace-id=xxx
```

## サポート

- Cloudflare Community: https://community.cloudflare.com/
- Cloudflare Status: https://www.cloudflarestatus.com/
- GitHub Issues: https://github.com/yourusername/cnd2-app/issues