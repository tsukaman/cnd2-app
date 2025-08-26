# CND² Development Guide

## 開発環境セットアップ

### 必要なツール

- **Node.js**: v20.0.0以上
- **npm**: v10.0.0以上
- **Git**: v2.0以上
- **エディタ**: VSCode推奨

### VSCode拡張機能（推奨）

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 初期セットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/tsukaman/cnd2-app.git
cd cnd2-app
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
cp .env.example .env.local
```

4. **環境変数の編集**
`.env.local`を開いて必要な値を設定：

```env
# OpenAI APIキー（必須）
OPENAI_API_KEY=sk-...

# データベース（オプション）
DATABASE_URL=postgresql://...

# Redis（オプション）
REDIS_URL=redis://...
```

5. **開発サーバーの起動**
```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## プロジェクト構造

```
cnd2-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # APIルート
│   │   │   ├── diagnosis/      # 診断エンドポイント
│   │   │   └── prairie/        # Prairie Cardエンドポイント
│   │   ├── (main)/             # メインレイアウトグループ
│   │   │   ├── page.tsx        # ホームページ
│   │   │   ├── duo/            # 2人診断
│   │   │   └── group/          # グループ診断
│   │   ├── result/[id]/        # 結果ページ（動的ルート）
│   │   ├── layout.tsx          # ルートレイアウト
│   │   └── global.css          # グローバルスタイル
│   ├── components/
│   │   ├── diagnosis/          # 診断関連コンポーネント
│   │   │   ├── DiagnosisCard.tsx
│   │   │   ├── DiagnosisResult.tsx
│   │   │   └── ScoreDisplay.tsx
│   │   ├── prairie/            # Prairie Card関連
│   │   │   ├── PrairieCardInput.tsx
│   │   │   └── ProfileDisplay.tsx
│   │   ├── share/              # 共有機能
│   │   │   ├── ShareButton.tsx
│   │   │   └── QRCodeModal.tsx
│   │   └── ui/                 # 汎用UIコンポーネント
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Loading.tsx
│   ├── hooks/                  # カスタムフック
│   │   ├── useDiagnosis.ts
│   │   ├── usePrairieCard.ts
│   │   └── useShare.ts
│   ├── lib/                    # ユーティリティ
│   │   ├── api-middleware.ts   # APIミドルウェア
│   │   ├── api-errors.ts       # エラー定義
│   │   ├── diagnosis-engine.ts # 診断エンジン
│   │   ├── env.ts              # 環境変数検証
│   │   ├── prairie-parser.ts   # Prairie Cardパーサー
│   │   └── rate-limit.ts       # レート制限
│   └── types/                  # 型定義
│       └── index.ts
├── public/                     # 静的ファイル
│   └── images/
├── docs/                       # ドキュメント
├── __tests__/                  # テスト
└── package.json
```

## 開発ワークフロー

### ブランチ戦略

```
main
  ├── feature/新機能名
  ├── fix/バグ修正名
  ├── chore/メンテナンス作業
  └── docs/ドキュメント更新
```

### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/)に従います：

```bash
feat: 新機能を追加
fix: バグを修正
docs: ドキュメントを更新
style: コードスタイルを修正（機能変更なし）
refactor: リファクタリング（機能変更なし）
test: テストを追加・修正
chore: ビルド設定などを更新
```

### プルリクエストフロー

1. **ブランチを作成**
```bash
git checkout -b feature/amazing-feature
```

2. **変更を実装**
```bash
# コードを編集
npm run lint        # リント実行
npm test           # テスト実行
npm run type-check # 型チェック
```

3. **コミット**
```bash
git add .
git commit -m "feat: Add amazing feature"
```

4. **プッシュ**
```bash
git push origin feature/amazing-feature
```

5. **プルリクエスト作成**
- GitHubでプルリクエストを作成
- CI/CDがすべてパスすることを確認
- レビューを受ける

## テスト

### テストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードで実行
npm test -- --watch

# カバレージレポートを生成
npm test -- --coverage

# 特定のファイルのみテスト
npm test -- src/lib/__tests__/api-middleware.test.ts
```

### テストの書き方

#### コンポーネントテスト

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButton } from '@/components/share/ShareButton';

describe('ShareButton', () => {
  it('renders share button', () => {
    render(<ShareButton resultId="123" score={85} />);
    
    const button = screen.getByText('結果をシェア');
    expect(button).toBeInTheDocument();
  });

  it('opens share modal when clicked', () => {
    render(<ShareButton resultId="123" score={85} />);
    
    const button = screen.getByText('結果をシェア');
    fireEvent.click(button);
    
    expect(screen.getByText('リンクをコピー')).toBeInTheDocument();
  });
});
```

#### APIテスト

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/prairie/route';

describe('Prairie API', () => {
  it('fetches profile successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/prairie', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://prairie-card.cloudnativedays.jp/u/test'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.profile).toBeDefined();
  });
});
```

## デバッグ

### ログの確認

```bash
# 開発サーバーのログ
npm run dev

# ブラウザコンソール
開発者ツール > Console

# Next.jsのデバッグモード
NODE_OPTIONS='--inspect' npm run dev
```

### よくある問題と解決策

#### 環境変数が読み込まれない

```bash
# .env.localファイルの確認
cat .env.local

# サーバーを再起動
npm run dev
```

#### TypeScriptエラー

```bash
# 型チェック
npm run type-check

# 型定義の更新
npm install --save-dev @types/パッケージ名
```

#### テストが失敗する

```bash
# モジュールキャッシュをクリア
jest --clearCache

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

## パフォーマンス最適化

### ビルドの最適化

```bash
# 本番ビルド
npm run build

# ビルドサイズの分析
npm run analyze
```

### キャッシング戦略

```typescript
// Prairie Cardのキャッシュ
const cache = new Map<string, PrairieProfile>();
const CACHE_TTL = 1000 * 60 * 5; // 5分

// APIレスポンスのキャッシュヘッダー
response.headers.set('Cache-Control', 'public, max-age=300');
```

### コード分割

```typescript
// 動的インポート
const ShareModal = dynamic(() => import('./ShareModal'), {
  loading: () => <Loading />,
});
```

## セキュリティ

### 環境変数の管理

- **絶対にコミットしない**: `.env.local`
- **クライアントに露出させない**: APIキーなど
- **NEXT_PUBLIC_プレフィックス**: クライアント側で使用する変数のみ

### APIセキュリティ

```typescript
// レート制限
await checkRateLimit(request);

// 入力検証
const validated = schema.parse(requestBody);

// エラーハンドリング
try {
  // 処理
} catch (error) {
  // センシティブな情報は返さない
  return createErrorResponse('Internal server error');
}
```

## リリース

### 本番ビルド

```bash
# ビルド
npm run build

# ローカルで本番環境を確認
npm start
```

### デプロイ

#### Vercel

```bash
# Vercel CLIでデプロイ
vercel --prod
```

#### Docker

```bash
# イメージをビルド
docker build -t cnd2-app .

# コンテナを起動
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  cnd2-app
```

## トラブルシューティング

### よくある質問

**Q: Prairie Cardが取得できない**
A: Prairie CardのURLが正しいか、Prairie Cardサービスが稼働しているか確認してください。

**Q: OpenAI APIが動作しない**
A: `.env.local`にAPIキーが正しく設定されているか確認してください。

**Q: テストが遅い**
A: `--maxWorkers=50%`オプションを使用してテストを並列実行してください。

### サポート

問題が解決しない場合は、[GitHub Issues](https://github.com/tsukaman/cnd2-app/issues)で報告してください。

## リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)