# メトリクスダッシュボード開発ガイド

## 概要

管理者向けのメトリクスダッシュボードは、システムのパフォーマンスと利用状況を監視するための機能です。

## アーキテクチャ

### 本番環境
- **エンドポイント**: Cloudflare Functions (`/api/admin/metrics`)
- **データストア**: Cloudflare KV Namespace
- **認証**: Bearer Token (環境変数 `ADMIN_SECRET`)

### 開発環境
- **エンドポイント**: Next.js API Routes (`/api/admin/metrics`)
- **データ**: モックデータ生成
- **認証**: 常に成功（開発用）

## 機能

### 自動更新
- 30秒ごとにメトリクスを自動更新
- **パフォーマンス最適化**: Page Visibility APIを使用
  - ページが表示されている時のみ更新
  - タブが非アクティブの時は更新を停止
  - ページが再度アクティブになった時に即座に更新

### メトリクス表示
1. **Prairie API**
   - 成功/エラー数
   - 成功率

2. **Diagnosis API**
   - 成功/エラー数  
   - 成功率

3. **キャッシュ**
   - ヒット/ミス数
   - ヒット率

## 開発環境セットアップ

### 1. 環境変数設定
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. メトリクスダッシュボードへアクセス
```
http://localhost:3000/admin/metrics
```

## 開発用モックデータ

開発環境では、以下の機能がシミュレートされます：

- **ランダムメトリクス生成**: リアルなデータパターン
- **レイテンシシミュレーション**: 100-500ms
- **エラーシミュレーション**: 5%の確率でエラー
- **部分データ警告**: 10%の確率で警告表示

## パフォーマンス考慮事項

### 自動更新の最適化
```javascript
// ページ可視性の監視
document.addEventListener('visibilitychange', handleVisibilityChange);

// 非アクティブ時は更新停止
if (document.visibilityState === 'hidden') {
  clearInterval(interval);
}
```

### メモリリーク防止
- コンポーネントアンマウント時にインターバルクリア
- イベントリスナーの適切な削除

## セキュリティ

詳細は[管理者認証セキュリティ仕様](../security/admin-authentication.md)を参照。

## トラブルシューティング

### 開発環境でメトリクスが表示されない
1. Next.js API Routeが正しく作成されているか確認
2. 開発サーバーが起動しているか確認
3. ブラウザのコンソールでエラーを確認

### 自動更新が動作しない
1. Page Visibility APIのサポートを確認
2. ブラウザのタブがアクティブか確認
3. ネットワーク接続を確認

## 今後の改善予定

- [ ] WebSocketによるリアルタイム更新
- [ ] メトリクスのグラフ表示
- [ ] 履歴データの表示
- [ ] アラート機能の追加
- [ ] カスタムメトリクスの追加