# Claude Code 開発ガイドライン

## 🚨 最重要ルール

**絶対に main ブランチへの直接プッシュは禁止**

すべての変更は必ず Pull Request 経由で行ってください。これにより：
- コードレビューが実行される
- CI/CDパイプラインが適切に動作する
- 変更履歴が追跡可能になる

## 📋 開発ワークフロー

### 1. 新機能・修正の開始

```bash
# 必ず feature ブランチを作成
git checkout -b feature/機能名

# または修正の場合
git checkout -b fix/修正内容

# またはドキュメント更新の場合
git checkout -b docs/更新内容
```

### 2. 開発作業

```bash
# コードを編集

# テストを実行（76テスト）
npm test

# リントを実行
npm run lint

# 型チェック（strict mode）
npm run type-check

# ビルド確認
npm run build
```

### 3. コミット

```bash
# 変更をステージング
git add .

# コミット（セマンティックコミットメッセージを使用）
git commit -m "feat: 新機能の追加"
# または
git commit -m "fix: バグの修正"
# または
git commit -m "docs: ドキュメント更新"
```

### 4. Pull Request の作成

```bash
# ブランチをプッシュ
git push origin feature/機能名

# GitHub CLIを使用してPRを作成
gh pr create --title "feat: 新機能の追加" --body "変更内容の説明"
```

### 5. レビューとマージ

- Claude Code Review が自動的に実行されます
- すべてのCIチェック（Build, Test, Lint, Type Check）が通過することを確認
- レビューが完了したらマージします

```bash
# PRをマージ（squash and merge推奨）
gh pr merge --squash
```

## 🏗️ プロジェクト構造

```
cnd2-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # APIルート（Edge Runtime）
│   │   │   ├── diagnosis/      # AI診断API（OpenAI GPT-4o-mini）
│   │   │   ├── prairie/        # Prairie Card解析API
│   │   │   └── results/        # 結果取得API（共有機能用）
│   │   ├── duo/
│   │   │   ├── page.tsx        # 2人診断ページ（単一診断フロー）
│   │   │   └── results/        # 診断結果表示ページ
│   │   └── result/[id]/        # 共有用結果表示ページ（PR #121）
│   ├── components/              # Reactコンポーネント
│   │   ├── diagnosis/          # 診断関連
│   │   ├── prairie/            # Prairie Card関連
│   │   ├── share/              # 共有機能（QRコード、NFC）
│   │   └── ui/                 # 汎用UIコンポーネント
│   ├── lib/                    # ユーティリティライブラリ
│   │   ├── constants/          # 定数管理
│   │   │   └── scoring.ts      # スコア分布、HTMLサイズ制限等
│   │   ├── prompts/            # AIプロンプト管理
│   │   │   └── diagnosis-prompts.ts # 診断プロンプトテンプレート
│   │   ├── validators/         # バリデーター
│   │   │   └── prairie-url-validator.ts # Prairie Card URL検証
│   │   ├── workers/            # Cloudflare Workers関連
│   │   │   └── kv-storage-v2.ts # KVストレージ実装
│   │   ├── diagnosis-engine-v3.ts # AI診断エンジン（リファクタリング済）
│   │   ├── sanitizer.ts        # HTML/XSSサニタイゼーション
│   │   └── logger.ts           # 環境別ログレベル制御
│   └── types/                  # TypeScript型定義（AnalysisMetadata追加）
├── functions/                  # Cloudflare Pages Functions
│   └── api/
│       ├── diagnosis.js        # 本番用診断API（OpenAI統合）
│       ├── diagnosis-v4-openai.js # AI診断エンジン
│       ├── prairie.js          # Prairie Card解析
│       └── results.js          # 結果取得API
└── public/                     # 静的ファイル
```

## 🔧 環境設定

### 必須環境変数

```bash
# OpenAI API（本番環境で必須）
OPENAI_API_KEY=your-api-key-here

# アプリケーションURL
NEXT_PUBLIC_APP_URL=https://cnd2.cloudnativedays.jp

# Sentry（オプション）
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Cloudflare KV Namespace（本番環境）

本番環境では以下のKV Namespaceがバインドされます：
- `DIAGNOSIS_KV`: 診断結果の永続化（7日間TTL）
- レート制限にも使用（1分間に10リクエスト/IP）

## 🚀 デプロイ

### 開発環境

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev
```

### 本番環境（Cloudflare Pages）

```bash
# ビルド（静的エクスポート）
npm run build

# デプロイ（自動）
# mainブランチへのマージで自動デプロイ
```

### デプロイ設定

**Cloudflare Pages設定:**
- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `out`
- Node.jsバージョン: 20.x
- 環境変数: Cloudflare Dashboardで設定

## ⚠️ 重要な注意事項

### 1. Edge Runtime 互換性

**使用不可なAPI:**
- Node.js固有のAPI（`fs`, `path`, `child_process`）
- `setInterval`（Edge Runtimeで使用不可）
- cheerio（正規表現でHTML解析を行う）

**代替実装:**
```typescript
// ❌ 悪い例
setInterval(() => cleanup(), 60000);

// ✅ 良い例
function checkRateLimit() {
  cleanupOldEntries(); // リクエスト時にクリーンアップ
  // ...
}
```

### 2. 型安全性（TypeScript Strict Mode）

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,  // 必須
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 3. セキュリティ

**HTML サニタイゼーション:**
```typescript
// DOMPurifyを使用
import { sanitizer } from '@/lib/sanitizer';
const clean = sanitizer.sanitizeHTML(dirty);
```

**Prairie Card URL検証:**
```typescript
const ALLOWED_PRAIRIE_HOSTS = new Set([
  'prairie.cards',
  'my.prairie.cards'
]);
// HTTPSプロトコルのみ許可
```

### 4. API レート制限

```typescript
// 1分間に10リクエスト/IP
const RATE_LIMIT = {
  WINDOW_MS: 60000,
  MAX_REQUESTS: 10
};
```

### 5. Date/Time処理

```typescript
// DiagnosisResultのcreatedAtはstring型（ISO形式）
createdAt: new Date().toISOString() // ✅ 正しい
createdAt: new Date() // ❌ エラー
```

## 📝 コミットメッセージ規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント更新
style: フォーマット変更
refactor: リファクタリング
test: テスト追加・修正
chore: ビルドプロセスや補助ツールの変更
perf: パフォーマンス改善
ci: CI/CD設定の変更
```

## 🧪 テスト

### 実行方法

```bash
# 全テスト実行（460テスト: 419パス、41スキップ）
npm test

# カバレッジ付き
npm test -- --coverage

# ウォッチモード
npm test -- --watch

# 特定ファイルのみ
npm test -- src/lib/__tests__/sanitizer.test.ts
```

### テスト環境での注意

```typescript
// logger.tsはテスト環境を検出
if (process.env.NODE_ENV === 'test') {
  // Jestモック対応のため直接console使用
}
```

## 🎭 E2Eテスト（Claude Code利用時）

Claude Codeを使用している場合、E2EテストはPlaywright MCPを通じて実行します。

### Playwright MCP経由での実行

```typescript
// Claude Code内で以下のMCPツールを使用
// - mcp__playwright__browser_navigate: ページ遷移
// - mcp__playwright__browser_snapshot: ページ要素の取得
// - mcp__playwright__browser_click: クリック操作
// - mcp__playwright__browser_fill_form: フォーム入力
// - mcp__playwright__browser_take_screenshot: スクリーンショット
```

### 使用例

1. **Prairie Card入力フローのテスト**
   - `/duo`ページへ遷移
   - Prairie Card URLを入力
   - 診断実行ボタンをクリック
   - 結果表示を確認

2. **診断結果表示のテスト**
   - 診断結果が表示されることを確認
   - 相性スコアが85点以上であることを確認
   - 点取り占い結果が表示されることを確認

### 注意事項

- 個別のPlaywrightインストールは不要（MCP経由で実行）
- `playwright.config.ts`や`e2e/`ディレクトリは作成不要
- テスト実行時はClaude CodeのMCPツールを直接使用

## 🔍 トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next out node_modules
npm install
npm run build
```

### 型エラー

```bash
# 型チェックを実行
npm run type-check

# 型エラーの詳細確認
npx tsc --noEmit --listFiles
```

### Edge Runtime エラー

```bash
# Edge Runtimeで使用不可なAPIを検出
grep -r "setInterval\|setTimeout\|fs\.|path\." src/
```

### デプロイエラー

1. 環境変数が正しく設定されているか確認
2. KV Namespaceがバインドされているか確認
3. ビルドログを確認：`wrangler pages deployment list`

## 🛠️ 開発のベストプラクティス

### 1. AI診断の実装

```typescript
// OpenAI APIは環境変数チェック
if (process.env.OPENAI_API_KEY) {
  // AI診断
} else {
  // フォールバック診断
}
```

### 2. エラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  logger.error('[Context] Error:', error);
  // ユーザーフレンドリーなメッセージ返却
}
```

### 3. パフォーマンス最適化

- 並列処理: `Promise.all()`を活用
- キャッシュ: メモリキャッシュまたはKV
- 遅延読み込み: 動的インポート使用

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Edge Runtime API Reference](https://nextjs.org/docs/app/api-reference/edge)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

## 📖 プロジェクトドキュメント

- [環境変数設定ガイド](docs/ENVIRONMENT_VARIABLES.md) - すべての環境変数の詳細
- [イベント運用ガイド](docs/EVENT_OPERATION_GUIDE.md) - CloudNative Days Winter 2025運用手順
- [フォールバック削除計画](docs/FALLBACK_REMOVAL_PLAN.md) - 段階的削除の詳細計画

## 🔄 最近の重要な変更

### 2025-09-03の変更（最新）

#### 共有機能のKVストレージ取得問題を修正 🚨
1. **問題**: 共有URLが異なるブラウザからアクセスできない
   - **原因**: `/api/results.js`にGETハンドラーが存在しなかった
   - フロントエンドは`/api/results?id=xxx`形式でリクエスト
   - GETハンドラーは`/api/results/[id].js`にのみ実装されていた

2. **修正内容**:
   - `/functions/api/results.js`にGETハンドラーを追加
   - クエリパラメータ形式（`?id=xxx`）に対応
   - KVストレージから診断結果を取得して返却
   - 適切なキャッシュヘッダーとCORS設定を追加

3. **影響範囲**:
   - 共有機能が完全に動作するように修正
   - LocalStorageに依存せず、KVストレージから結果を取得可能
   - 異なるデバイス/ブラウザ間での結果共有が可能に

### 2025-09-01の変更

#### 緊急対応: Next.js 15.5.0 静的エクスポート互換性問題の完全解決 🚨
1. **Cloudflare Pages デプロイ失敗の根本原因解決**
   - **問題**: Next.js 15.5.0 で `output: 'export'` 使用時に動的ルート `[id]` が使用不可
   - **解決**: すべての動的ルートを削除し、クエリパラメータベースに移行
   - **影響範囲**: `/result/[id]` → `/duo/results?id=` 形式に完全移行

2. **複数の緊急修正PRによる段階的解決**
   - **PR #125**: TypeScript コンパイルエラー修正
     - `DiagnosisResult` 型に不足していたプロパティ追加
     - `KVNamespace` インターフェースの型定義追加
   - **PR #127**: Next.js 15.5.0 パラメータ型変更対応
     - 動的ルートパラメータが `Promise<{id: string}>` 型に変更
   - **PR #128**: 動的ルート完全削除（最終解決）
     - `/src/app/api/results/[id]/route.ts` 削除
     - `/src/app/result/[id]/page.tsx` 削除
     - Cloudflare Functions でのみ結果取得API提供

3. **Dependabot 依存関係更新 (PR #129)**
   - **重要な発見**: Zod v4.0.0-beta.2 は OpenAI SDK v5.16.0 と非互換
   - **解決**: Zod を v3.25.76 に維持（OpenAI の peer dependency 要件）
   - **更新済み**: Next.js 15.5.2、Sentry 10.8.0、その他開発依存関係

4. **シェアボタンUX改善 (PR #132)**
   - **問題1**: 「リンクをコピー」ボタンの文字が背景と同色で見えない
   - **解決**: `text-gray-700` クラスを追加して視認性改善
   - **問題2**: 開発環境で本番URLが使用される
   - **解決**: `window.location.origin` で動的URL生成

5. **診断結果デバッグ機能の追加 (PR #134)**
   - **DiagnosisFullDebugコンポーネント**: LLMの全フィールドを表示
   - **デバッグモード**: `?debug=true` クエリパラメータで有効化
   - **環境制御**: 開発環境またはENABLE_PRODUCTION_DEBUG環境変数で制御
   - **147個のテストケース追加**: 完全なテストカバレッジ

6. **シェア機能のKVストレージ修正 (PR #135)** 🚨
   - **重大なバグ修正**: シェアURLが404エラーを返す問題を解決
   - **APIパス修正**:
     - POST: `/api/results/${id}` → `/api/results`
     - GET: `/api/results/${id}` → `/api/results?id=${id}`
   - **影響範囲**: duo/page.tsx、duo/results/page.tsx、group/page.tsx、page.tsx
   - **根本原因**: Next.js 15.5.0での動的ルート削除後の不完全な移行

### 2025-09-02の変更

#### PR #130 - AI診断エンジン有効化と大規模コードクリーンアップ 🎉
1. **Cloudflare FunctionsでAI診断エンジンを有効化**
   - ルールベースのV4エンジンからOpenAI版に切り替え
   - 0-100%の動的スコア分布を実現
   - conversationStarters（会話トピック）機能を追加
   - 207個のCNCFプロジェクトから「ラッキープロジェクト」を選択
   
2. **古いコードの大規模削除（2,530行、76KB）**
   - `diagnosis-v3.js`: 古いバージョン（未使用）
   - `diagnosis-v4.js`: ルールベースエンジン（OpenAI版に置き換え）
   - `diagnosis-multi.js`: マルチスタイル診断（PR #115で廃止）
   - `/api/diagnosis-multi/`: 未使用のAPIルート
   - `/duo/multi-results/`: 未使用の結果表示ページ
   - MultiStyle関連コンポーネント: 未使用
   
3. **改善効果**
   - PDFサンプルと同等の高品質な診断結果を提供
   - プロフィール情報を活用した個別化された診断
   - コードベースの大幅なクリーンアップによる保守性向上

#### PR #122 - 診断結果共有URLの404エラー修正 ✅
1. **静的エクスポート環境での動的ルート問題を解決**
   - **URL形式変更**: `/result/[id]` → `/duo/results?id=[id]`（クエリパラメータ形式）
   - **理由**: Next.js の `output: 'export'` では動的ルート `[id]` が使用不可
   - **影響範囲**: ShareButton、QRCodeModal、結果ページ全て修正済み

2. **ロギング機能の統一化**
   - 全ての `console.*` を `logger` ユーティリティに置き換え
   - 環境別ログレベル制御の適用

3. **環境判定ヘルパーの活用**
   - `isProduction()` ヘルパー関数を使用してコードの一貫性向上
   - duo/page.tsx、group/page.tsx で統一

4. **レビュー評価**: ⭐ 8.5/10 - 優れた修正として評価

### 2025-09-01の変更

#### PR #119 - 環境変数制御ロジックのテスト追加 ✅
1. **包括的なテストカバレッジ（50テスト）**
   - **environment.test.ts**: 34テストで環境判定とヘルパー関数を網羅
   - **fallback.test.ts**: 10テストでフォールバック制御ロジックを検証
   - **fallback-config.test.js**: 6テストでCloudflare Functions用設定をカバー
   - **レビュー評価**: 8.5/10、セキュリティ9/10、テスト品質9/10

#### PR #117 - コード品質の改善（Claude Review対応） ✅
1. **コード品質の改善**
   - **型安全性の向上**: `AnalysisMetadata`インターフェース追加、`as any`完全除去
   - **Prairie Card URLセキュリティ強化**: 専用バリデーター実装、HTTPS強制、攻撃対策
   - **コード可読性向上**: 複雑な正規表現への詳細コメント追加
   - **Claude Review評価**: 5.0/5.0 ⭐⭐⭐⭐⭐（完璧な実装）

#### PR #115 - 診断システムの大幅改善 ✅
1. **診断システムの大幅改善**
   - **固定85%スコア問題を解決**: 動的スコアリング（0-100%）実装
   - **4スタイル診断を単一診断に統合**: シンプルで分かりやすいUX
   - **低スコアでもポジティブな体験設計**: 「レアケース！」「話題作り！」として楽しめる
   - **新しい診断結果ページ**: `/duo/results`を追加、紙吹雪エフェクト付き

#### フォールバック診断の環境別制御機能追加
1. **フォールバック診断の制御強化**
   - **環境変数による制御**: `ENABLE_FALLBACK`（デフォルト: false）
   - **イベント運用最適化**: エラー時は即座に検知できるようデフォルト無効
   - **開発/本番で異なるスコア範囲**: 開発30-40点、本番85-100点
   - **フォールバック設定ファイル**: `/lib/constants/fallback.ts`に一元管理

2. **コード品質の改善（レビュー対応）**
   - **重複コード排除**: Cloudflare Functions用の共通設定 `/functions/utils/fallback-config.js`
   - **型安全性向上**: `ExtractedProfileInfo`型を定義
   - **環境判定ヘルパー**: `/lib/utils/environment.ts`で環境判定を一元化
   - **環境変数バリデーション**: `getEnvBoolean`等の型安全な取得関数
   
2. **コード品質の大幅改善** ✅
   - **プロンプトテンプレートの外部化**: `lib/prompts/diagnosis-prompts.ts`に分離
   - **マジックナンバーの定数化**: `lib/constants/scoring.ts`で一元管理
   - **HTMLサイズ制限の緩和**: 10KB→15KB（より多くのプロフィール情報取得）
   - **alert()をToast通知に置き換え**: sonnerライブラリで優れたUX
   - **diagnosis-engine-v3.tsのリファクタリング**: 208行のプロンプト関数を削除
   
3. **スコア分布の実装** ✅
   ```typescript
   // lib/constants/scoring.ts
   export const SCORE_DISTRIBUTION = {
     RARE: { threshold: 0.05, range: [0, 19], percentage: 5 },
     CHALLENGING: { threshold: 0.15, range: [20, 39], percentage: 10 },
     GROWING: { threshold: 0.35, range: [40, 59], percentage: 20 },
     BALANCED: { threshold: 0.65, range: [60, 79], percentage: 30 },
     EXCELLENT: { threshold: 0.90, range: [80, 94], percentage: 25 },
     PERFECT: { threshold: 1.00, range: [95, 99], percentage: 10 }
   }
   ```

### 2025-08-31の変更  
1. **~~複数スタイル同時診断機能の実装~~** → **単一診断に統合（PR #115）**
   - ~~4つの診断スタイル（Creative、占星術、点取り占い、技術分析）を並列実行~~
   - ~~Promise.allによる並列処理で2-3秒の高速診断~~
   - ~~タブ/グリッド切り替え可能な比較UI実装~~
   - ~~新APIエンドポイント `/api/diagnosis-multi` 追加~~
   - 注: PR #115で単一診断に統合（UX改善のため）

2. **セキュリティ強化** ✅
   - CORS設定を本番環境用に最適化
     ```typescript
     // 開発環境と本番環境で異なるCORS設定
     const allowedOrigins = process.env.NODE_ENV === 'development' 
       ? ['http://localhost:3000', 'http://localhost:3001'] 
       : ['https://cnd2.cloudnativedays.jp', 'https://cnd2-app.pages.dev'];
     ```
   - 全入力値にHTMLサニタイゼーション適用（DOMPurify使用）
   - APIリトライ機構（最大3回、指数バックオフ）

3. **テストカバレッジ向上** ✅
   - ~~複数スタイル診断APIテスト: 10テストケース追加~~ （削除済み）
   - ~~MultiStyleSelectorコンポーネントテスト: 14テストケース追加~~ （削除済み）
   - 総テスト数: 460テスト（419パス、41スキップ）
   - v1.2.0の76テストから大幅増加

4. **コード品質改善** ✅
   - マジックナンバーを定数化（`/lib/constants/diagnosis.ts`）
   - LocalStorageの24時間TTLクリーンアップ実装
   - 処理時間、クリーンアップ間隔、スタイル設定を定数管理

### 2025-09-01の変更（その2）
1. **診断結果共有機能の実装** ✅（PR #121）
   - **結果取得API** (`/api/results/[id]`)
     - Cloudflare KVストレージからの結果取得
     - キャッシュヘッダー設定（ブラウザ1時間、CDN2時間）
     - レート制限実装（30リクエスト/分/IP）
     - 開発環境用モック結果対応
   - **共有用結果表示ページ** (`/result/[id]`)
     - 診断結果の詳細表示（スコア、強み、機会、アドバイス）
     - 運勢情報の表示（ラッキーアイテム、アクション）
     - レスポンシブデザイン対応
     - エラー状態の適切な処理
   - **共有機能の充実**
     - QRコード生成
     - SNS共有（X/Twitter、LINE、Facebook）
     - NFCタグ書き込み対応
     - ネイティブシェア機能
   - **テスト追加**
     - APIエンドポイントテスト: 7ケース
     - 結果表示ページテスト: 5ケース
     - 全88テストがパス
   - **Claude Review評価**: ⭐⭐⭐⭐⭐ (5.0/5.0)
   - **改善実装済み**:
     - メモリリーク対策（AbortController追加）
     - OGP対応（metadata export）
     - レースコンディション考慮事項追加

### 2025-09-01の変更（その3）
1. **Dependabot PRの対応** 🔧
   - **PR #124（本番依存関係）**: クローズ
     - Zod v4へのアップデートがOpenAI SDK v5.16.0と非互換
     - OpenAI SDKはpeer dependencyとしてZod v3を要求
     - npm installがERESOLVEエラーで失敗
     - OpenAI SDKがZod v4対応するまで保留
   - **PR #126（開発依存関係）**: マージ済み
     - @types/node: 22.5.4 → 22.5.5
     - @types/react: 18.3.5 → 18.3.11
     - eslint-config-next: 14.2.8 → 14.2.13
     - typescript: 5.5.4 → 5.6.2
     - 本番環境への影響なし、安全な更新

### 2025-09-01の変更（その2）
1. **診断システムの多様性向上** ✅（PR #123）
   - **LLMによる自由生成**
     - 診断タイプ名、会話トピック、ラッキーアイテムなど全項目を自由生成
     - 固定リストからの選択を廃止（フォールバック時のみ使用）
   - **会話機能の強化**
     - `conversationStarters`フィールド追加（5つの基本質問）
     - `conversationTopics`改善（最大10個、多様なカテゴリー）
   - **CNCFプロジェクト機能**
     - 207個のCNCFプロジェクトリスト実装
     - Graduated/Incubating/Sandboxすべて網羅
   - **改善実装**
     - luckyProjectパーサーの共通関数化（`utils/lucky-project-parser.ts`）
     - AIレスポンス用の型定義追加（`types/ai-response.ts`）
     - any型の除去による型安全性向上

2. **localStorage キー不一致バグの緊急修正** 🚨
   - **問題**: 診断結果が「読み込み中...」で無限待機
   - **原因**: 保存時と読込時でキーパターンが異なる
     - 保存: `diagnosis-${id}` → 読込: `diagnosis-result-${id}`
   - **修正**: 全ファイルで `diagnosis-result-` に統一（PR #108）
   - **検証**: Playwrightで自動テスト実施、動作確認済み
   - **教訓**: キー定数は一元管理すべき

### 2025-08-29の変更
1. **診断結果のエンターテイメント性向上**
   - 「クラウドネイティブの賢者」キャラクター導入
   - ~~スコアを常に85点以上に設定~~（9/1に0-100%動的スコアに変更）
   - ラッキーアイテム・ラッキーアクション追加
   - temperature: 0.85で創造的な診断文生成

2. **Prairie Card解析の完全修正** ✅
   - functions/api/prairie.jsが実際にHTMLを解析するように修正
   - prairie-parser.jsに包括的な抽出パターンを追加
   - 技術キーワードの自動検出（JavaScript、Docker、Kubernetes等）
   - ハッシュタグ抽出機能

3. **UIフローの改善**
   - duo/page.tsxに自動画面遷移を実装
   - プログレスバーのビジュアルフィードバック強化
   - ランディングページと統一されたデザイン

4. **CIテストエラーの修正** ✅
   - NextResponse.jsonのJestモック追加（jest.setup.js）
   - ApiErrorクラスの引数順序修正 (message, code, statusCode, details)
   - cache-manager-generic.ts追加で汎用キャッシュテスト修正
   - Edge Runtime互換性の改善（setInterval → リクエスト時クリーンアップ）

5. **v3エンジンのトークン消費分析と最適化** ✅
   - 最適化前: 7,000トークン/診断 = ¥288,000（予算の11.5倍）
   - 最適化後: 1,500トークン/診断 = ¥64,800（77%削減達成）
   - 結論: 大幅なコスト削減に成功

6. **PR #65完了** ✅
   - Prairie Card解析とv3プロンプト精度向上
   - 2025-08-29 mainブランチにマージ済み

### 2025-08-27の変更
1. **テストモック戦略の根本的修正**: `global.fetch`から`apiClient`の直接モックへ移行
2. **IntersectionObserver修正**: Jestモック関数から適切なクラスコンストラクタへ
3. **React Confettiモック化**: Canvas関連エラーを完全回避
4. **ErrorBoundary無限ループ防止**: テスト環境での副作用スキップ
5. **シングルトンパターン対応**: PrairieCardParserに`resetInstance()`追加

### 2025-08-26の変更
1. **AI診断機能実装**: OpenAI GPT-4o-mini統合
2. **セキュリティ強化**: Prairie Card URL検証、HTML sanitization
3. **レート制限実装**: 10リクエスト/分/IP
4. **Edge Runtime対応**: setInterval削除、cheerio→正規表現
5. **型安全性向上**: DiagnosisResult型の統一

## 📝 今後の改善項目（ToDo）

### 結果共有機能の改善（高優先度）
- [ ] **Next.js App Router用APIエンドポイント作成**
  - `src/app/api/results/[id]/route.ts` を作成
  - Cloudflare Functions版と同等の機能実装
  - 開発環境での404エラーを解消
- [ ] **KV保存処理の共通化**
  - duo/page.tsx と group/page.tsx の重複コードをヘルパー関数に抽出
  - `/lib/utils/kv-storage.ts` として実装
- [ ] **環境別処理の最適化**
  - 開発環境: LocalStorage優先、API呼び出し最小化
  - 本番環境: KVストレージ連携を積極活用

### フォールバック機能削除（最高優先度）
- [ ] **フェーズ1: 安定性確認**（v1.5.0、2週間）
  - PR #115マージ後の新診断エンジン監視
  - エラーレート < 1%を確認
  - パフォーマンス測定（p95 < 2秒）
- [ ] **フェーズ2: 段階的無効化**（v1.5.1、2週間）
  - 廃止予定の警告追加
  - ドキュメント更新
  - 依存コードの特定
- [ ] **フェーズ3: 完全削除**（v1.6.0）
  - generateMockDiagnosis関数群削除
  - フォールバック設定ファイル削除
  - ENABLE_FALLBACK環境変数の削除
  - 詳細は[フォールバック削除計画](docs/FALLBACK_REMOVAL_PLAN.md)参照

### APIテスト強化（高優先度）
- [ ] diagnosis APIのエッジケーステスト追加
  - サニタイザーのエッジケース
  - フォールバック結果の品質検証
  - CORSプリフライトリクエストの処理
  - 動的スコアリング（0-100%）の分布テスト

### UI/UXの改善（中優先度）
- [ ] 診断結果の共有機能実装（現在「準備中」）
- [ ] エラー境界（Error Boundary）の実装
- [ ] 診断結果ページのアニメーション最適化

### 機能拡張（中優先度）
- [ ] 診断履歴機能の追加
- [ ] Cloudflare KVへの結果永続化オプション
- [ ] PWA機能の強化
- [ ] レート制限の実装（Cloudflare KV活用）

### v3エンジン関連（中優先度）
- [ ] v3エンジンのテスト修正（5つのエラーハンドリングテスト）
  - キャッシュ処理のテスト
  - 新規診断生成のテスト
  - フォールバック診断のテスト
  - HTMLフェッチエラーのテスト
  - AI応答パースエラーのテスト

### E2Eテスト移行（低優先度）
- [ ] HomePage統合テストをPlaywrightでE2E化
- [ ] DuoPage統合テストをPlaywrightでE2E化
- [ ] GroupPage統合テストをPlaywrightでE2E化

### テスト改善（低優先度）
- [ ] テストモックをtest-utilsファイルに分離
- [ ] 全体のテストカバレッジを80%以上に向上
- [ ] 複数メンバー間のナビゲーションテスト実装

## 📋 次スプリントでの改善項目（2025-09-02）

### ⚡ レビューで指摘された改善項目（中優先度）

PR #119のレビューで指摘された軽微な改善：
- [ ] **TypeScript/JavaScript間の一貫性強化**
  - `getEnvBoolean`の大文字小文字処理を統一
  - Cloudflare Functions版と挙動を合わせる
- [ ] **テストの型安全性向上**
  - `jest.mocked()`ヘルパーの使用
  - requireからimportへの移行
- [ ] **エッジケーステスト追加**
  - 小数点数値のparseIntテスト
  - 環境変数オーバーフロー処理
- [ ] **本番環境ログ抑制テスト**
  - DEBUG_MODE未設定時の動作確認

### ⚡ 既存の高優先度改善項目
- [x] **プロンプトテンプレートの外部化** ✅ 完了済み
- [x] **マジックナンバーの定数化** ✅ 完了済み  
- [x] **HTMLサイズ制限の増加** ✅ 完了済み（10KB→15KB）
- [x] **alert()のToast通知への置き換え** ✅ 完了済み

### 中優先度の改善
- [ ] **diagnosis-engine-v3.tsの責務分離**
  ```typescript
  class DiagnosisEngine {
    private scoreCalculator: ScoreCalculator;
    private fallbackGenerator: FallbackGenerator;
    private promptBuilder: PromptBuilder;
  }
  ```
- [x] **型安全性の向上** ✅ PR #123で実装済み
  - AIレスポンス用の型定義を`types/ai-response.ts`に追加
  - any型を除去し、適切な型定義を使用
- [ ] **Results画面のテスト追加**
  - スコア別カラーリングのテスト
  - 紙吹雪エフェクトの表示テスト
  - LocalStorageからのデータ読み込みテスト

### 低優先度の改善
- [x] **コード品質** ✅ PR #117で実装済み
  - [x] 複雑な正規表現へのコメント追加（`prairie-profile-extractor.ts`）
  - [ ] エラーハンドリングの標準化
  
- [ ] **セキュリティ強化**
  - [x] Prairie Card URLのHTTPSのみ許可の明示的な検証 ✅ PR #117で実装済み
  - [ ] DOMPurifyによる追加のHTMLサニタイゼーション実装
  
- [ ] **テスト拡充**
  - 実際のPrairie Card HTMLサンプルでのテスト追加
  - エラー境界条件のより詳細なテスト
  - HTMLパーサーのエッジケーステスト

---

**重要**: このガイドラインは常に最新の状態に保ってください。
変更があった場合は、必ずPull Request経由で更新してください。