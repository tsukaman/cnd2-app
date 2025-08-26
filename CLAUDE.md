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
```

### 2. 開発作業

```bash
# コードを編集

# テストを実行
npm test

# リントを実行
npm run lint

# 型チェック
npm run type-check
```

### 3. コミット

```bash
# 変更をステージング
git add .

# コミット（セマンティックコミットメッセージを使用）
git commit -m "feat: 新機能の追加"
# または
git commit -m "fix: バグの修正"
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
│   │   │   ├── diagnosis/      # 診断API
│   │   │   ├── prairie/        # Prairie Card API
│   │   │   └── results/        # 結果取得API
│   ├── lib/                    # ライブラリ
│   │   ├── workers/            # Cloudflare Workers関連
│   │   │   └── kv-storage-v2.ts # KVストレージ
│   │   ├── validators/         # バリデーション
│   │   ├── diagnosis-engine-v2.ts # 診断エンジン
│   │   └── prairie-card-parser.ts # Prairie Card解析
```

## 🔧 環境設定

### 必須環境変数

```bash
# OpenAI API（本番環境で必須）
OPENAI_API_KEY=your-api-key-here

# アプリケーションURL
NEXT_PUBLIC_APP_URL=https://cnd2-app.pages.dev
```

### Cloudflare KV Namespace

本番環境では以下のKV Namespaceが自動的にバインドされます：
- `CND2_RESULTS`: 診断結果の永続化用

## 🚀 デプロイ

### Cloudflare Pages

```bash
# ビルド
npm run build

# デプロイ（自動）
# mainブランチへのマージで自動デプロイ
```

## ⚠️ 注意事項

1. **Edge Runtime 互換性**
   - Node.js固有のAPIは使用不可
   - `fs`, `path`, `child_process` などは使えません
   - cheerioの代わりに正規表現でHTML解析

2. **型安全性**
   - すべての関数に適切な型定義を追加
   - Zodによるランタイムバリデーション

3. **エラーハンドリング**
   - try-catchで適切にエラーをキャッチ
   - ユーザーフレンドリーなエラーメッセージ

4. **パフォーマンス**
   - KVストレージへのアクセスを最小限に
   - 並列処理の活用

## 📝 コミットメッセージ規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント更新
style: フォーマット変更
refactor: リファクタリング
test: テスト追加・修正
chore: ビルドプロセスや補助ツールの変更
```

## 🔍 トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next node_modules
npm install
npm run build
```

### 型エラー

```bash
# 型チェックを実行
npm run type-check
```

### デプロイエラー

1. 環境変数が正しく設定されているか確認
2. KV Namespaceがバインドされているか確認
3. ビルドログを確認

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Edge Runtime API Reference](https://nextjs.org/docs/app/api-reference/edge)

---

**重要**: このガイドラインは常に最新の状態に保ってください。
変更があった場合は、必ずPull Request経由で更新してください。