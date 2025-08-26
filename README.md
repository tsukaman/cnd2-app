# CND² - CloudNative Days × Connect 'n' Discover

<div align="center">
  <img src="public/images/trademark@4x.png" alt="CloudNative Days Winter 2025" width="200"/>
  
  **エンジニアの出会いを、データで可視化する**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
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
- **Prairie Card連携**: Prairie Cardから自動的にプロフィール情報を取得
- **AI診断**: OpenAI GPT-4を使用した高度な相性分析（フォールバック機構付き）
- **結果共有**: QRコードやNFC、URLでの診断結果シェア機能
- **美しいUI**: ダークテーマベースの洗練されたデザイン
- **プライバシー配慮**: 診断結果は7日後に自動削除

## 🔧 開発ガイドライン

**重要**: すべての変更は Pull Request 経由で提出してください。main ブランチへの直接プッシュは禁止されています。
詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

## 🚀 技術スタック

### フロントエンド
- **Framework**: Next.js 15.5.0 (App Router + Turbopack)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion 12.23, Three.js, GSAP 3.13
- **Icons**: Lucide React
- **Validation**: Zod 3.25

### バックエンド
- **API Routes**: Next.js App Router API
- **AI Integration**: OpenAI API (GPT-4-turbo-preview)
- **Data Parsing**: Cheerio for Prairie Card scraping
- **Rate Limiting**: カスタムミドルウェア実装
- **Error Handling**: 構造化エラーハンドリング

### テスティング
- **Test Runner**: Jest 30.0
- **Testing Library**: React Testing Library 16.3
- **Coverage**: 63テスト、包括的なカバレージ

### インフラ・モニタリング
- **Hosting**: Cloudflare Pages/Workers (推奨)
- **Storage**: Cloudflare Workers KV (診断結果の永続化)
- **Monitoring**: Sentry (エラートラッキング、パフォーマンス監視)
- **Environment Validation**: Zodによる型安全な環境変数
- **API Security**: レート制限、CORS、リクエストID追跡
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
- レート制限（100リクエスト/分）
- リクエストID追跡

#### 診断エンジン
- AI診断（OpenAI GPT-4）
- ルールベース診断（フォールバック）
- キャッシュ機構
- 並列処理対応

#### Prairie Card連携
- プロフィール自動取得
- データ正規化
- エラー処理

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
- **レート制限**: 悪用防止のための制限機構（100req/分）
- **CORS設定**: 適切なオリジン制御
- **XSS対策**: React標準のエスケープ処理 + CSP設定
- **CSRFトークン**: Next.jsの標準実装
- **CSP**: Content Security Policy（unsafe-eval不使用）
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

### Cloudflare Pages（推奨）
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
- **環境変数**: Cloudflare Dashboardで設定

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

## 🙏 謝辞

- [CloudNative Days Committee](https://cloudnativedays.jp/) - イベント主催
- [Prairie Card](https://prairie.cards/) - プロフィールシステム提供（Powered by Prairie Card）
- [Claude](https://claude.ai) - AI開発アシスタント
- すべてのコントリビューターとテスター

## 📊 プロジェクトステータス

- **バージョン**: 1.0.0
- **ステータス**: Production Ready
- **最終更新**: 2025年8月26日
- **テスト**: 全63テスト合格 ✅
- **ビルド**: 成功 ✅
- **セキュリティ**: CSP強化済み ✅
- **モニタリング**: Sentry統合済み ✅

---

<div align="center">
  Made with ❤️ for CloudNative Days Winter 2025
</div>