# OpenAI API 地域制限問題の解決方法

## 問題の概要

Cloudflare WorkersがHong Kong（HKG）などの特定のColoから実行される際、OpenAI APIが地域制限により403エラーを返すことがあります。

エラーメッセージ例：
```
Country, region, or territory not supported (Status: 403)
```

## 解決方法

### 方法1: Cloudflare AI Gateway を使用（推奨）

Cloudflare AI Gatewayは、OpenAI APIへのプロキシとして機能し、地域制限を回避できます。

#### セットアップ手順

1. **Cloudflare Dashboardにログイン**
   - https://dash.cloudflare.com/

2. **AI Gatewayを作成**
   - AI → AI Gateway → Create Gateway
   - Gateway名を設定（例: `cnd2-openai-gateway`）

3. **環境変数を設定**
   ```bash
   # Cloudflare Pages設定で以下の環境変数を追加
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_GATEWAY_ID=cnd2-openai-gateway
   ```

4. **デプロイ**
   - 変更は自動的に反映されます

#### メリット
- 地域制限の回避
- レスポンスのキャッシング
- レート制限の管理
- 使用量の分析
- コスト削減

### 方法2: カスタムプロキシエンドポイント

独自のプロキシサーバーを設定する場合：

1. **プロキシサーバーを設定**
   - 日本またはアメリカのサーバーを使用
   - OpenAI APIへのリクエストを中継

2. **環境変数を設定**
   ```bash
   OPENAI_PROXY_URL=https://your-proxy.example.com/api/openai
   ```

### 方法3: Cloudflare Workers Smart Placement

`wrangler.toml`に以下を追加：

```toml
[placement]
mode = "smart"
```

これにより、Cloudflare Workersは最適なロケーションでリクエストを処理しようとしますが、完全な制御はできません。

## 実装の詳細

`functions/utils/openai-proxy.js`がプロキシロジックを処理：

1. `CLOUDFLARE_ACCOUNT_ID`と`CLOUDFLARE_GATEWAY_ID`が設定されている場合、Cloudflare AI Gatewayを使用
2. `OPENAI_PROXY_URL`が設定されている場合、カスタムプロキシを使用
3. どちらも設定されていない場合、OpenAI APIを直接呼び出し（地域制限の影響を受ける可能性あり）

## トラブルシューティング

### デバッグログの確認

Cloudflare Pages Functions のリアルタイムログで以下を確認：

```javascript
// 使用されているプロキシ方式
"Using Cloudflare AI Gateway"
"Using custom proxy"
"Using direct OpenAI API"

// 地域制限エラー
"Region restriction detected"
```

### よくある問題

1. **403エラーが継続する場合**
   - 環境変数が正しく設定されているか確認
   - Cloudflare AI Gatewayが有効になっているか確認

2. **タイムアウトエラー**
   - プロキシサーバーのレスポンス時間を確認
   - タイムアウト設定を延長

## 参考リンク

- [Cloudflare AI Gateway Documentation](https://developers.cloudflare.com/ai-gateway/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

---

*最終更新: 2025-09-05*