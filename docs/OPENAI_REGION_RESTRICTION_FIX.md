# OpenAI API 地域制限問題の解決方法

## 問題の概要

Cloudflare WorkersがHong Kong（HKG）などの特定のColoから実行される際、OpenAI APIが地域制限により403エラーを返します。

**重要**: これはCloudflare AI Gatewayの既知の問題で、2025年9月現在も未解決です。

エラーメッセージ例：
```
Country, region, or territory not supported (Status: 403)
```

## 根本原因

- CloudflareはアジアのトラフィックをHong Kong (HKG)データセンター経由でルーティング
- OpenAIは香港からのアクセスをブロック
- Cloudflare AI Gatewayを使用しても、Gateway自体がHKG経由でOpenAIにアクセスするため解決しない
- Smart Placementを使用しても問題は解決しない

## 解決方法

### 方法1: OpenRouter を使用（最も推奨）

OpenRouterは地域制限を回避でき、Cloudflare AI Gatewayと完全に互換性があります。

#### セットアップ手順

1. **OpenRouterアカウント作成**
   - https://openrouter.ai でアカウント作成
   - APIキーを取得（`sk-or-v1-`で始まる）
   - クレジットを購入またはOpenAI APIキーをリンク

2. **環境変数を設定**
   ```bash
   # Cloudflare Pages設定で以下の環境変数を追加
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
   
   # オプション：AI Gatewayと組み合わせる場合
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_GATEWAY_ID=your-gateway-name
   ```

3. **デプロイ**
   - 環境変数保存後、自動的にデプロイされます

#### メリット
- **地域制限を完全に回避**
- OpenAI互換API
- 複数のAIモデルにアクセス可能
- Cloudflare AI Gatewayと組み合わせ可能
- 安定した接続

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

1. `OPENROUTER_API_KEY`が設定されている場合、OpenRouterを使用（地域制限を確実に回避）
   - AI Gatewayと組み合わせ可能（キャッシングと分析のメリット）
2. `CLOUDFLARE_ACCOUNT_ID`と`CLOUDFLARE_GATEWAY_ID`が設定されている場合、Cloudflare AI Gatewayを使用
   - 注意：HKG経由の場合、403エラーが発生する可能性あり
3. `OPENAI_PROXY_URL`が設定されている場合、カスタムプロキシを使用
4. どちらも設定されていない場合、OpenAI APIを直接呼び出し（地域制限の影響を受ける可能性あり）

## トラブルシューティング

### デバッグログの確認

Cloudflare Pages Functions のリアルタイムログで以下を確認：

```javascript
// 使用されているプロキシ方式
"Using OpenRouter via AI Gateway"
"Using OpenRouter directly"
"Using Cloudflare AI Gateway with OpenAI"
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