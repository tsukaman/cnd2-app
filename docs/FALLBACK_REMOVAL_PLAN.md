# フォールバック診断機能の段階的削除計画

*作成日: 2025-09-01*  
*更新日: 2025-09-01 - PR #130で部分的に実施済み*

## 概要

PR #115（診断エンジン大幅更新）のマージ後、フォールバック診断機能を段階的に削除する計画です。
v1.4.0で環境変数制御を実装したことで、安全な移行が可能になりました。

> **📝 更新情報**: PR #130にて、ルールベースの診断エンジンは削除され、OpenAI GPT-4o-miniを使用する診断エンジンに統合されました。

## 現状

### v1.4.0での実装状況
- `ENABLE_FALLBACK`環境変数による制御（デフォルト: false）
- 開発環境と本番環境で異なるスコア範囲
- エラー時の即座検知機能

### 関連ファイル
1. **設定ファイル**
   - `/src/lib/constants/fallback.ts`
   - `/functions/utils/fallback-config.js`

2. **診断エンジン**
   - `/src/lib/diagnosis-engine.ts` - generateMockDiagnosis()
   - `/src/lib/diagnosis-engine-unified.ts` - フォールバック処理
   - `/src/lib/diagnosis-engine-v3.ts` - フォールバック処理
   - `/functions/api/diagnosis.js` - OpenAI診断エンジンを使用（PR #130で更新）
   - ~~`/functions/api/diagnosis-multi.js`~~ - **削除済み（PR #130）**
   - ~~`/functions/api/diagnosis-v3.js`~~ - **削除済み（PR #130）**
   - ~~`/functions/api/diagnosis-v4.js`~~ - **削除済み（PR #130）**

3. **テストファイル**
   - `/src/lib/constants/__tests__/fallback.test.ts`
   - `/functions/utils/__tests__/fallback-config.test.js`

## 削除計画

### フェーズ1: PR #115マージ直後（v1.5.0）
**目的**: 新診断エンジンの安定性確認

1. **環境変数の維持**
   ```bash
   ENABLE_FALLBACK=false  # デフォルトのまま
   ```

2. **コードの維持**
   - フォールバック機能は残すが無効化状態を維持
   - エラー監視を強化

3. **期間**: 2週間

### フェーズ2: 段階的無効化（v1.5.1）
**目的**: フォールバック依存の完全排除

1. **警告追加**
   ```typescript
   if (process.env.ENABLE_FALLBACK === 'true') {
     console.warn('[DEPRECATED] ENABLE_FALLBACK will be removed in v1.6.0');
   }
   ```

2. **ドキュメント更新**
   - CHANGELOG.mdに廃止予定を記載
   - 環境変数ガイドに警告追加

3. **期間**: 2週間

### フェーズ3: コード削除（v1.6.0）
**目的**: 完全削除

1. **削除対象**
   - [ ] generateMockDiagnosis関数群
   - [ ] generateMockGroupDiagnosis関数群
   - [ ] フォールバック設定ファイル
   - [ ] ENABLE_FALLBACK環境変数の参照
   - [ ] フォールバック関連テスト

2. **リファクタリング**
   ```typescript
   // Before
   if (!this.isConfigured()) {
     if (isFallbackAllowed()) {
       return this.generateMockDiagnosis(profiles);
     }
     throw new Error('OpenAI API key not configured');
   }

   // After
   if (!this.isConfigured()) {
     throw new Error('OpenAI API key not configured');
   }
   ```

3. **エラーハンドリング改善**
   - より詳細なエラーメッセージ
   - ユーザーフレンドリーなエラー画面

## チェックリスト

### フェーズ1
- [ ] PR #115のマージ確認
- [ ] 新診断エンジンの動作確認
- [ ] エラーレート監視（< 1%）
- [ ] パフォーマンス測定

### フェーズ2
- [ ] 廃止予定の告知
- [ ] 警告ログの実装
- [ ] ドキュメント更新
- [ ] 依存コードの特定

### フェーズ3
- [ ] フォールバックコード削除
- [ ] テスト削除・更新
- [ ] 環境変数ドキュメント更新
- [ ] CHANGELOG.md更新
- [ ] 最終動作確認

## リスクと対策

### リスク1: API障害時の対応
**対策**: 
- 適切なエラーメッセージ表示
- リトライ機構の強化
- サーキットブレーカーパターンの実装検討

### リスク2: 開発環境での不便
**対策**:
- モック用の別エンドポイント提供
- 開発用APIキーの共有（制限付き）

### リスク3: 移行期間中の混乱
**対策**:
- 明確なドキュメント
- 段階的な移行
- 十分なテスト期間

## タイムライン

```
2025-09-01  v1.4.0  環境変数制御実装（完了）
2025-09-XX  v1.5.0  PR #115マージ、フェーズ1開始
2025-10-XX  v1.5.1  フェーズ2（警告追加）
2025-11-XX  v1.6.0  フェーズ3（完全削除）
```

## 成功指標

1. **エラーレート**: < 0.1%
2. **APIレスポンス時間**: < 2秒（p95）
3. **ユーザー満足度**: 維持または向上
4. **開発効率**: コードベースの簡素化

## 関連ドキュメント

- [PR #115: 診断エンジン大幅更新](https://github.com/tsukaman/cnd2-app/pull/115)
- [PR #116: フォールバック診断の環境別制御](https://github.com/tsukaman/cnd2-app/pull/116)
- [環境変数設定ガイド](./ENVIRONMENT_VARIABLES.md)
- [イベント運用ガイド](./EVENT_OPERATION_GUIDE.md)

---

*このドキュメントは、フォールバック機能の安全な削除を保証するための計画書です。*
*各フェーズの実施前に、チーム内でレビューを行ってください。*