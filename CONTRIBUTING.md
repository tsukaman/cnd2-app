# Contributing to CND²

CND²プロジェクトへの貢献を検討いただきありがとうございます！

## 行動規範

このプロジェクトに参加することで、建設的で協力的なコミュニティの維持にご協力いただくことを期待しています。

## 貢献方法

### バグ報告

バグを発見した場合は、[GitHub Issues](https://github.com/tsukaman/cnd2-app/issues)で報告してください。

報告時には以下の情報を含めてください：
- バグの詳細な説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境情報（OS、ブラウザ、Node.jsバージョンなど）

### 機能提案

新機能の提案は[GitHub Issues](https://github.com/tsukaman/cnd2-app/issues)で行ってください。

### プルリクエスト

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

#### コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従ってください：

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメントの変更
- `style:` コードの意味に影響しない変更（空白、フォーマット等）
- `refactor:` バグ修正も機能追加も行わないコード変更
- `test:` テストの追加や修正
- `chore:` ビルドプロセスやツールの変更

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/tsukaman/cnd2-app.git
cd cnd2-app

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# テストを実行
npm test

# ビルド
npm run build
```

### コーディング規約

- TypeScriptを使用
- ESLintとPrettierの設定に従う
- 新機能にはテストを追加
- ドキュメントを更新

## ライセンス

貢献されたコードは、プロジェクトと同じApache License 2.0の下でライセンスされます。

貢献することで、あなたの貢献がApache License 2.0の下でライセンスされることに同意したものとみなされます。

## 質問

質問がある場合は、[GitHub Issues](https://github.com/tsukaman/cnd2-app/issues)でお気軽にお尋ねください。

## 謝辞

CND²プロジェクトへの貢献に感謝いたします！