# CND² - CloudNative Days × Connect 'n' Discover

<div align="center">
  <img src="public/images/trademark@4x.png" alt="CloudNative Days Winter 2025" width="200"/>
  
  **エンジニアの出会いを、データで可視化する**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0%20strict-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Jest](https://img.shields.io/badge/Jest-30.0-C21325?logo=jest)](https://jestjs.io/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  
  **#CNDxCnD**
</div>

## 📋 概要

**CND²（CloudNative Days × Connect 'n' Discover）** は、CloudNative Days Winter 2025（11月18-19日 @ 東京）のための特別な相性診断アプリケーションです。Prairie Cardの情報を基に、エンジニア同士の技術的な相性や協働の可能性を可視化し、「出会いを二乗でスケール」します。

### ✨ 主な機能

- **2人診断モード**: 2人のエンジニアの相性を詳細に分析
- **グループ診断モード**: 3-6人のチームの相性と協働可能性を評価（6人なら6²=36通りの相性）
- **動的スコアリング**: 0-100%の全範囲で相性を評価（低スコアでもポジティブな体験）
- **Prairie Card連携**: Edge Runtime対応の高速パーサーで自動プロフィール取得
- **AI診断**: OpenAI GPT-4o-miniを使用した高度な相性分析（フォールバック機構付き）
- **結果共有**: QRコードやNFC、URLでの診断結果シェア機能（静的エクスポート対応）
- **美しいUI**: ダークテーマベースの洗練されたデザイン
- **プライバシー配慮**: 診断結果は7日後に自動削除
- **セキュリティ対策**: HTML sanitization & XSS protection完備
- **レート制限**: 10 requests/minute per IP（悪用防止）

## 🔧 開発ガイドライン

**重要**: すべての変更は Pull Request 経由で提出してください。main ブランチへの直接プッシュは禁止されています。
詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

## 🚀 技術スタック

### フロントエンド
- **Framework**: Next.js 15.5.0 (App Router + Turbopack)
- **Language**: TypeScript 5.0 with strict mode enabled
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion 12.23, Three.js, GSAP 3.13
- **Icons**: Lucide React
- **Validation**: Zod 3.25

### バックエンド
- **Dual API Implementation**: 
  - Next.js API Routes (src/app/api/*) for development（一部未実装）
  - Cloudflare Pages Functions (functions/*) for production
  - **AI診断エンジン**: OpenAI GPT-4o-mini統合（v1.5.0）
  - **結果共有**: クエリパラメータ形式 `/duo/results?id=[id]`（静的エクスポート対応）
- **Runtime**: Edge Runtime compatible
- **AI Integration**: OpenAI API (GPT-4o-mini) with 10s timeout
- **Data Storage**: Cloudflare Workers KV (7日間自動削除)
- **Data Parsing**: Edge Runtime compatible Prairie Card parser
- **Rate Limiting**: 10 requests/minute per IP (in-memory store for Edge compatibility)
- **Security**: 
  - HTML sanitization (カスタムサニタイザー実装)
  - XSS protection
  - 再帰的オブジェクトサニタイゼーション
- **Error Handling**: 
  - 構造化エラーハンドリング + 環境別ログレベル制御
  - エラータイプ別レスポンス（400, 408, 500）
- **CORS**: 複数オリジンサポート（環境変数設定可能）

### テスティング
- **Test Runner**: Jest 30.0
- **Testing Library**: React Testing Library 16.3
- **Coverage**: 76テスト、包括的なカバレージ

### インフラ・モニタリング
- **Hosting**: Cloudflare Pages/Workers (推奨)
- **Storage**: Cloudflare Workers KV (診断結果の永続化、LocalStorageフォールバック付き)
- **Monitoring**: Sentry (エラートラッキング、パフォーマンス監視)
- **Logging**: 環境別ログレベル制御（本番環境で機密情報自動サニタイズ）
- **Environment Validation**: Zodによる型安全な環境変数
- **API Security**: 
  - レート制限（10 requests/minute per IP）、リクエストID追跡
  - HTML sanitization（DOMPurify）、XSS protection
  - CORS（複数オリジンサポート）
  - APIタイムアウト（10秒）
- **Secrets Management**: サーバーサイドのみでのAPIキー管理
- **CSP**: Content Security Policy設定（XSS対策強化）

### パフォーマンス最適化
- **Bundle Analysis**: webpack-bundle-analyzerによるバンドルサイズ分析
- **Image Optimization**: Next/Imageによる画像最適化とWebP自動変換
- **Lazy Loading**: Intersection Observerによる遅延読み込み
- **Code Splitting**: 動的インポートによるコード分割
- **Edge Runtime**: Cloudflare Workersでのエッジ実行

## 📦 インストール

### 前提条件
- Node.js 20.0.0以上
- npm 10.0.0以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/tsukaman/cnd2-app.git
cd cnd2-app

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.localを編集して必要な値を設定
```

### 環境変数の設定

`.env.local`ファイルに以下の環境変数を設定してください：

```bash
# OpenAI API（必須）
OPENAI_API_KEY=your-api-key-here

# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# CORS設定（オプション、カンマ区切り）
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# 環境設定
NODE_ENV=development  # development | production
ENABLE_FALLBACK=false  # フォールバック診断制御（デフォルト: false）

# Sentry設定（オプション）
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# その他の設定は.env.exampleを参照
```

## 🔧 開発

```bash
# 開発サーバーを起動（Turbopack使用）
npm run dev

# テストを実行
npm test

# テストカバレージを確認
npm test -- --coverage

# リント実行
npm run lint

# 型チェック
npm run type-check

# ビルド
npm run build

# バンドルサイズ分析
npm run analyze

# プロダクションモードで起動
npm start
```

## 🚧 APIエンドポイント

### Next.js API Routes (Development)
Located in `src/app/api/*` - Used for local development

### `/api/diagnosis` - 診断実行
- **Method**: POST
- **Body**: `{ profiles: PrairieProfile[], mode: 'duo' | 'group' }`
- **Response**: 診断結果（OpenAI GPT-4o-mini powered with fallback）
- **Features**: 
  - 10 requests/minute rate limiting per IP
  - 10秒APIタイムアウト
  - Edge Runtime compatible
  - HTML sanitization & XSS protection

### `/api/prairie` - Prairie Card解析
- **Method**: POST  
- **Body**: `{ url: string } | { html: string }`
- **Response**: サニタイズされたプロフィール情報
- **Features**: 
  - Edge Runtime対応高速パーサー
  - DOMPurify HTML sanitization
  - キャッシュ機構付き

### `/api/results/[id]` - 結果取得/削除
- **Methods**: GET, DELETE
- **Response**: 保存された診断結果
- **Features**: KVストレージから取得（7日間自動削除）

### Cloudflare Pages Functions (Production)
Located in `functions/*` - Used for production deployment on Cloudflare Pages
- **Runtime**: Cloudflare Workers Runtime
- **KV Storage**: Cloudflare Workers KV bindings
- **Edge Deployment**: Global edge network deployment

## 🔧 デバッグモード

開発中のデバッグのため、詳細なログを出力するデバッグモードを実装しています。

### 有効化方法

```bash
# .env.development ファイルに設定
DEBUG_MODE=true
```

### デバッグ情報

デバッグモードでは以下の情報がコンソールに出力されます：

#### Prairie Card解析
- HTMLの長さとサンプル（最初の500文字）
- 名前抽出の候補（og:title, twitter:title, titleタグ等）  
- 各フィールドの抽出候補と最終選択
- 最終的なプロフィール構造

#### 診断エンジン
- サニタイズされたプロフィール情報
- OpenAIへ送信されるプロンプト
- OpenAIからの生レスポンス
- トークン使用量
- 最終的な診断結果

### ログ例

```javascript
[DEBUG] Name extraction sources: {
  ogTitle: "＿・）つかまん のプロフィール",
  twitterTitle: undefined,
  titleTag: "＿・）つかまん - Prairie Card"
}
[DEBUG] Name extracted with pattern 1: "＿・）つかまん"
[DEBUG] Token usage: {
  prompt_tokens: 450,
  completion_tokens: 230,
  total_tokens: 680
}
```

**注意**: デバッグモードは開発環境でのみ使用し、本番環境では無効にしてください。

## 🌐 デプロイ環境

### 開発環境（現在稼働中）
- **URL**: https://cnd2-app.pages.dev
- **プラットフォーム**: Cloudflare Pages
- **Functions**: Cloudflare Workers
- **ストレージ**: Cloudflare KV

### 本番環境（将来）
- **URL**: https://cnd2.cloudnativedays.jp （※開発完了後に設定）
- **カスタムドメイン**: 開発完了後にCloudflareで設定

## 📚 ドキュメント

- [開発ガイドライン](./CLAUDE.md) - 開発ワークフロー、コード規約、今後のToDo
- [変更履歴](./CHANGELOG.md) - バージョン履歴と変更内容
- [環境変数設定ガイド](./docs/ENVIRONMENT_VARIABLES.md) - すべての環境変数の詳細説明
- [イベント運用ガイド](./docs/EVENT_OPERATION_GUIDE.md) - CloudNative Days Winter 2025運用手順
- [フォールバック削除計画](./docs/FALLBACK_REMOVAL_PLAN.md) - v1.6.0に向けた段階的削除計画

## 🏗️ アーキテクチャ

### ディレクトリ構造

```
cnd2-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # APIルート
│   │   │   ├── diagnosis/      # 診断API
│   │   │   └── prairie/        # Prairie Card API
│   │   ├── (main)/            # メインレイアウト
│   │   ├── result/            # 結果ページ
│   │   └── layout.tsx         # ルートレイアウト
│   ├── components/             # Reactコンポーネント
│   │   ├── diagnosis/         # 診断関連
│   │   ├── prairie/           # Prairie Card関連
│   │   ├── share/             # 共有機能
│   │   └── ui/                # 汎用UIコンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── lib/                    # ユーティリティ
│   │   ├── api-middleware.ts  # APIミドルウェア
│   │   ├── api-errors.ts      # エラーハンドリング
│   │   ├── env.ts             # 環境変数検証
│   │   ├── rate-limiter.ts    # レート制限
│   │   ├── sentry-filters.ts  # Sentryエラーフィルタリング
│   │   └── workers/           # Cloudflare Workers関連
│   │       └── kv-storage.ts  # KVストレージ実装
│   └── types/                  # TypeScript型定義
├── public/                     # 静的ファイル
├── __tests__/                  # テストファイル
└── package.json
```

### 主要な実装

#### APIミドルウェア
- リクエスト/レスポンスロギング
- エラーハンドリング
- レート制限（10 requests/minute per IP）
- リクエストID追跡
- HTML sanitization & XSS protection

#### 診断エンジン
- AI診断（OpenAI GPT-4o-mini）
- ルールベース診断（フォールバック）
- キャッシュ機構
- 並列処理対応
- Edge Runtime compatibility

#### Prairie Card連携
- プロフィール自動取得（Edge Runtime対応）
- データ正規化 & DOMPurify sanitization
- エラー処理
- キャッシュ機構付き

## 🧪 テスト

```bash
# 全テストを実行
npm test

# 特定のテストファイルを実行
npm test -- src/lib/__tests__/api-middleware.test.ts

# ウォッチモードで実行
npm test -- --watch

# カバレージレポートを生成
npm test -- --coverage
```

### テストカバレージ
- コンポーネントテスト: ✅
- フックテスト: ✅
- APIミドルウェアテスト: ✅
- 環境変数検証テスト: ✅

## 📚 API仕様

### POST /api/diagnosis
Prairie Cardのプロフィール情報から相性診断を生成

```typescript
// リクエスト
{
  profiles: PrairieProfile[],
  mode: 'duo' | 'group'
}

// レスポンス
{
  success: true,
  data: {
    result: DiagnosisResult,
    aiPowered: boolean
  }
}
```

### POST /api/prairie
Prairie CardのURLからプロフィール情報を取得

```typescript
// リクエスト
{
  url: string
}

// レスポンス
{
  success: true,
  data: {
    profile: PrairieProfile,
    cacheStats: CacheStats
  }
}
```

## 🔒 セキュリティ

- **環境変数検証**: Zodによる厳密な型チェック
- **APIキー保護**: サーバーサイドのみでアクセス可能
- **レート制限**: 悪用防止のための制限機構（10 requests/minute per IP）
- **CORS設定**: 適切なオリジン制御
- **XSS対策**: 
  - DOMPurify HTML sanitization
  - React標準のエスケープ処理
  - CSP設定（unsafe-eval不使用）
- **HTML Sanitization**: 
  - Prairie Card data sanitization
  - Allowed tags: p, br, strong, em, h1-h6, ul, ol, li, etc.
  - Dangerous protocol blocking: javascript:, data:, vbscript:
- **CSRFトークン**: Next.jsの標準実装
- **セキュリティヘッダー**: X-Frame-Options、X-Content-Type-Options等

## 📊 モニタリング・監視

### Sentry統合
- **エラートラッキング**: クライアント、サーバー、エッジランタイム全対応
- **パフォーマンス監視**: トランザクション追跡、レスポンスタイム計測
- **セッションリプレイ**: エラー発生時のユーザー操作を再現（本番環境のみ）
- **カスタムフィルタリング**: ノイズ除去、重要エラーのみ通知

### 診断結果の永続化
- **Cloudflare Workers KV**: 診断結果の保存と取得
- **自動削除**: 7日後に自動削除（プライバシー保護）
- **レート制限**: KVレベルでのレート制限実装

## 🚀 デプロイ

### Development (ローカル開発)
```bash
# 開発環境セットアップ
npm install
cp .env.example .env.local
# .env.localに環境変数を設定

# 開発サーバー起動（Next.js API Routes使用）
npm run dev
```

### Production - Cloudflare Pages（推奨）
本プロジェクトは静的エクスポート + Cloudflare Pages Functions で本番運用

```bash
# ビルド（静的エクスポート）
npm run build

# Wrangler CLIを使用してデプロイ
npx wrangler pages deploy out

# または、Cloudflare DashboardからGitHub連携でデプロイ
```

#### Cloudflare Pages設定
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `out`
- **Node.jsバージョン**: 20.x
- **Functions**: `functions/` ディレクトリが自動デプロイ
- **KV Namespace**: `DIAGNOSIS_KV` binding必須
- **環境変数**: Cloudflare Dashboardで設定
  - `OPENAI_API_KEY`
  - `ALLOWED_ORIGINS`
  - `KV_NAMESPACE`

### Vercel（代替）
```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel
```

**注意**: Vercelは商業イベント利用時に有料プランが必要な場合があります。

### Docker
```bash
# イメージをビルド
docker build -t cnd2-app .

# コンテナを起動
docker run -p 3000:3000 cnd2-app
```

## 🤝 貢献

貢献を歓迎します！詳細は[CONTRIBUTING.md](./CONTRIBUTING.md)をご覧ください。

1. フォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 👨‍💻 作者

**つかまん** - [@tsukaman](https://twitter.com/tsukaman)

## 📄 ライセンス

このプロジェクトはApache License 2.0の下で公開されています。詳細は[LICENSE](./LICENSE)ファイルをご覧ください。

## 🌟 最近の更新

### v1.3.0 (2025-08-31)
- 🎉 複数スタイル同時診断機能
- ⚡ Promise.allによる並列処理（75%高速化、2-3秒で完了）
- 🎨 4つの診断スタイル同時実行
- 📊 タブ/グリッド切り替え可能な比較UI
- 💰 コスト効率的な実装（約0.6円/診断）

### v1.2.0 (2025-08-26)
- 🤖 AI diagnosis with OpenAI GPT-4o-mini integration
- 🛡️ HTML sanitization & XSS protection with DOMPurify
- ⚡ Prairie Card parsing with Edge Runtime compatibility
- 🚦 Rate limiting (10 requests/minute per IP)
- 🔄 Dual API implementation (Next.js Routes + Cloudflare Functions)
- 📝 TypeScript strict mode enabled
- ✅ Test suite expanded to 76 tests
- 🚀 Static export for Cloudflare Pages deployment

## 🙏 謝辞

- [CloudNative Days Committee](https://cloudnativedays.jp/) - イベント主催
- [Prairie Card](https://prairie.cards/) - プロフィールシステム提供（Powered by Prairie Card）
- [Claude](https://claude.ai) - AI開発アシスタント
- すべてのコントリビューターとテスター

## 📊 プロジェクトステータス

- **バージョン**: 1.3.1
- **ステータス**: Production Ready
- **最終更新**: 2025年9月1日
- **テスト**: 全460テスト（419合格、41スキップ） ✅
- **ビルド**: 静的エクスポート成功 ✅
- **API**: 
  - Next.js API Routes (development) ✅
  - Cloudflare Pages Functions (production) ✅
- **AI Integration**: OpenAI GPT-4o-mini診断 ✅
- **セキュリティ**: 
  - HTML sanitization & XSS protection ✅
  - Rate limiting (10 req/min per IP) ✅
  - CSP強化済み ✅
  - CORS設定最適化 ✅
  - 機密情報サニタイズ ✅
- **Runtime**: Edge Runtime compatibility ✅
- **TypeScript**: Strict mode enabled ✅
- **モニタリング**: Sentry統合済み ✅

---

<div align="center">
  Made with ❤️ for CloudNative Days Winter 2025
</div>