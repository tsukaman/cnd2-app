# CND² API Documentation

## 概要

CND² APIはNext.js App Routerを使用したRESTful APIです。すべてのAPIエンドポイントには以下の共通機能が実装されています：

- **レート制限**: 10リクエスト/分 (IPアドレス別)
- **エラーハンドリング**: 構造化されたエラーレスポンス
- **リクエストID**: トレーサビリティのためのユニークID
- **ロギング**: 構造化ログ出力
- **Edge Runtime**: Cloudflare Workers互換の実装
- **HTML Sanitization**: Prairie Card解析時のXSS対策

## 基本情報

### ベースURL
```
開発環境: http://localhost:3000/api
本番環境: https://cnd2.cloudnativedays.jp/api
Cloudflare Pages Functions: https://cnd2.cloudnativedays.jp/functions/api
```

### 認証
現在、認証は不要ですが、レート制限が適用されます。

### レスポンスヘッダー
すべてのレスポンスには以下のヘッダーが含まれます：

```http
X-Request-ID: <UUID>
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: <Unix timestamp>
```

## エンドポイント

### ランタイム範囲

このAPIはEdge Runtime互換のため、以下の環境で動作します：

- **Next.js API Routes** (開発環境)
- **Cloudflare Workers** (本番環境)
- **Vercel Edge Runtime**

### APIタイムアウト

すべてのAPIリクエストには10秒のタイムアウトが設定されています。

### 診断API

#### POST /api/diagnosis (Next.js API Routes)
#### POST /functions/api/diagnosis (Cloudflare Pages Functions)

Prairie Cardのプロフィール情報から相性診断を生成します。

**エンドポイントの選択:**
- **開発環境**: `/api/diagnosis` (Next.js API Routes)
- **本番環境**: `/functions/api/diagnosis` (Cloudflare Pages Functions + KVストレージ)

**機能:**
- **AI診断**: OpenAI GPT-4o-miniによるAIパワード診断 (環境変数で切り替え可能)
- **フォールバック**: AI失敗時はルールベース診断に自動切り替え
- **データ永続化**: Cloudflare Workers KVで結果を保存 (7日間自動削除)
- **レート制限**: IPアドレス別の制限 (10リクエスト/分)

##### リクエスト

```http
POST /api/diagnosis
Content-Type: application/json
```

```json
{
  "profiles": [
    {
      "basic": {
        "name": "エンジニア太郎",
        "title": "バックエンドエンジニア",
        "company": "CloudNative Inc.",
        "bio": "Kubernetesが好きです",
        "avatar": "https://example.com/avatar.png"
      },
      "skills": ["Kubernetes", "Go", "Docker"],
      "interests": ["Cloud Native", "DevOps"],
      "social": {
        "twitter": "engineer_taro",
        "github": "engineer-taro"
      }
    },
    {
      "basic": {
        "name": "開発花子",
        "title": "フロントエンドエンジニア",
        "company": "Web Dev Co.",
        "bio": "Reactが得意です"
      },
      "skills": ["React", "TypeScript", "Next.js"],
      "interests": ["Web Performance", "UX"]
    }
  ],
  "mode": "duo"
}
```

##### レスポンス

###### 成功時 (200 OK)

```json
{
  "success": true,
  "data": {
    "result": {
      "id": "abc123def456",
      "mode": "duo",
      "type": "クラウドネイティブ・イノベーター",
      "compatibility": 85,
      "summary": "エンジニア太郎さんと開発花子さんは、クラウドネイティブ技術への情熱を共有する素晴らしいパートナーです。",
      "strengths": [
        "技術的な興味の共通点が多い",
        "学習意欲が高い組み合わせ",
        "イノベーションを推進する相性"
      ],
      "opportunities": [
        "一緒にOSSプロジェクトに貢献",
        "技術ブログの共同執筆",
        "ハッカソンでのチーム参加"
      ],
      "advice": "お互いの専門分野を活かしながら、新しい技術にチャレンジしてみましょう。",
      "participants": [
        {
          "basic": {
            "name": "エンジニア太郎",
            "title": "バックエンドエンジニア",
            "company": "CloudNative Inc.",
            "bio": "Kubernetesが好きです"
          },
          "details": {
            "skills": ["Kubernetes", "Go", "Docker"],
            "interests": ["Cloud Native", "DevOps"]
          }
        }
      ],
      "createdAt": "2025-08-26T12:00:00Z",
      "aiPowered": true
    },
    "aiPowered": true
  }
}
```

**レスポンスフィールドの説明:**

- `result.aiPowered`: OpenAIによるAI診断が使用されたかどうか
- `result.type`: 診断タイプ (例: "クラウドネイティブ・イノベーター")
- `result.compatibility`: 相性スコア (70-100)
- `result.mode`: 診断モード ("duo" | "group")
- `aiPowered`: トップレベルのAIパワードフラグ

```
```

###### エラー時

```json
{
  "success": false,
  "error": "Failed to generate diagnosis"
}
```

##### パラメータ

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| profiles | PrairieProfile[] | Yes | 診断対象のプロフィール配列（2-6人） |
| mode | "duo" \| "group" | Yes | 診断モード（duo: 2人、group: 3-6人） |

### Prairie Card API

#### POST /api/prairie (Next.js API Routes)
#### POST /functions/api/prairie (Cloudflare Pages Functions)

Prairie CardのURLからプロフィール情報を取得、またはHTMLコンテンツを直接解析します。

##### リクエスト

```http
POST /api/prairie
Content-Type: application/json
```

**URLでプロフィールを取得:**
```json
{
  "url": "https://my.prairie.cards/u/username"
}
```

**HTMLコンテンツを直接解析:**
```json
{
  "html": "<html><body>...</body></html>"
}
```

##### レスポンス

###### 成功時 (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "Alice Johnson",
    "bio": "DevOps Engineer passionate about Kubernetes and cloud infrastructure",
    "title": "Senior DevOps Engineer",
    "company": "TechCorp",
    "interests": ["Kubernetes", "Terraform", "GitOps", "Monitoring"],
    "skills": ["Kubernetes", "Docker", "AWS", "Terraform", "Prometheus"],
    "tags": ["#DevOps", "#CloudNative", "#SRE", "#K8s"],
    "twitter": "https://twitter.com/alice_devops",
    "github": "https://github.com/alice",
    "linkedin": "https://linkedin.com/in/alice-johnson"
  },
  "timestamp": "2025-08-26T12:00:00Z"
}
```

##### パラメータ

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| url | string | No* | Prairie CardのプロフィールURL (HTTPSのみ、許可されたホストのみ) |
| html | string | No* | Prairie CardのHTMLコンテンツ (直接解析用) |

*urlまたはhtmlのいずれかが必須です。

##### URL検証ルール

- **プロトコル**: HTTPSのみ許可
- **許可されたホスト**:
  - `prairie.cards`
  - `my.prairie.cards`

##### HTMLサニタイゼーション

HTMLコンテンツはセキュリティのため自動的にサニタイズされます：

- **除去されるタグ**: `<script>`, `<style>`, `<iframe>`
- **除去される属性**: すべてのイベントハンドラ (`onclick`, `onload`など)
- **エスケープ処理**: すべてのテキストコンテンツ

##### テストプロフィールURL (開発環境用)

開発環境では以下のテストURLが利用できます：

```
https://my.prairie.cards/u/alice
https://my.prairie.cards/u/bob
```

これらのURLはモックデータを返し、APIのテストに使用できます。

### 診断結果取得API

#### GET /api/results/[id] (Next.js API Routes)
#### GET /functions/api/results/[id] (Cloudflare Pages Functions)

保存された診断結果を取得します。

##### リクエスト

```http
GET /api/results/abc123def456
```

##### レスポンス

###### 成功時 (200 OK)

```json
{
  "success": true,
  "data": {
    "result": {
      "id": "abc123def456",
      "mode": "duo",
      "type": "クラウドネイティブ・イノベーター",
      "compatibility": 85,
      "summary": "診断結果のサマリー",
      "strengths": ["..."],
      "opportunities": ["..."],
      "advice": "アドバイス",
      "participants": [...],
      "createdAt": "2025-08-26T12:00:00Z",
      "aiPowered": true
    }
  }
}
```

###### エラー時 (404 Not Found)

```json
{
  "success": false,
  "error": "Result not found"
}
```

#### DELETE /api/results/[id]

保存された診断結果を削除します。

##### リクエスト

```http
DELETE /api/results/abc123def456
```

##### レスポンス

```json
{
  "success": true,
  "data": {
    "message": "Result deleted successfully"
  }
}
```
```

## エラーハンドリング

### エラーレスポンス形式

すべてのエラーレスポンスは以下の形式で返されます：

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### 一般的なHTTPステータスコード

| HTTPステータス | 説明 | 例 |
|--------------|------|---------|
| 400 | リクエストパラメータが不正 | `At least 2 profiles are required` |
| 429 | レート制限に達した | `Too many requests. Please try again later.` |
| 500 | サーバー内部エラー | `Failed to generate diagnosis` |
| 502 | 外部サービスエラー | `Prairie Cardの取得に失敗しました` |

## レート制限

すべてのAPIエンドポイントには以下のレート制限が適用されます：

- **制限**: 10リクエスト/分 (IPアドレス別)
- **ウィンドウ**: 60秒
- **識別方法**: IPアドレス (`x-forwarded-for` または `x-real-ip` ヘッダー)
- **実装**: Edge Runtime互換のインメモリストレージ

制限に達した場合、以下のレスポンスが返されます：

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1693900800
```

```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

## 型定義

### PrairieProfile

```typescript
interface PrairieProfile {
  basic: {
    name: string;
    title?: string;
    company?: string;
    bio?: string;
    avatar?: string;
  };
  skills?: string[];
  interests?: string[];
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}
```

### DiagnosisResult

```typescript
interface DiagnosisResult {
  id: string;
  mode: 'duo' | 'group';
  type: string;
  compatibility: number;
  summary: string;
  strengths: string[];
  opportunities: string[];
  advice: string;
  participants: PrairieProfile[];
  createdAt: string;
  aiPowered?: boolean;
  // Legacy fields for backward compatibility
  score?: number;
  message?: string;
  conversationStarters?: string[];
  hiddenGems?: string;
  shareTag?: string;
}
```

## SDK/クライアント例

### JavaScript/TypeScript

```typescript
// 診断を生成
async function generateDiagnosis(profiles: PrairieProfile[], mode: 'duo' | 'group') {
  const response = await fetch('/api/diagnosis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profiles, mode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate diagnosis');
  }

  return response.json();
}

// Prairie Cardを取得 (URL指定)
async function fetchPrairieCard(url: string) {
  const response = await fetch('/api/prairie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch Prairie Card');
  }

  return response.json();
}

// Prairie Cardを取得 (HTML直接指定)
async function parsePrairieCardHTML(html: string) {
  const response = await fetch('/api/prairie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse Prairie Card HTML');
  }

  return response.json();
}

// 診断結果取得
async function getDiagnosisResult(id: string) {
  const response = await fetch(`/api/results/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch diagnosis result');
  }

  return response.json();
}
```

### cURL

```bash
# 診断を生成 (Next.js API Routes)
curl -X POST http://localhost:3000/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [...],
    "mode": "duo"
  }'

# 診断を生成 (Cloudflare Pages Functions)
curl -X POST https://cnd2.cloudnativedays.jp/functions/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [...],
    "mode": "duo"
  }'

# Prairie Cardを取得 (URL指定)
curl -X POST https://cnd2.cloudnativedays.jp/api/prairie \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://my.prairie.cards/u/alice"
  }'

# Prairie Cardを取得 (HTML直接指定)
curl -X POST https://cnd2.cloudnativedays.jp/api/prairie \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html>...</html>"
  }'

# 診断結果取得
curl https://cnd2.cloudnativedays.jp/api/results/abc123def456
```

## セキュリティとパフォーマンス

### セキュリティ機能

- **HTMLサニタイゼーション**: Prairie Cardデータのサニタイズ (XSS対策)
- **URL検証**: HTTPSのみ、許可されたホストのみ
- **レート制限**: IPアドレス別のリクエスト制限
- **タイムアウト**: 10秒のタイムアウト設定

### パフォーマンス

- **Edge Runtime**: Cloudflare Workers互換の高速実行
- **KVストレージ**: 診断結果の永続化 (7日間自動削除)
- **AIフォールバック**: AI失敗時のルールベース診断
- **キャッシュ機構**: Prairie Cardデータの高速取得

## 変更履歴

### v1.2.0 (2025-08-26) - Current
- AI診断機能実装 (OpenAI GPT-4o-mini)
- Edge Runtime互換性実装
- Cloudflare Pages Functions対応
- HTMLサニタイゼーション強化
- レート制限を10リクエスト/分に調整
- KVストレージ連携
- 診断結果取得・Delete API追加

### v1.0.0 (2025-08-26)
- 初回リリース
- 診断API実装
- Prairie Card連携
- レート制限実装