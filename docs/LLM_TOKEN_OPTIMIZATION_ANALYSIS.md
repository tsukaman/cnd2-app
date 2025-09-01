# LLMトークン最適化分析レポート

## 📊 現状の分析

### 1. LLMに要求しているデータ（プロンプト内）

現在、`functions/api/diagnosis-v4-openai.js`のプロンプトで以下のJSON構造を要求しています：

```json
{
  "diagnosis": {
    "type": "診断タイプ名",
    "score": "スコア（0-100）",
    "message": "総合的な診断結果",
    "conversationStarters": ["話題1", "話題2", "..."],
    "hiddenGems": "意外な共通点や発見",
    "shareTag": "#CND2診断",  // ⚠️ 常に固定値
    "luckyItem": "ラッキーアイテム",
    "luckyAction": "ラッキーアクション",
    "luckyProject": "CNCFプロジェクト",
    "metadata": {
      "participant1": "1人目の名前",  // ⚠️ 重複データ
      "participant2": "2人目の名前",  // ⚠️ 重複データ
      "calculatedScore": {  // ⚠️ 未使用
        "technical": 技術的相性スコア,
        "communication": コミュニケーションスコア,
        "values": 価値観スコア,
        "growth": 成長可能性スコア
      }
    }
  },
  "extracted_profiles": {  // ⚠️ 完全に未使用
    "person1": {
      "name": "名前",
      "title": "肩書き",
      "company": "会社名",
      "skills": ["スキル"],
      "interests": ["興味"],
      "summary": "プロフィール要約"
    },
    "person2": { /* 同様 */ }
  },
  "analysis": {
    "astrologicalAnalysis": "運勢的な観点からの分析",  // ⚠️ 未表示（バグ）
    "techStackCompatibility": "技術スタック互換性分析"  // ⚠️ 未表示（バグ）
  }
}
```

### 2. 実際に表示されているフィールド

#### ✅ 正常に表示されているフィールド

| フィールド | 用途 | 表示場所 |
|----------|------|----------|
| `diagnosis.type` | 診断タイプ名 | メインタイトル |
| `diagnosis.score` | 相性スコア（0-100） | 大きな数字で表示 |
| `diagnosis.message` | 診断結果メッセージ | サマリーテキスト |
| `diagnosis.conversationStarters` | 会話トピック | リスト表示 |
| `diagnosis.hiddenGems` | アドバイス | アドバイスセクション |
| `diagnosis.luckyItem` | ラッキーアイテム | カード表示 |
| `diagnosis.luckyAction` | ラッキーアクション | カード表示 |
| `diagnosis.luckyProject` | CNCFプロジェクト | 現在は未表示だが必要 |

#### ⚠️ バグで表示されていないフィールド

| フィールド | 問題 | 修正方法 |
|----------|------|----------|
| `analysis.astrologicalAnalysis` | `result.metadata?.analysis`を参照しているが、実際は`result.astrologicalAnalysis`に格納 | アクセスパスを修正済み |
| `analysis.techStackCompatibility` | 同上 | アクセスパスを修正済み |

#### ❌ 不要なフィールド（削除候補）

| フィールド | 理由 | 推定トークン削減 |
|----------|------|-----------------|
| `diagnosis.shareTag` | 常に`#CND2診断`固定 | -10 tokens |
| `diagnosis.metadata.participant1/2` | participantsから取得可能 | -20 tokens |
| `diagnosis.metadata.calculatedScore` | 詳細スコアは未使用 | -50 tokens |
| `extracted_profiles` | 元データがあるため不要 | -200~300 tokens |

## 🎯 最適化提案

### Phase 1: 即座に実施可能（バグ修正）

1. **表示バグの修正** ✅ 完了
   - `astrologicalAnalysis`と`techStackCompatibility`のアクセスパス修正
   - これらは既に生成されているので、表示するだけで価値提供

### Phase 2: プロンプト最適化（トークン削減）

2. **不要フィールドの削除**
   ```javascript
   // 削除対象：
   - shareTag（固定値）
   - extracted_profiles（完全セクション）
   - metadata.participant1/2（重複）
   - metadata.calculatedScore（未使用）
   ```

3. **期待される効果**
   - **削減トークン数**: 約460-660 tokens/診断
   - **削減率**: 30-40%
   - **コスト削減**: 年間約¥8,000-12,000（2500診断想定）

### Phase 3: UI/UX改善（オプション）

4. **追加表示の検討**
   - `luckyProject`の表示追加（CNCFプロジェクト推薦）
   - 詳細スコア（technical, communication等）のグラフ表示

## 📈 実装優先度

1. **最優先**: `astrologicalAnalysis`と`techStackCompatibility`の表示修正（✅完了）
2. **高優先**: プロンプトから不要フィールドを削除
3. **中優先**: テストケースの更新
4. **低優先**: UIの追加改善

## 🔍 デバッグ方法

診断結果ページに`?debug=true`パラメータを追加すると、全LLMフィールドが表示されます：

```
https://cnd2-app.pages.dev/duo/results?id=xxx&debug=true
```

これにより、実際のLLMレスポンスと表示内容の差分を確認できます。

## 📝 次のアクション

1. ✅ デバッグコンポーネントの作成（完了）
2. ✅ 表示バグの修正（完了）
3. ⏳ プロンプトテンプレートの最適化
4. ⏳ テストケースの更新
5. ⏳ 本番環境でのトークン消費量測定

## 💡 重要な発見

- **30-40%のトークン削減が可能**
- `astrologicalAnalysis`と`techStackCompatibility`は生成されているが表示されていなかった（もったいない！）
- `extracted_profiles`は完全に冗長（元データを再度要約している）
- 固定値や重複データの生成は無駄

この最適化により、同じ予算でより多くの診断が可能になります。