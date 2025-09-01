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
│   │   │   └── results/        # 結果取得API（※未実装）
│   ├── components/              # Reactコンポーネント
│   │   ├── diagnosis/          # 診断関連
│   │   ├── prairie/            # Prairie Card関連
│   │   ├── share/              # 共有機能（QRコード、NFC）
│   │   └── ui/                 # 汎用UIコンポーネント
│   ├── lib/                    # ユーティリティライブラリ
│   │   ├── workers/            # Cloudflare Workers関連
│   │   │   └── kv-storage-v2.ts # KVストレージ実装
│   │   ├── diagnosis-engine.ts # AI診断エンジン
│   │   ├── sanitizer.ts        # HTML/XSSサニタイゼーション
│   │   └── logger.ts           # 環境別ログレベル制御
│   └── types/                  # TypeScript型定義
├── functions/                  # Cloudflare Pages Functions
│   └── api/
│       └── diagnosis/          # 本番用診断API（KV統合）
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

## 🔄 最近の重要な変更

### 2025-09-01の変更（最新）
1. **複数スタイル診断の簡素化** (#107) ✅
   - 複数スタイル選択UIを削除し、常に4つのスタイル全てで診断
   - DIAGNOSIS_STYLES定数を共通化（lib/constants/diagnosis.ts）
   - ユーザーフィードバック対応：「全部盛り込んでください」
   - 開発環境用モックデータ追加でテスト効率向上

### 2025-08-31の変更
1. **複数スタイル同時診断機能の実装** ✅
   - 4つの診断スタイル（Creative、占星術、点取り占い、技術分析）を並列実行
   - Promise.allによる並列処理で2-3秒の高速診断（従来の8秒から75%削減）
   - タブ/グリッド切り替え可能な比較UI実装
   - 新APIエンドポイント `/api/diagnosis-multi` 追加
   - コスト効率的な実装（約0.6円/診断）
   - PR #100でマージ完了

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
   - 複数スタイル診断APIテスト: 10テストケース追加
   - MultiStyleSelectorコンポーネントテスト: 14テストケース追加
   - 総テスト数: 460テスト（419パス、41スキップ）
   - v1.2.0の76テストから大幅増加

4. **コード品質改善** ✅
   - マジックナンバーを定数化（`/lib/constants/diagnosis.ts`）
   - LocalStorageの24時間TTLクリーンアップ実装
   - 処理時間、クリーンアップ間隔、スタイル設定を定数管理

### 2025-08-29の変更
1. **診断結果のエンターテイメント性向上**
   - 「クラウドネイティブの賢者」キャラクター導入
   - スコアを常に85点以上に設定（ポジティブな体験）
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

### UI/UXの改善（高優先度）
- [ ] 大きなコンポーネントのリファクタリング（`MultiStyleResults.tsx` 298行を分割）
  - MultiStyleSummary.tsx（サマリー表示）
  - StyleComparisonChart.tsx（スコア比較）
  - StyleTabView.tsx（タブ表示）
  - StyleGridView.tsx（グリッド表示）
- [ ] 診断結果の共有機能実装（現在「準備中」）
- [ ] エラー境界（Error Boundary）の実装

### 機能拡張（中優先度）
- [ ] 診断履歴機能の追加
- [ ] Cloudflare KVへの結果永続化オプション
- [ ] PWA機能の強化

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

## 📋 次スプリントでの改善項目（2025-08-30）

Claude Reviewで指摘された軽微な改善項目：

### コード品質改善
- [ ] 複雑な正規表現へのコメント追加（`prairie-profile-extractor.ts`）
- [ ] マジックナンバーの定数化（タイムアウト値5000ms等）

### セキュリティ強化  
- [ ] DOMPurifyによる追加のHTMLサニタイゼーション実装
- [ ] Prairie Card URLのHTTPSのみ許可の明示的な検証

### テスト拡充
- [ ] 実際のPrairie Card HTMLサンプルでのテスト追加
- [ ] エラー境界条件のより詳細なテスト
- [ ] HTMLパーサーのエッジケーステスト

---

**重要**: このガイドラインは常に最新の状態に保ってください。
変更があった場合は、必ずPull Request経由で更新してください。