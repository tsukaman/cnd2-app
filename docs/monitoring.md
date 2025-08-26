# Monitoring & Observability Guide

このドキュメントでは、CND²アプリケーションのモニタリングと可観測性について説明します。

## 📊 概要

CND²では以下のツールを使用して、アプリケーションの健全性とパフォーマンスを監視しています：

- **Sentry**: エラートラッキング、パフォーマンス監視
- **Cloudflare Analytics**: トラフィック分析、セキュリティ監視
- **Webpack Bundle Analyzer**: バンドルサイズ最適化
- **GitHub Actions**: CI/CDパイプライン監視

## 🔍 Sentry設定

### 初期セットアップ

1. [Sentry](https://sentry.io)でプロジェクトを作成
2. DSNを取得
3. 環境変数を設定

```bash
# .env.local
SENTRY_DSN=https://xxxxx@o4508811871485952.ingest.us.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o4508811871485952.ingest.us.sentry.io/xxxxx
SENTRY_ORG=your-org-name
SENTRY_PROJECT=cnd2-app
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxx
```

### 設定ファイル

#### `sentry.client.config.ts` (クライアントサイド)

```typescript
import * as Sentry from '@sentry/nextjs';
import { filterSentryError, configureSentryScope, getSentrySampleRate } from '@/lib/sentry-filters';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  const sampleRates = getSentrySampleRate();
  
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: sampleRates.tracesSampleRate,
    replaysSessionSampleRate: sampleRates.replaysSessionSampleRate,
    replaysOnErrorSampleRate: sampleRates.replaysOnErrorSampleRate,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    beforeSend: filterSentryError,
    initialScope: (scope) => {
      configureSentryScope(scope);
      return scope;
    },
  });
}
```

### エラーフィルタリング

`src/lib/sentry-filters.ts`で不要なエラーをフィルタリング：

```typescript
export function filterSentryError(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
  // ネットワークエラーのフィルタリング
  if (exception.type === 'NetworkError' && exception.value?.includes('my.prairie.cards')) {
    return null; // 外部サービスのエラーは記録しない
  }
  
  // ブラウザ拡張機能のエラーをフィルタ
  if (exception.value?.includes('extension://')) {
    return null;
  }
  
  // チャンクロードエラー（広告ブロッカー等）
  if (exception.type === 'ChunkLoadError') {
    return null;
  }
  
  return event;
}
```

### サンプリングレート設定

環境ごとに異なるサンプリングレート：

```typescript
export function getSentrySampleRate() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // パフォーマンストレース
    tracesSampleRate: isDevelopment ? 1.0 : isProduction ? 0.1 : 0.5,
    
    // セッションリプレイ（本番環境のみ）
    replaysSessionSampleRate: isProduction ? 0.1 : 0,
    replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
  };
}
```

## 📈 パフォーマンス監視

### Core Web Vitals

以下の指標を監視：

- **LCP (Largest Contentful Paint)**: 目標 < 2.5秒
- **FID (First Input Delay)**: 目標 < 100ms
- **CLS (Cumulative Layout Shift)**: 目標 < 0.1
- **TTFB (Time to First Byte)**: 目標 < 600ms

### Sentryでのパフォーマンス監視

```typescript
// トランザクション追跡
Sentry.startTransaction({
  name: 'diagnosis-generation',
  op: 'ai.diagnosis',
  data: {
    mode: diagnosisMode,
    profileCount: profiles.length,
  },
});

// パフォーマンススパン
const span = transaction.startChild({
  op: 'prairie.fetch',
  description: 'Fetch Prairie Card profile',
});
```

### バンドルサイズ分析

```bash
# バンドルアナライザーを実行
npm run analyze

# 結果を確認
# - 大きなチャンクを特定
# - 未使用のコードを検出
# - 最適化の機会を発見
```

最適化のガイドライン：

- チャンクサイズ: < 250KB（gzip後）
- 初期ロード: < 100KB（gzip後）
- 画像最適化: WebP形式、適切なサイズ
- コード分割: 動的インポートの活用

## 🚨 アラート設定

### Sentryアラートルール

1. **エラー率アラート**
   ```yaml
   条件: エラー率 > 5%
   期間: 5分間
   アクション: Slack通知、メール
   ```

2. **パフォーマンス劣化**
   ```yaml
   条件: P95レスポンスタイム > 3秒
   期間: 10分間
   アクション: Slack通知
   ```

3. **クラッシュ検出**
   ```yaml
   条件: 新規クラッシュ発生
   アクション: 即座にSlack通知、担当者にメンション
   ```

### Cloudflareアラート

Cloudflare Dashboardで設定：

- **オリジンエラー率**: > 5%で通知
- **5xxエラー**: > 1%で通知
- **DDoS攻撃**: 検出時即座に通知
- **Workers KV制限**: 80%到達で警告

## 📊 ダッシュボード

### Sentryダッシュボード

カスタムダッシュボードウィジェット：

1. **エラー概要**
   - エラー率の推移
   - トップエラー（頻度順）
   - 影響を受けるユーザー数

2. **パフォーマンス**
   - APIレスポンスタイム（P50, P95, P99）
   - 診断生成時間
   - Prairie Card取得時間

3. **リリース健全性**
   - クラッシュフリー率
   - セッション継続率
   - エラー率の変化

### Cloudflare Analytics

監視項目：

- **トラフィック**
  - リクエスト数
  - ユニークビジター
  - 地理的分布

- **パフォーマンス**
  - キャッシュヒット率
  - エッジレスポンスタイム
  - データ転送量

- **セキュリティ**
  - ブロックされたリクエスト
  - セキュリティイベント
  - CSP違反レポート

## 🔧 トラブルシューティング

### エラー調査手順

1. **Sentryでエラー詳細を確認**
   ```bash
   # Sentry CLIでエラーを検索
   sentry-cli issues list --project=cnd2-app
   ```

2. **セッションリプレイで再現**
   - ユーザーの操作を確認
   - エラー発生までの経路を特定
   - コンソールログを確認

3. **ブレッドクラムの分析**
   - APIコール
   - ユーザーアクション
   - コンソールメッセージ

### パフォーマンス問題の調査

1. **Sentryトランザクション分析**
   - ボトルネックの特定
   - スパンの詳細確認
   - データベースクエリ時間

2. **Lighthouse CI実行**
   ```bash
   npx lighthouse-ci autorun
   ```

3. **Chrome DevTools Profiler**
   - Performance記録
   - Memory使用量分析
   - Network waterfall確認

## 📝 ログ管理

### ログレベル

```typescript
// 開発環境
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG]', data);
  console.info('[INFO]', message);
  console.warn('[WARN]', warning);
  console.error('[ERROR]', error);
}

// 本番環境（Sentryに送信）
Sentry.captureMessage(message, 'info');
Sentry.captureException(error);
```

### 構造化ログ

```typescript
// APIログ
console.log({
  timestamp: new Date().toISOString(),
  requestId: req.headers['x-request-id'],
  method: req.method,
  url: req.url,
  statusCode: res.status,
  duration: endTime - startTime,
});
```

## 🎯 SLO（Service Level Objectives）

### 可用性
- **目標**: 99.9%（月間ダウンタイム < 43分）
- **測定**: Cloudflare監視 + Pingdom

### レスポンスタイム
- **目標**: P95 < 1秒、P99 < 3秒
- **測定**: Sentry Performance

### エラー率
- **目標**: < 1%
- **測定**: Sentry Error Tracking

### 診断成功率
- **目標**: > 95%（AI + フォールバック）
- **測定**: カスタムメトリクス

## 📚 ベストプラクティス

### エラー処理

```typescript
try {
  // 処理
} catch (error) {
  // コンテキスト付きでSentryに送信
  Sentry.withScope((scope) => {
    scope.setContext('diagnosis', {
      mode: diagnosisMode,
      profileCount: profiles.length,
    });
    scope.setLevel('error');
    Sentry.captureException(error);
  });
  
  // ユーザーへのフィードバック
  return handleError(error);
}
```

### パフォーマンス最適化

```typescript
// 重い処理の測定
const startTime = performance.now();
const result = await heavyOperation();
const duration = performance.now() - startTime;

// メトリクス送信
Sentry.metrics.distribution('heavy_operation.duration', duration, {
  tags: { operation: 'diagnosis' },
});
```

## 🔄 定期レビュー

### 週次レビュー
- エラー率の確認
- パフォーマンス指標の確認
- 未解決の問題の優先順位付け

### 月次レビュー
- SLO達成状況
- トレンド分析
- インシデントの振り返り
- 改善項目の計画

## 📖 参考資料

- [Sentry Documentation](https://docs.sentry.io/)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing/performance)