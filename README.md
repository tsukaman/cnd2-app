# CND² (CND Squared)

> CND × CnD = Your Connection²

CloudNative Days Winter 2025 相性診断アプリ

## 🚀 概要

**CND²（CND Squared）** は、CloudNative Days Winter 2025（11月18-19日）向けの相性診断アプリです。
Prairie Cardのプロフィール情報を活用して、参加者同士の「出会いを二乗でスケール」します。

### ✨ 特徴

- 🎯 **Prairie Card連携** - プロフィール情報を自動取得
- 🤖 **AI診断** - GPT-4o-miniによる楽しい相性診断
- 📱 **NFC/QRコード対応** - スマートフォンでタッチするだけ
- 👥 **グループ診断** - 3-6人で診断（6人なら6²=36通りの相性）
- 🎨 **エンターテイメント性** - アニメーション満載の楽しいUI/UX
- 🔒 **プライバシー配慮** - 診断結果は7日後に自動削除

## 🛠 技術スタック

- **Frontend**: Next.js 15.5.0, TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion, Three.js
- **AI**: OpenAI GPT-4o-mini
- **Infrastructure**: Cloudflare Pages/Workers
- **Domain**: https://cdn2.cloudnativedays.jp (本番環境)

## 📦 インストール

```bash
# リポジトリをクローン
git clone https://github.com/tsukaman/cnd2-app.git
cd cnd2-app

# パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.localにOpenAI APIキーを設定
```

## 🚀 開発

```bash
# 開発サーバーを起動
npm run dev

# http://localhost:3000 でアクセス
```

## 🏗 ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーを起動
npm start
```

## 📝 環境変数

`.env.local` ファイルに以下の環境変数を設定してください：

```env
# OpenAI API設定
OPENAI_API_KEY=your_openai_api_key_here

# アプリケーション設定
NEXT_PUBLIC_APP_NAME=CND²
NEXT_PUBLIC_HASHTAG=#CNDxCnD
NEXT_PUBLIC_PRAIRIE_URL=https://my.prairie.cards
NEXT_PUBLIC_CND2_API=http://localhost:3000/api
```

## 🗓 開発スケジュール

- **2025年8月**: 開発開始
- **2025年9月**: コア機能実装
- **2025年10月**: テスト・最適化
- **2025年11月上旬**: 本番準備
- **2025年11月18-19日**: CloudNative Days Winter 2025で稼働

## 🤝 コントリビューション

Issue や Pull Request は歓迎です！

## 📄 ライセンス

MIT License

## 🔗 関連リンク

- [CloudNative Days Winter 2025](https://cloudnativedays.jp/cndw2025)
- [Prairie Card](https://my.prairie.cards)
- [#CNDxCnD](https://twitter.com/hashtag/CNDxCnD)

## 📧 お問い合わせ

- **開発者**: つかまん
- **Prairie Card**: https://my.prairie.cards/u/tsukaman
- **Email**: tsukaman@mac.com

---

**CND² - 出会いを二乗でスケールする、CloudNative Daysの新体験！**

#CNDxCnD #CNDW2025 #PrairieCard