# CND² - CloudNative Days × Connect 'n' Discover

<div align="center">
  <img src="public/images/trademark@4x.png" alt="CloudNative Days Winter 2025" width="200"/>
  
  **エンジニアの出会いを、データで可視化する**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Jest](https://img.shields.io/badge/Jest-30.0-C21325?logo=jest)](https://jestjs.io/)
  
  **#CNDxCnD**
</div>

## 📋 概要

**CND²（CloudNative Days × Connect 'n' Discover）** は、CloudNative Days Winter 2025（11月18-19日 @ 東京）のための特別な相性診断アプリケーションです。Prairie Cardの情報を基に、エンジニア同士の技術的な相性や協働の可能性を可視化し、「出会いを二乗でスケール」します。

### ✨ 主な機能

- **2人診断モード**: 2人のエンジニアの相性を詳細に分析
- **グループ診断モード**: 3-6人のチームの相性と協働可能性を評価（6人なら6²=36通りの相性）
- **Prairie Card連携**: Prairie Cardから自動的にプロフィール情報を取得
- **AI診断**: OpenAI GPT-4o-miniを使用した高度な相性分析
- **結果共有**: QRコードやURLでの診断結果シェア機能
- **美しいUI**: ダークテーマベースの洗練されたデザイン
- **プライバシー配慮**: 診断結果は7日後に自動削除

## 🚀 技術スタック

### フロントエンド
- **Framework**: Next.js 15.5.0 (App Router + Turbopack)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion 12.23, Three.js
- **Icons**: Lucide React

### バックエンド
- **API Routes**: Next.js App Router API
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **Data Parsing**: Cheerio for Prairie Card scraping

### テスティング
- **Test Runner**: Jest 30.0
- **Testing Library**: React Testing Library 16.3
- **Coverage**: Unit tests for hooks and components

### インフラ
- **Hosting**: Cloudflare Pages/Workers
- **Domain**: https://cdn2.cloudnativedays.jp (本番環境)

## 📦 インストール

```bash
# リポジトリのクローン
git clone https://github.com/tsukaman/cnd2-app.git
cd cnd2-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localにOpenAI APIキーを設定
```

### 環境変数

`.env.local`ファイルに以下の環境変数を設定してください：

```env
# OpenAI API設定
OPENAI_API_KEY=your_openai_api_key_here

# アプリケーション設定
NEXT_PUBLIC_APP_NAME=CND²
NEXT_PUBLIC_HASHTAG=#CNDxCnD
NEXT_PUBLIC_PRAIRIE_URL=https://my.prairie.cards
NEXT_PUBLIC_CND2_API=http://localhost:3000/api
```

## 🛠️ 開発

```bash
# 開発サーバーの起動 (Turbopack使用)
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start

# Lintの実行
npm run lint

# テストの実行
npm test

# テストをwatchモードで実行
npm run test:watch

# カバレッジレポートの生成
npm run test:coverage
```

## 🧪 テスト

現在、以下のテストが実装されています：

- ✅ `MenuCard`コンポーネントのユニットテスト
- ✅ `usePrairieCard`フックのテスト（100%カバレッジ）
- ✅ `useDiagnosis`フックのテスト（100%カバレッジ）

```bash
# テスト実行
npm test

# カバレッジ確認
npm run test:coverage
```

## 📁 プロジェクト構造

```
cnd2-app/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes
│   │   │   ├── diagnosis/    # 診断API
│   │   │   ├── prairie/      # Prairie Card取得API
│   │   │   └── results/      # 結果取得API
│   │   ├── duo/              # 2人診断ページ
│   │   ├── group/            # グループ診断ページ
│   │   ├── result/           # 結果表示ページ
│   │   └── page.tsx          # ホームページ
│   ├── components/           # Reactコンポーネント
│   │   ├── ui/               # UIコンポーネント
│   │   ├── effects/          # アニメーション効果
│   │   ├── prairie/          # Prairie Card関連
│   │   ├── diagnosis/        # 診断結果表示
│   │   └── share/            # 共有機能
│   ├── hooks/                # カスタムフック
│   ├── lib/                  # ユーティリティ関数
│   ├── types/                # TypeScript型定義
│   └── config/               # 設定ファイル
├── public/                   # 静的ファイル
│   └── images/              # ロゴ・画像
├── jest.config.js           # Jest設定
├── tailwind.config.ts       # Tailwind CSS設定
└── next.config.ts           # Next.js設定
```

## 🎨 デザインシステム

### カラーパレット

- **Primary**: Orange gradient (#FBBF24 → #FB923C → #F97316 → #DC2626)
- **Secondary**: Purple (#C084FC)
- **Accent**: Blue (#60A5FA)
- **Background**: Dark navy gradient (#0F172A → #1E1B4B → #1E293B)
- **Text**: Light gray (#F1F5F9) on dark backgrounds

### 主要コンポーネント

- グラデーションテキスト効果
- ガラスモーフィズムカード
- アニメーション背景効果（星空パターン）
- レスポンシブレイアウト

### アクセシビリティ

- WCAG準拠のコントラスト比
- キーボードナビゲーション対応
- モーション設定を尊重（prefers-reduced-motion）

## 🗓 開発スケジュール

- **2025年8月**: プロジェクト開始、UI/UXデザイン完成
- **2025年9月**: コア機能実装、Prairie Card連携
- **2025年10月**: テスト自動化、パフォーマンス最適化
- **2025年11月上旬**: 本番環境準備、負荷テスト
- **2025年11月18-19日**: CloudNative Days Winter 2025で本番稼働

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容について議論してください。

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [CloudNative Days Committee](https://cloudnativedays.jp/) - イベント主催
- [Prairie Card](https://prairie.cards/) - プロフィールシステム提供（Powered by Prairie Card）
- すべてのコントリビューターとテスター

## 🔗 関連リンク

- [CloudNative Days Winter 2025](https://event.cloudnativedays.jp/cndw2025)
- [Prairie Card](https://my.prairie.cards)
- [#CNDxCnD](https://twitter.com/hashtag/CNDxCnD)

## 📧 お問い合わせ

- **開発者**: つかまん
- **Prairie Card**: https://my.prairie.cards/u/tsukaman
- **Email**: tsukaman@mac.com
- **Issue Tracker**: [GitHub Issues](https://github.com/tsukaman/cnd2-app/issues)

---

<div align="center">
  Made with ❤️ for CloudNative Days Winter 2025
  
  **Connect Your Future | Discover Your Match | Scale Your Network | Code × Community**
  
  **#CNDxCnD #CNDW2025**
</div>