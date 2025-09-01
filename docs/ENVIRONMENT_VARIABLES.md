# 環境変数設定ガイド

## 📋 環境変数一覧

### 🔐 必須設定（本番環境）

| 変数名 | 説明 | 設定値例 | 設定場所 |
|--------|------|----------|----------|
| `OPENAI_API_KEY` | OpenAI APIキー | `sk-xxxxx` | Cloudflare Dashboard |
| `NODE_ENV` | 実行環境 | `production` | Cloudflare Dashboard |

### 🎛️ 動作制御（イベント運用）

| 変数名 | 説明 | 設定値 | デフォルト | 影響 |
|--------|------|--------|------------|------|
| `ENABLE_FALLBACK` | フォールバック診断の有効化 | `true` / `false` | 未設定（false扱い） | `true`の時のみフォールバック有効（PR115後は削除予定） |
| `DEBUG_MODE` | デバッグログの出力 | `true` / `false` | `false` | 詳細なログを出力 |
| `ENVIRONMENT` | 環境識別（NODE_ENVの代替） | `development` / `production` | `production` | フォールバック動作に影響 |
| `NEXT_PUBLIC_ENABLE_PRODUCTION_DEBUG` | 本番環境でのデバッグビュー有効化 | `true` / `false` | `false` | トークン分析デバッグビューの本番表示を許可 |

### 📊 診断エンジン設定

| 変数名 | 説明 | 設定値例 | デフォルト | 備考 |
|--------|------|----------|------------|------|
| `DIAGNOSIS_STYLE` | 診断スタイル | `creative` / `astrological` / `fortune` / `technical` | `creative` | 診断時に動的に設定 |
| `AI_MODEL` | 使用するAIモデル | `gpt-4o-mini` / `gpt-4o` | `gpt-4o-mini` | コスト影響あり |
| `MAX_RETRIES` | APIリトライ回数 | `3` | `3` | エラー時の再試行回数 |

### 🔍 ログ・監視設定

| 変数名 | 説明 | 設定値例 | デフォルト | 用途 |
|--------|------|----------|------------|------|
| `LOG_LEVEL` | ログレベル | `error` / `warn` / `info` / `debug` | `info` | 出力するログの詳細度 |
| `SENTRY_DSN` | Sentryエラー監視 | `https://xxx@sentry.io/xxx` | 未設定 | エラー監視（オプション） |
| `NEXT_PUBLIC_SENTRY_DSN` | クライアント側Sentry | 同上 | 未設定 | ブラウザエラー監視 |

### 🌐 アプリケーション設定

| 変数名 | 説明 | 設定値例 | デフォルト | 備考 |
|--------|------|----------|------------|------|
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | `https://cnd2.cloudnativedays.jp` | `https://cnd2-app.pages.dev` | 共有機能で使用 |
| `ALLOWED_ORIGINS` | CORS許可オリジン | `https://example.com,https://test.com` | `*`（開発のみ） | カンマ区切りで複数指定 |

### 🗄️ Cloudflare KV設定（自動バインド）

| 変数名 | 説明 | 設定方法 | 備考 |
|--------|------|----------|------|
| `DIAGNOSIS_KV` | 診断結果保存用KV | Cloudflare自動バインド | Pages設定で紐付け |
| `RATE_LIMIT_KV` | レート制限用KV | Cloudflare自動バインド | 将来実装予定 |

## 🔧 設定方法

### Cloudflare Dashboard での設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Pages** → **cnd2-app** を選択
3. **Settings** → **Environment variables** を選択
4. **Production** または **Preview** 環境を選択
5. **Add variable** で変数を追加

```
変数名: ENABLE_FALLBACK
値: false（デフォルト）または true（フォールバック有効時）
```

### ローカル開発環境での設定

`.env.local` ファイルを作成：

```bash
# .env.local（Gitには含めない）
OPENAI_API_KEY=sk-xxxxx
ENABLE_FALLBACK=false  # フォールバック無効（デフォルト）
DEBUG_MODE=true
NODE_ENV=development
```

## 📝 環境別の設定例

### 開発環境（ローカル）

```bash
# .env.local
OPENAI_API_KEY=sk-xxxxx-dev
NODE_ENV=development
ENABLE_FALLBACK=false    # フォールバック無効（エラー即座検知）
DEBUG_MODE=true          # デバッグ情報出力
LOG_LEVEL=debug          # 詳細ログ
```

### ステージング環境

```bash
# Cloudflare Dashboard (Preview)
OPENAI_API_KEY=sk-xxxxx-staging
NODE_ENV=production
ENABLE_FALLBACK=true     # フォールバック許可（ステージングのみ）
DEBUG_MODE=true          # デバッグ情報出力
LOG_LEVEL=info
```

### 本番環境（通常運用）

```bash
# Cloudflare Dashboard (Production)
OPENAI_API_KEY=sk-xxxxx-prod
NODE_ENV=production
ENABLE_FALLBACK=false    # フォールバック無効（イベント時推奨）
DEBUG_MODE=false         # デバッグ情報OFF
LOG_LEVEL=warn           # 警告以上のみ
```

### 本番環境（イベント時）

```bash
# Cloudflare Dashboard (Production)
OPENAI_API_KEY=sk-xxxxx-prod
NODE_ENV=production
ENABLE_FALLBACK=false    # フォールバック無効（エラー即座検知）
DEBUG_MODE=false         # デバッグ情報OFF
LOG_LEVEL=info          # 詳細ログ記録
SENTRY_DSN=https://xxx  # エラー監視有効
```

## 🎯 イベント運用時の推奨設定

### CloudNative Days Winter 2025

**イベント前日までに設定：**

```bash
# 必須設定
OPENAI_API_KEY=sk-xxxxx-prod
NODE_ENV=production

# 動作制御
ENABLE_FALLBACK=false    # フォールバック無効（デフォルト）
DEBUG_MODE=false         # 本番ではOFF
LOG_LEVEL=info          # 適度な詳細度

# オプション
SENTRY_DSN=https://xxx  # エラー監視（推奨）
NEXT_PUBLIC_APP_URL=https://cnd2.cloudnativedays.jp
```

## 🚨 緊急時の変更手順

### 1. エラー発生時（フォールバックを有効化）

```bash
# Cloudflare Dashboard で即座に変更
ENABLE_FALLBACK=true    # フォールバック有効化
```

### 2. 問題調査時（デバッグ情報を出力）

```bash
# Cloudflare Dashboard で変更
DEBUG_MODE=true
LOG_LEVEL=debug
```

### 3. APIキー更新時

```bash
# Cloudflare Dashboard で変更
OPENAI_API_KEY=sk-xxxxx-new
```

## 📊 変数の優先順位

コード内での参照優先順位：

1. **環境変数**（最優先）
2. **設定ファイル**（`fallback.ts` など）
3. **デフォルト値**

```typescript
// 例：フォールバック制御
if (process.env.ENABLE_FALLBACK === 'true') {
  return true;   // 環境変数が最優先
}
if (FALLBACK_CONFIG.ALLOW_IN_PRODUCTION) {
  return true;   // 設定ファイル
}
return false;    // デフォルト
```

## 🔍 動作確認方法

### 1. 環境変数が正しく設定されているか確認

```typescript
// Cloudflare Functions内
console.log('ENABLE_FALLBACK:', env.ENABLE_FALLBACK);
console.log('OPENAI_API_KEY exists:', !!env.OPENAI_API_KEY);
```

### 2. Cloudflare Dashboardでログ確認

1. **Pages** → **Functions** → **Real-time logs**
2. ログストリームで環境変数の値を確認

### 3. テスト診断の実行

1. 本番環境で診断を実行
2. エラーが適切に表示されることを確認
3. フォールバックが動作しないことを確認

## 💡 ベストプラクティス

### DO ✅

- **イベント前日**に全変数を設定・確認
- **本番投入前**にステージング環境でテスト
- **APIキー**は定期的に更新
- **ログレベル**は状況に応じて調整
- **変更履歴**を記録

### DON'T ❌

- コード内にAPIキーをハードコード
- 本番環境で`DEBUG_MODE=true`を常時ON
- 環境変数の変更を文書化せずに実施
- イベント中に未検証の変数を追加

## 🛠️ 開発者向け情報

### 環境判定ヘルパー関数

環境判定を一元化するため、`/src/lib/utils/environment.ts`を使用：

```typescript
import { isDevelopment, isProduction, getEnvBoolean } from '@/lib/utils/environment';

// 開発環境チェック
if (isDevelopment()) {
  // 開発環境専用の処理
}

// 環境変数を型安全に取得
const fallbackEnabled = getEnvBoolean('ENABLE_FALLBACK', false);
```

### Cloudflare Functions共通設定

Cloudflare Functions環境では `/functions/utils/fallback-config.js`を使用：

```javascript
import { isFallbackAllowed, generateFallbackScore } from '../utils/fallback-config.js';

// フォールバック判定
if (!isFallbackAllowed(env)) {
  throw new Error('Fallback is disabled');
}
```

## 📚 関連ドキュメント

- [イベント運用ガイド](./EVENT_OPERATION_GUIDE.md)
- [フォールバック設定](../src/lib/constants/fallback.ts)
- [環境判定ユーティリティ](../src/lib/utils/environment.ts)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

*最終更新: 2025-09-01*
*CloudNative Days Winter 2025 対応版*