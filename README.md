# CND² - CloudNative Days × Connect 'n' Devise

<div align="center">
  <img src="public/images/trademark@4x.png" alt="CloudNative Days Winter 2025" width="200"/>

  **Devise Your Verse, Connect Your World**

  [![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0%20strict-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Jest](https://img.shields.io/badge/Jest-30.0-C21325?logo=jest)](https://jestjs.io/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)

  **#CNDxCnD**

  🎯 [CloudNative Days Winter 2025公式サイト](https://event.cloudnativedays.jp/cndw2025)
</div>

## 📋 概要

**CND²（CloudNative Days × Connect 'n' Devise）** は、CloudNative Days Winter 2025（11月18-19日 @ 東京）のための特別な川柳ゲームアプリケーションです。技術者が5-7-5のリズムで創造性を発揮し（Devise）、笑いと共感でつながる（Connect）新しい交流体験を提供します。

> **最終更新**: 2025-09-27 - v2.1.0

### ✨ 主な機能

#### 🎮 川柳ゲーム機能
- **Devise a Room**: 川柳ゲームルームを創作
  - ホストとしてゲームを主催
  - 参加コードの自動生成（6文字）
  - 最大6人までの同時プレイ対応
- **Connect to Room**: 仲間とつながる
  - 参加コードで簡単にルーム参加
  - QRコードスキャン対応
  - NFC対応（Android）
- **5-7-5創作システム**:
  - 上の句（5音）: CloudNative技術カード
  - 中の句（7音）: 時間・場面カード
  - 下の句（5音）: 結果・感情カード
  - カードの組み合わせで川柳を創作
- **リアルタイムプレイ**: WebSocket通信による同期
  - プレゼンテーションタイマー（60秒）
  - 投票システム（創造性・ユーモア・技術）
  - リアルタイムスコアリング
- **Verses Connected Gallery**: 作品ギャラリー
  - 優秀作品の自動保存
  - いいね機能
  - ランキング表示（匿名対応）

#### 🎨 UI/UX特徴
- **Connect 'n' Deviseブランドデザイン**:
  - パープル×シアンのグラデーション
  - 5-7-5のリズムを視覚化
  - 創造性と接続性を表現
- **モバイル最適化**:
  - レスポンシブデザイン
  - タッチフレンドリーUI
  - 最小60pxのタッチターゲット
- **アクセシビリティ**: WCAG 2.1 Level AA準拠

#### 🔒 セキュリティ&プライバシー
- **プライバシー配慮**: ゲーム結果は7日後に自動削除
- **セキュリティ対策**: HTML sanitization & XSS protection完備
- **レート制限**: 10 requests/minute per IP

## 🔧 開発ガイドライン

**重要**: すべての変更は Pull Request 経由で提出してください。main ブランチへの直接プッシュは禁止されています。
詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

## 🚀 技術スタック

### フロントエンド
- **Framework**: Next.js 15.5.4 (App Router + Turbopack)
- **Language**: TypeScript 5.0 with strict mode enabled
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion 12.23, Three.js
- **Icons**: Lucide React
- **Validation**: Zod 3.25
- **QRコード**: qrcode 1.5.4（ルーム共有機能用）

### バックエンド
- **Runtime**: Edge Runtime compatible
- **Data Storage**: Cloudflare Workers KV (7日間自動削除)
- **Rate Limiting**: 10 requests/minute per IP
- **Security**: HTML sanitization, XSS protection

### テスティング
- **Test Runner**: Jest 30.0
- **Testing Library**: React Testing Library 16.3
- **Coverage**: 35テストスイート、574テスト

### インフラ・モニタリング
- **Hosting**: Cloudflare Pages/Workers
- **Storage**: Cloudflare Workers KV
- **Monitoring**: Sentry (エラートラッキング、パフォーマンス監視)

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
# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 川柳管理API認証トークン（管理画面用、オプション）
SENRYU_ADMIN_TOKEN=your-admin-token-here

# Sentry設定（オプション）
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
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

### Cloudflare Pages Functions (Production Only)
Located in `functions/*` - Used for production deployment on Cloudflare Pages

#### `/api/senryu/*` - 川柳ゲーム関連API
- **Methods**: GET, POST, PUT, DELETE
- **Features**:
  - ルーム管理
  - 川柳データの保存/取得
  - ランキング機能

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

- [開発ガイドライン](./CLAUDE.md) - 開発ワークフロー、コード規約
- [変更履歴](./CHANGELOG.md) - バージョン履歴と変更内容

## 🏗️ アーキテクチャ

### ディレクトリ構造

```
cnd2-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # 管理画面
│   │   │   └── senryu/         # 川柳管理
│   │   ├── senryu/             # 川柳ゲームページ
│   │   │   ├── gallery/        # ギャラリー
│   │   │   ├── ranking/        # ランキング
│   │   │   └── room/           # ゲームルーム
│   │   └── layout.tsx          # ルートレイアウト
│   ├── components/             # Reactコンポーネント
│   │   ├── senryu/             # 川柳ゲーム関連
│   │   └── ui/                 # 汎用UIコンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── lib/                    # ユーティリティ
│   │   └── api/                # APIクライアント
│   └── types/                  # TypeScript型定義
├── functions/                  # Cloudflare Pages Functions
├── public/                     # 静的ファイル
└── package.json
```

## 🧪 テスト

現在のテスト状況:
- **テストスイート**: 35/35 passed (100% success rate)
- **テストケース**: 574 passed

```bash
# 全テストを実行
npm test

# 特定のテストファイルを実行
npm test -- src/components/__tests__/component.test.tsx

# ウォッチモードで実行
npm test -- --watch

# カバレージレポートを生成
npm test -- --coverage
```

## 🔒 セキュリティ

- **環境変数検証**: Zodによる厳密な型チェック
- **APIキー保護**: サーバーサイドのみでアクセス可能
- **レート制限**: 悪用防止のための制限機構
- **CORS設定**: 適切なオリジン制御
- **XSS対策**: React標準のエスケープ処理

## 🚀 デプロイ

### Development (ローカル開発)
```bash
# 開発環境セットアップ
npm install
cp .env.example .env.local
# .env.localに環境変数を設定

# 開発サーバー起動
npm run dev
```

### Production - Cloudflare Pages（推奨）
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
- **KV Namespace**: `SENRYU_KV` binding必須
- **環境変数**: Cloudflare Dashboardで設定

## 🤝 貢献

貢献を歓迎します！

1. フォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 👨‍💻 作者

**つかまん** - [@tsukaman](https://twitter.com/tsukaman)

## 📄 ライセンス

このプロジェクトはApache License 2.0の下で公開されています。詳細は[LICENSE](./LICENSE)ファイルをご覧ください。

## 🔄 最近の更新

### v2.1.0 (2025-09-27)
- **大規模リファクタリング**: 診断機能を削除し川柳ゲームに特化
- **アーキテクチャ改善**: 不要な依存関係を削除（~500KB削減）
- **セキュリティ向上**: 外部API依存を完全に除去

### v2.0.0 (2025-09-27)
- **リブランド**: CND² - CloudNative Days × Connect 'n' Devise
- **コンセプト刷新**: Devise（創作）とConnect（つながり）の融合

## 📊 プロジェクトステータス

- **バージョン**: 2.1.0
- **ステータス**: Production Ready
- **最終更新**: 2025年9月27日
- **テスト**: 全テスト合格 ✅
- **ビルド**: 静的エクスポート成功 ✅
- **TypeScript**: Strict mode enabled ✅
- **モニタリング**: Sentry統合済み ✅

## 🙏 謝辞

- [CloudNative Days Committee](https://cloudnativedays.jp/) - イベント主催
- [Claude](https://claude.ai) - AI開発アシスタント
- すべてのコントリビューターとテスター

---

<div align="center">
  Made with ❤️ for CloudNative Days Winter 2025
</div>