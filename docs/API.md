# CND² API Documentation

## 概要

CND² APIはNext.js App Routerを使用したRESTful APIです。すべてのAPIエンドポイントには以下の共通機能が実装されています：

- **レート制限**: 100リクエスト/分
- **エラーハンドリング**: 構造化されたエラーレスポンス
- **リクエストID**: トレーサビリティのためのユニークID
- **ロギング**: 構造化ログ出力

## 基本情報

### ベースURL
```
開発環境: http://localhost:3000/api
本番環境: https://cnd2.cloudnativedays.jp/api
```

### 認証
現在、認証は不要ですが、レート制限が適用されます。

### レスポンスヘッダー
すべてのレスポンスには以下のヘッダーが含まれます：

```http
X-Request-ID: <UUID>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: <Unix timestamp>
```

## エンドポイント

### 診断API

#### POST /api/diagnosis

Prairie Cardのプロフィール情報から相性診断を生成します。

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
      "id": "abc123",
      "score": 85,
      "summary": "技術スタックは異なりますが、Cloud Nativeへの情熱が共通しています",
      "analysis": {
        "strengths": [
          "フルスタック開発が可能",
          "モダンな技術スタック"
        ],
        "opportunities": [
          "知識の相互補完",
          "新しい技術の学習機会"
        ],
        "challenges": [
          "技術領域の違い"
        ],
        "details": [
          "バックエンドとフロントエンドの専門性が補完関係にあります",
          "Cloud Native技術への関心が共通しています"
        ]
      },
      "advice": [
        "定期的な技術共有会を開催することをお勧めします",
        "共同でフルスタックプロジェクトに取り組むと良いでしょう"
      ],
      "createdAt": "2025-08-26T12:00:00Z"
    },
    "aiPowered": true
  }
}
```

###### エラー時

```json
{
  "success": false,
  "error": "診断の生成に失敗しました",
  "code": "INTERNAL_ERROR",
  "requestId": "xyz789"
}
```

##### パラメータ

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| profiles | PrairieProfile[] | Yes | 診断対象のプロフィール配列（2-6人） |
| mode | "duo" \| "group" | Yes | 診断モード（duo: 2人、group: 3-6人） |

### Prairie Card API

#### POST /api/prairie

Prairie CardのURLからプロフィール情報を取得します。

##### リクエスト

```http
POST /api/prairie
Content-Type: application/json
```

```json
{
  "url": "https://prairie-card.cloudnativedays.jp/u/username"
}
```

##### レスポンス

###### 成功時 (200 OK)

```json
{
  "success": true,
  "data": {
    "profile": {
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
    "cacheStats": {
      "hit": false,
      "size": 1,
      "maxSize": 100
    }
  }
}
```

##### パラメータ

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| url | string | Yes | Prairie CardのプロフィールURL |

#### DELETE /api/prairie

Prairie Cardのキャッシュをクリアします。

##### リクエスト

```http
DELETE /api/prairie
```

##### レスポンス

```json
{
  "success": true,
  "data": {
    "message": "キャッシュをクリアしました",
    "timestamp": "2025-08-26T12:00:00Z"
  }
}
```

## エラーコード

APIは以下のエラーコードを返す可能性があります：

| コード | HTTPステータス | 説明 |
|--------|--------------|------|
| VALIDATION_ERROR | 400 | リクエストパラメータが不正 |
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソースが見つからない |
| RATE_LIMIT_ERROR | 429 | レート制限に達した |
| INTERNAL_ERROR | 500 | サーバー内部エラー |
| SERVICE_UNAVAILABLE | 503 | サービス利用不可 |
| TIMEOUT_ERROR | 504 | タイムアウト |
| EXTERNAL_SERVICE_ERROR | 502 | 外部サービスエラー |

## レート制限

すべてのAPIエンドポイントには以下のレート制限が適用されます：

- **制限**: 100リクエスト/分
- **ウィンドウ**: 60秒
- **識別方法**: IPアドレス + User-Agent

制限に達した場合、以下のレスポンスが返されます：

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1693900800
```

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in 45 seconds.",
  "code": "RATE_LIMIT_ERROR",
  "retryAfter": 45
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
  score: number;
  summary: string;
  analysis: {
    strengths: string[];
    opportunities: string[];
    challenges: string[];
    details: string[];
  };
  advice: string[];
  createdAt: string;
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

// Prairie Cardを取得
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
```

### cURL

```bash
# 診断を生成
curl -X POST https://cnd2.cloudnativedays.jp/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [...],
    "mode": "duo"
  }'

# Prairie Cardを取得
curl -X POST https://cnd2.cloudnativedays.jp/api/prairie \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://prairie-card.cloudnativedays.jp/u/username"
  }'
```

## 変更履歴

### v1.0.0 (2025-08-26)
- 初回リリース
- 診断API実装
- Prairie Card連携
- レート制限実装
- OpenAI統合