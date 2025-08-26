# Branch Protection設定ガイド

このドキュメントでは、mainブランチの保護設定について説明します。

## 🔒 なぜブランチ保護が必要か

- **品質保証**: コードレビューとテストの強制
- **事故防止**: 直接mainへのプッシュを防ぐ
- **履歴保護**: force pushやブランチ削除を防ぐ
- **プロセス強化**: PR経由の開発フローを確立

## 📋 推奨設定

GitHubリポジトリの Settings → Branches → Add rule で以下を設定：

### Branch name pattern
```
main
```

### 基本設定

#### ✅ Require a pull request before merging
- [x] **Require a pull request before merging**
  - [ ] Require approvals（チーム開発時は1以上を推奨）
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [ ] Require review from CODEOWNERS（CODEOWNERSファイル設定時）
  - [ ] Restrict who can dismiss pull request reviews

#### ✅ Require status checks to pass before merging
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  
  必須ステータスチェック：
  - `Test` - テスト実行
  - `Lint` - ESLint
  - `Type Check` - TypeScript型チェック
  - `Build` - ビルド成功
  - `claude-review` - Claude Codeレビュー（オプション）

#### ✅ Require conversation resolution before merging
- [x] **Require conversation resolution before merging**
  - PRコメントの解決を必須にする

### 追加の保護設定

#### ⚠️ 制限設定
- [ ] **Require signed commits**（署名付きコミットの要求）
- [x] **Require linear history**（マージコミットを禁止、リベースのみ）
- [x] **Include administrators**（管理者も規則に従う）
- [ ] **Restrict who can push to matching branches**（プッシュ可能なユーザーを制限）

#### 🚫 危険な操作の防止
- [x] **Do not allow force pushes**（force pushを禁止）
- [x] **Do not allow deletions**（ブランチ削除を禁止）

## 🔄 開発フロー

ブランチ保護設定後の開発フロー：

```bash
# 1. フィーチャーブランチを作成
git checkout -b feature/new-feature

# 2. 変更をコミット
git add .
git commit -m "feat: Add new feature"

# 3. プッシュ
git push origin feature/new-feature

# 4. PRを作成
gh pr create

# 5. CI/CDチェックが通過するのを待つ

# 6. Claude Codeレビューを確認

# 7. マージ（GitHub UIまたはCLI）
gh pr merge --squash
```

## 🚨 緊急時の対応

緊急のホットフィックスが必要な場合：

1. **hotfix/**プレフィックスのブランチを作成
2. 最小限の変更のみを行う
3. PRを作成し、説明に「HOTFIX」を含める
4. CI/CDチェックの通過を確認
5. 管理者権限でマージ

```bash
# ホットフィックスブランチ
git checkout -b hotfix/critical-bug-fix
git commit -m "hotfix: Fix critical production bug"
git push origin hotfix/critical-bug-fix
gh pr create --title "HOTFIX: Critical bug fix" --body "緊急修正..."
```

## 📊 例外ケース

以下の場合は一時的に保護を無効化できます：

- **依存関係の緊急アップデート**（セキュリティ脆弱性）
- **CI/CD設定の修正**（テストが実行できない場合）
- **ドキュメントのみの更新**（[skip ci]タグ使用）

## 🔍 監査とレビュー

定期的に以下を確認：

- PRマージ履歴
- 保護規則の違反試行
- CI/CD成功率
- レビュープロセスの効率

## 💡 ベストプラクティス

1. **小さなPRを心がける**: レビューしやすく、問題を特定しやすい
2. **意味のあるPRタイトル**: 変更内容が一目でわかるように
3. **CI/CDグリーンを維持**: 常にテストが通る状態を保つ
4. **レビューコメントに対応**: フィードバックを真摯に受け止める
5. **ブランチを整理**: マージ後は不要なブランチを削除

## 🛠️ トラブルシューティング

### ステータスチェックが見つからない

```bash
# GitHub Actionsワークフローを確認
cat .github/workflows/*.yml

# 必要なジョブ名を確認
gh workflow list
```

### マージできない

1. ブランチが最新か確認
```bash
git fetch origin
git rebase origin/main
```

2. CI/CDステータスを確認
```bash
gh pr checks
```

3. コンフリクトを解決
```bash
git status
# コンフリクトファイルを修正
git add .
git rebase --continue
```

## 📝 設定テンプレート

`.github/CODEOWNERS`（オプション）:
```
# Global owners
* @tsukaman

# Frontend
/src/components/ @frontend-team
/src/app/ @frontend-team

# Backend
/src/api/ @backend-team
/src/lib/ @backend-team

# Documentation
*.md @documentation-team
/docs/ @documentation-team
```

## 🔗 参考資料

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Conventional Commits](https://www.conventionalcommits.org/)