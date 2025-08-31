# DOMPurify Integration Analysis

## 現状の実装

### フロントエンド（✅ 実装済み）
- `src/lib/sanitizer.ts` でDOMPurifyを使用
- クライアントサイドでHTMLサニタイゼーションを実施
- Prairie Cardデータの各フィールドを適切にサニタイズ

### バックエンド / Edge Runtime（現状）
- `functions/utils/prairie-parser.js` では正規表現ベースの解析
- DOMPurifyは使用不可（DOM環境が必要なため）
- Edge Runtime環境での制約

## DOMPurify導入の検討結果

### 1. Edge Runtime環境での制約

**問題点:**
- Cloudflare Pages FunctionsはEdge Runtime環境
- DOMPurifyはDOM APIに依存（`window`, `document`が必要）
- Node.js環境でもjsdomなどの仮想DOM実装が必要

**結論:**
- Edge RuntimeでのDOMPurify直接利用は**不可能**

### 2. 代替アプローチの評価

#### オプション1: jsdom + DOMPurify（❌ 不採用）
```javascript
// Edge Runtimeでは動作しない
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = require('dompurify')(window);
```
- **理由:** jsdomはNode.js固有のAPIを使用し、Edge Runtime非対応

#### オプション2: linkedom（❌ 不採用）
```javascript
// より軽量なDOM実装だがEdge Runtime非対応
const { parseHTML } = require('linkedom');
```
- **理由:** Edge Runtime環境では利用不可

#### オプション3: sanitize-html（❌ 不採用）
```javascript
const sanitizeHtml = require('sanitize-html');
```
- **理由:** Node.js依存、Edge Runtime非対応

### 3. 現在の実装の妥当性評価

**Prairie Parser（正規表現ベース）の利点:**
- ✅ Edge Runtime完全対応
- ✅ 高速（パフォーマンステストで実証済み）
- ✅ メモリ効率的
- ✅ ReDoS攻撃への対策実装済み

**セキュリティ対策:**
1. **入力検証:** Prairie Card URLのHTTPS強制とドメイン制限
2. **出力サニタイズ:** フロントエンドでDOMPurify適用
3. **長さ制限:** 各フィールドに適切な文字数制限
4. **エスケープ:** 必要に応じてescapeHtml関数利用可能

## 推奨アーキテクチャ

```
[Prairie Card HTML]
       ↓
[Edge Runtime: prairie-parser.js]
  - 正規表現による安全な抽出
  - HTMLタグの除去
  - 構造化データ生成
       ↓
[Frontend: React Components]
  - DOMPurifyによるサニタイズ
  - 安全なレンダリング
```

## 実装ガイドライン

### バックエンド（Edge Runtime）
```javascript
// prairie-parser.js
function parseFromHTML(html) {
  // 1. HTMLタグを含まない純粋なテキスト抽出
  // 2. 構造化データとして返却
  // 3. フロントエンドでのサニタイズを前提
}
```

### フロントエンド
```typescript
// React Component
import { sanitizer } from '@/lib/sanitizer';

function PrairieCardDisplay({ data }) {
  // DOMPurifyでサニタイズ
  const safeName = sanitizer.sanitizeText(data.name);
  const safeBio = sanitizer.sanitizeHTML(data.bio);
  
  return (
    <div>
      <h1>{safeName}</h1>
      <div dangerouslySetInnerHTML={{ __html: safeBio }} />
    </div>
  );
}
```

## 結論

### 現在の実装を維持すべき理由

1. **技術的制約:** Edge RuntimeでDOMPurifyは動作不可
2. **パフォーマンス:** 現在の正規表現実装は高速で効率的
3. **セキュリティ:** 多層防御により十分なセキュリティを確保
   - バックエンド: 安全な抽出
   - フロントエンド: DOMPurifyでサニタイズ

### 今後の改善提案

1. **定期的なセキュリティ監査**
   - 正規表現パターンの見直し
   - 新たな攻撃手法への対応

2. **テストの拡充**
   - XSS攻撃パターンのテストケース追加
   - エッジケースの網羅

3. **ドキュメント整備**
   - セキュリティ設計の明文化
   - 開発者向けガイドライン

## 参考資料

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Cloudflare Workers Runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)
- [Edge Runtime Limitations](https://edge-runtime.vercel.app/features/available-apis)