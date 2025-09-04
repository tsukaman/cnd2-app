# 診断エラー調査ログ (2025-09-05)

## 概要
Cloudflare環境で発生した診断エラー「Failed to generate diagnosis」の調査と解決過程を記録します。

## エラーの症状

### 発生状況
- **環境**: Cloudflare Pages（本番環境）
- **URL**: https://cnd2-app.pages.dev
- **エラーメッセージ**: "Failed to generate diagnosis"
- **影響範囲**: 
  - 診断API (`/api/diagnosis`) - 500エラー
  - Prairie Card API (`/api/prairie`) - Error 1101

### エラーログ
```javascript
[Diagnosis API] Error:
TypeError: generateAstrologicalDiagnosis is not a function
```

## 調査プロセス

### 1. 環境変数の確認（PR #184）

#### デバッグエンドポイントの作成
```javascript
// /functions/api/debug-env.js
export async function onRequestGet({ request, env }) {
  // 認証ヘッダーチェック
  const debugHeader = request.headers.get('X-Debug-Secret');
  if (debugHeader !== 'cnd2-debug-2025') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403
    });
  }
  
  // 環境変数の状態を返す
  return new Response(JSON.stringify({
    apiKeys: {
      OPENAI_API_KEY: {
        exists: !!env.OPENAI_API_KEY,
        isValidFormat: env.OPENAI_API_KEY?.startsWith('sk-')
      }
    },
    kvNamespaces: {
      DIAGNOSIS_KV: !!env.DIAGNOSIS_KV
    }
  }));
}
```

#### 確認結果
✅ **OPENAI_API_KEY**: 正しく設定されている
✅ **DIAGNOSIS_KV**: KVネームスペースがバインドされている
✅ **DEBUG_MODE**: `true`に設定されている

### 2. エラーの根本原因特定

#### Cloudflare Real-time Logsから取得したエラー
```json
{
  "logs": [
    {
      "message": [
        "[Diagnosis API] Error:",
        "TypeError: generateAstrologicalDiagnosis is not a function"
      ],
      "level": "error"
    }
  ],
  "response": {
    "status": 500
  }
}
```

#### 問題の発見
1. **ファイル構造の問題**:
   ```
   functions/api/
   ├── diagnosis.js          # 正しい実装（generateFortuneDiagnosis）
   └── diagnosis/            # 古いディレクトリ
       └── index.js          # 古い実装（generateAstrologicalDiagnosis）
   ```

2. **Cloudflare Pagesのルーティング優先順位**:
   - ディレクトリ (`diagnosis/index.js`) が単一ファイル (`diagnosis.js`) より優先される
   - 古い実装が実行され、存在しない関数を呼び出していた

## 解決方法（PR #186）

### 実施内容
1. 古い `/functions/api/diagnosis/` ディレクトリを削除
2. 削除したファイル:
   - `functions/api/diagnosis/index.js` (208行)
   - `functions/api/diagnosis/openai-diagnosis.js` (304行)
   - `functions/api/diagnosis/__tests__/openai-diagnosis.test.js` (256行)

### 結果
- ✅ 診断APIが正常動作
- ✅ 768行のコード削除でメンテナンス性向上
- ✅ Claude Review評価: ⭐⭐⭐⭐⭐ (5.0/5.0)

## 学んだ教訓

### 1. Cloudflare Pagesのルーティング理解
- ディレクトリベースのルーティングが単一ファイルより優先される
- ファイル名の重複は予期しない動作を引き起こす

### 2. デバッグプロセスの重要性
- 環境変数の確認から始める
- リアルタイムログで詳細なエラーメッセージを取得
- 一時的なデバッグエンドポイントは強力なツール

### 3. コードベースの整理
- 古いコードは削除する
- ディレクトリ構造は明確に保つ
- 重複を避ける

## セキュリティ考慮事項

### デバッグエンドポイント（PR #184, #187）
1. **追加時のセキュリティ対策**:
   - 認証ヘッダー必須
   - APIキー情報の最小化
   - 包括的なフィルタリング

2. **削除の重要性**:
   - 調査完了後は速やかに削除
   - セキュリティリスクの排除

## 関連PR

- [#182](https://github.com/tsukaman/cnd2-app/pull/182): 診断エラーのデバッグログ追加
- [#184](https://github.com/tsukaman/cnd2-app/pull/184): デバッグエンドポイントの追加
- [#186](https://github.com/tsukaman/cnd2-app/pull/186): 診断APIエラーの修正
- [#187](https://github.com/tsukaman/cnd2-app/pull/187): デバッグエンドポイントの削除

## タイムライン

- **2025-09-04 18:00**: エラー報告受領
- **2025-09-04 19:38**: デバッグエンドポイント追加（PR #184）
- **2025-09-04 19:41**: 環境変数の正常性確認
- **2025-09-04 20:00**: エラーの根本原因特定
- **2025-09-04 20:10**: 修正デプロイ（PR #186）
- **2025-09-04 20:12**: 診断機能の正常動作確認
- **2025-09-04 20:15**: デバッグエンドポイント削除（PR #187）

## 今後の改善提案

1. **CI/CDパイプライン強化**:
   - 古いファイル検出の自動化
   - ディレクトリ構造の検証

2. **監視強化**:
   - エラーレートのアラート設定
   - 定期的なヘルスチェック

3. **ドキュメント改善**:
   - Cloudflare Pagesのルーティング仕様明記
   - トラブルシューティングガイド作成

---

*最終更新: 2025-09-05*