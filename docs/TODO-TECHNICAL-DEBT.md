# 技術的負債 TODO リスト

*最終更新: 2025-09-07 v1.11.1*

このドキュメントは、コードレビューで指摘された改善項目と技術的負債を記録し、将来の開発で対応すべき項目を管理するためのものです。

## 📊 優先度の定義

- 🔴 **高優先度**: 次のスプリントで対応すべき項目
- 🟡 **中優先度**: 2-3スプリント以内に対応したい項目  
- 🟢 **低優先度**: 時間があるときに対応する項目

## 🔴 高優先度タスク

### ~~1. プロフィール変換処理の共通化~~ ✅ 完了済み (2025-09-05)
**問題**: プロフィール変換ロジックが複数箇所に重複している

**解決案** (実装済み):
- `src/lib/utils/profile-converter.ts` - TypeScript版を作成 ✅
- `functions/utils/profile-converter.js` - JavaScript版を作成 ✅
- 両環境で共通関数（convertToFullProfile, convertProfilesToFullFormat等）を提供 ✅
- 全APIエンドポイントで共通モジュールを使用 ✅

**達成効果**: 
- コード重複の完全削減（約50行削除）
- 一元管理による保守性向上
- TypeScript/JavaScript両環境での互換性確保

---

### ~~2. デバッグログのセキュリティ強化~~ ✅ 完了済み (2025-09-05)
**問題**: `DEBUG_MODE`環境変数で詳細ログが有効化される仕組みが本番環境でリスクとなる可能性

**解決案** (実装済み):
- 本番環境では`NODE_ENV=production`または`CF_PAGES_BRANCH=main`時にDEBUG_MODE強制無効化 ✅
- ログレベル管理システムの導入（ERROR, WARN, INFO, DEBUG, TRACE） ✅
- 構造化ログシステムの実装（TypeScript/JavaScript両対応） ✅
- センシティブデータの自動マスキング機能 ✅

**達成効果**:
- セキュリティリスクの完全排除
- 企業レベルの構造化ログシステム導入
- 運用時のトラブルシューティング改善

## 🟡 中優先度タスク

### ~~3. 開発環境でのKV処理の最適化~~ ✅ 完了済み (2025-09-05)
**問題**: 開発環境ではLocalStorageのみ使用する設計だが、KVアクセスコードが残存

**影響**:
- 不要なエラーハンドリング
- 開発環境での混乱

**解決案** (実装済み):
- `functions/utils/kv-helpers.js`で環境判定を一元化 ✅
- 開発環境では完全にKVアクセスをスキップ ✅
- withKV、kvGet、kvPut、kvDelete等のヘルパー関数を提供 ✅

**達成効果**:
- 開発環境でのKVエラー完全排除
- 環境別処理の統一化
- 22個のテストケースで動作保証

---

### ~~4. エラーメッセージの統一管理~~ ✅ 完了済み (2025-09-05)
**問題**: APIごとに異なるエラーメッセージ形式

**影響**:
- フロントエンドでの一貫性のないエラー表示
- 国際化対応の困難さ

**解決案** (実装済み):
- `lib/constants/error-messages.ts`でエラーコードとメッセージを一元管理 ✅
- `lib/utils/error-response.ts`で統一エラーレスポンス形式を実装 ✅
- `functions/utils/error-messages.js`でCloudflare Functions用も統一 ✅
- 全APIエンドポイントで統一形式を適用 ✅

**達成効果**:
- 統一的なエラーレスポンス形式の実現
- 日本語/英語の国際化対応
- 後方互換性を維持しつつ新システムへ移行

## 🟡 中優先度タスク（追加）

### 9. QRスキャナーのリソース管理改善（PR #235レビュー - 2025-09-06）
**問題**: カメラストリームやスキャン処理のリソース管理が不完全

**改善提案**:
```typescript
// AbortControllerでタイムアウトとキャンセル管理
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

// 権限状態リスナーの適切なクリーンアップ
useEffect(() => {
  const handleChange = () => { /* ... */ };
  result.addEventListener('change', handleChange);
  return () => result.removeEventListener('change', handleChange);
}, []);
```

**期待効果**:
- メモリリークの防止
- バッテリー消費の最適化
- より堅牢なエラーハンドリング

---

### 10. メモリ管理の強化（PR #223レビュー - 2025-09-06）
**問題**: 開発環境でのメモリストレージが100件を超えた際の削除が1件ずつ

**改善案**:
```javascript
// 複数エントリの一括削除で効率化
if (global.devDiagnosisStorage.size > 100) {
  const keys = Array.from(global.devDiagnosisStorage.keys());
  const deleteCount = keys.length - 80; // 80件まで削減
  keys.slice(0, deleteCount).forEach(key => 
    global.devDiagnosisStorage.delete(key)
  );
}
```

**期待効果**:
- パフォーマンス向上
- メモリ使用量の安定化

---

### 11. データ検証エラーの詳細化（PR #223レビュー - 2025-09-06）
**問題**: エラーメッセージが汎用的で原因特定が困難

**改善案**:
```javascript
// より具体的なエラーメッセージ
if (!result || typeof result !== 'object') {
  throw new Error('Invalid DiagnosisResult: expected object, got ' + typeof result);
}
if (!result.id) {
  throw new Error('Invalid DiagnosisResult: missing required field "id"');
}
if (!result.score && result.score !== 0) {
  throw new Error('Invalid DiagnosisResult: missing required field "score"');
}
```

**期待効果**:
- デバッグ時間の短縮
- エラー原因の即座の特定

## 🟢 低優先度タスク

### ~~5. CNCFプロジェクト選択テストの追加~~ ✅ 完了済み (2025-09-05)
**問題**: PR #189で実装されたCNCFプロジェクト選択機能のテストが不足

**解決案** (実装済み PR #216):
- 44個の包括的なCNCFプロジェクトテスト ✅
- カテゴリー分類（Graduated/Incubating/Sandbox）のテスト ✅
- 統計的分布テスト（3シグマルール） ✅
- パフォーマンステスト（10,000回/100ms） ✅
- メモリリーク検証 ✅

**達成効果**:
- Claude Review: ⭐⭐⭐⭐⭐ (5.0/5.0)
- 完全なテストカバレッジ達成

---

### 6. Prairie Card URL検証の改善
**現状**: `my.prairie.cards`のみ許可（正しい実装）

**将来的な検討事項**:
- URLエンコードされた日本語ユーザー名のサポート
- URL長さ制限の実装（現在は無制限）

---

### 7. テストコードのリファクタリング
**改善提案**: `describe.each`を使用したテストコードの簡潔化

```typescript
describe.each([
  ['javascript:', '危険なプロトコル'],
  ['data:', 'データプロトコル']
])('プロトコル %s の拒否', (protocol, description) => {
  // テストケース
});
```

---

### 8. CollapsibleSectionコンポーネントの改善（PR #236レビュー - 2025-09-06）
**改善提案**: Claude Reviewからの提案事項

**パフォーマンス最適化**:
```typescript
// 現在の実装
id={`section-${title}`}

// 推奨改善案
const sectionId = useMemo(() => `section-${title}`, [title]);
```

**アクセシビリティ強化**:
```typescript
// フォーカス時のスタイル追加
className={`... focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 ...`}
```

**型安全性の向上**:
- nullチェック用のutility関数追加
- 診断結果フィールドの存在確認を型安全に

**UX検討**:
- 最初のアコーディオンをデフォルトで開く
- 人気の高い分析を優先的に表示

---

### 12. CollapsibleSectionコンポーネントのテスト追加（PR #237レビュー - 2025-09-06）
**問題**: 新規追加されたCollapsibleSectionにテストが不足

**必要なテスト**:
```typescript
describe('CollapsibleSection', () => {
  test('アクセシビリティ属性が適切に設定される', () => {
    // aria-expanded, aria-controlsのテスト
  });
  
  test('レスポンシブクラスが適用される', () => {
    // md:プレフィックスのテスト
  });
  
  test('最小タッチターゲットが確保される', () => {
    // min-h-[60px]のテスト
  });
  
  test('アニメーションが正しく動作する', () => {
    // Framer Motionアニメーションのテスト
  });
});
```

**期待効果**:
- 回帰バグの防止
- アクセシビリティの保証
- モバイルUXの品質維持

---

### 13. アクセシビリティ属性の追加（PR #231レビュー - 2025-09-06）
**問題**: 一部のUI要素でアクセシビリティ属性が不足

**改善案**:
```typescript
// 診断同意文にrole属性追加
<p className="text-xs text-gray-500" role="note">
  ※ 診断を開始することで、Prairie Card の公開プロフィール情報の
  読み取りと分析に同意したものとみなされます
</p>

// メニューカードにaria-label追加
<MenuCard
  href="/duo"
  icon="🤝"
  title="Let's C'n'D!"
  description="2人の相性をチェック"
  aria-label="2人の相性診断を開始する"
/>
```

**期待効果**:
- スクリーンリーダー対応の向上
- WCAG準拠レベルの向上

---

### 14. アニメーション設定の定数化（PR #237レビュー - 2025-09-06）
**問題**: アニメーション設定値がハードコーディングされている

**改善案**:
```typescript
// lib/constants/animation.ts
export const ANIMATION_CONFIG = {
  COLLAPSIBLE: {
    duration: 0.2,
    ease: 'easeInOut'
  },
  PAGE_TRANSITION: {
    duration: 0.3,
    ease: 'easeOut'
  }
} as const;
```

**期待効果**:
- アニメーション速度の一元管理
- ユーザー設定による調整の容易化

---

### 15. QRスキャナーのフォールバック動作テスト（PR #235レビュー - 2025-09-06）
**問題**: BarcodeDetector失敗時のフォールバック動作のテストが不足

**必要なテスト**:
```typescript
it('should fallback to qr-scanner when BarcodeDetector fails', async () => {
  // BarcodeDetectorのモックを失敗させる
  global.BarcodeDetector = undefined;
  
  // qr-scannerライブラリが使用されることを確認
  const { result } = renderHook(() => useQRScannerV2());
  await act(async () => {
    await result.current.startScan();
  });
  
  expect(result.current.scannerType).toBe('qr-scanner');
});
```

**期待効果**:
- フォールバック機構の動作保証
- クロスブラウザ互換性の確保

---

### 16. SSR対応の環境チェック改善（PR #240レビュー - 2025-09-07）
**問題**: SSR対応でnavigator/windowオブジェクトのチェックが複数箇所に散在し、一貫性が不足

**現状の課題**:
- `getDeviceInfo()`は`navigator`をチェック、`checkBarcodeDetectorSupport()`は`window`をチェック
- 環境チェックのロジックが複数ファイルに分散
- SSRシナリオのテストが不足
- ハイドレーション時の値の不一致リスク

**改善提案**:

#### 1. 環境チェックヘルパー関数の導入
```typescript
// src/utils/environment.ts
export const isClientSide = () => typeof window !== 'undefined';
export const isNavigatorAvailable = () => typeof navigator !== 'undefined';
export const isBrowserEnvironment = () => isClientSide() && isNavigatorAvailable();

// SSR safe な navigator アクセス
export const getNavigator = () => {
  if (!isNavigatorAvailable()) return null;
  return navigator;
};

// デフォルト値の定数化
export const DEFAULT_DEVICE_INFO = {
  isAndroid: false,
  isChrome: false,
  chromeVersion: 0,
  isWebView: false,
  userAgent: ''
} as const;
```

#### 2. 統一的なチェック方法への移行
```typescript
// src/hooks/useQRScannerV2.ts
import { isBrowserEnvironment, getNavigator, DEFAULT_DEVICE_INFO } from '@/utils/environment';

function getDeviceInfo() {
  if (!isBrowserEnvironment()) {
    return DEFAULT_DEVICE_INFO;
  }
  const nav = getNavigator();
  if (!nav) return DEFAULT_DEVICE_INFO;
  
  const ua = nav.userAgent;
  // ... 既存の実装
}

async function checkBarcodeDetectorSupport() {
  if (!isBrowserEnvironment()) return false;
  // ... 既存の実装
}
```

#### 3. SSRテストの追加
```typescript
// src/hooks/__tests__/useQRScannerV2.ssr.test.ts
/**
 * @jest-environment node
 */
describe('useQRScannerV2 SSR Support', () => {
  beforeEach(() => {
    // Node環境をシミュレート
    delete (global as any).window;
    delete (global as any).navigator;
  });

  test('getDeviceInfo should return default values in SSR', () => {
    const deviceInfo = getDeviceInfo();
    expect(deviceInfo).toEqual(DEFAULT_DEVICE_INFO);
  });

  test('checkBarcodeDetectorSupport should return false in SSR', async () => {
    const result = await checkBarcodeDetectorSupport();
    expect(result).toBe(false);
  });

  test('hook should not throw in SSR environment', () => {
    expect(() => {
      const TestComponent = () => {
        useQRScannerV2();
        return null;
      };
      renderToString(<TestComponent />);
    }).not.toThrow();
  });
});
```

#### 4. ハイドレーション対策
```typescript
// src/hooks/useQRScannerV2.ts
export function useQRScannerV2() {
  // SSRとクライアントで同じ初期値を使用
  const [deviceInfo, setDeviceInfo] = useState(DEFAULT_DEVICE_INFO);
  
  // クライアントサイドでのみ実行
  useEffect(() => {
    if (isBrowserEnvironment()) {
      setDeviceInfo(getDeviceInfo());
    }
  }, []);
  
  // 以降の処理...
}
```

**期待効果**:
- 環境チェックロジックの一元化により保守性向上
- SSR/CSRの切り替えが明確になり、バグ発生リスク低減
- テストカバレッジ向上により回帰バグを防止
- Next.js 13+ App Routerとの互換性向上
- ハイドレーションエラーの防止

**実装優先度**: 🟡 中（現在の修正で動作はするが、保守性と拡張性のために改善が望ましい）

**関連PR**: 
- #240（SSR対応でnavigator未定義エラーを修正）- 緊急修正として最小限の変更で対応済み
- この改善提案は、より包括的で保守性の高いソリューションを提供

**見積もり工数**: 2-3時間（テスト含む）

## 📝 実装済み項目（記録用）

### ✅ 完了済み
- デバッグログのセキュリティ強化（2025-09-05、PR #208）
  - 本番環境でのDEBUG_MODE完全無効化実装
  - 構造化ログシステム（StructuredLogger）の導入
  - センシティブデータ自動マスキング機能
  - CommonJS互換性問題の解決
- プロフィール変換処理の共通化（2025-09-05）
  - TypeScript/JavaScript両環境用のprofile-converterモジュール作成
  - 重複コード約50行を削減
  - 全APIエンドポイントで共通モジュールを使用
- エラーメッセージの統一管理（2025-09-05）
  - 統一エラーコード定義ファイル作成
  - TypeScript/JavaScript両環境対応
  - 国際化対応（日本語/英語）
  - 後方互換性の維持
- Prairie Card URL検証のセキュリティ強化（PR #195 - 2025-09-05）
- Prairie Card URL検証テストの追加（PR #197 - 2025-09-05）
- 不要ファイルの大規模削除（PR #190 - 2025-09-05）
- CORS設定の統一とセキュリティ強化（PR #195 - 2025-09-05）
- AbortControllerによるタイムアウト処理（PR #195 - 2025-09-05）

## 🔄 継続的改善

### コードレビューで見つかった改善点の管理プロセス
1. レビューコメントをこのドキュメントに記録
2. 優先度を設定
3. スプリント計画時に高優先度項目から対応
4. 完了後は「実装済み項目」セクションに移動

### 定期レビュー
- 月1回、このドキュメントをレビュー
- 優先度の見直し
- 新規項目の追加

## 📊 メトリクス

### 技術的負債の削減状況
- 2025年9月: 16項目の改善項目を特定（9/7時点）
  - 高優先度: 2項目（2項目完了済み）
  - 中優先度: 9項目（未着手）
  - 低優先度: 3項目（未着手）
- 目標: 3ヶ月以内に高優先度項目を完了

### コード品質指標
- 重複コード: 
  - プロフィール変換: 約50行（2ファイル）
  - 目標: 共通化により0行に削減
- テストカバレッジ: 現在のカバレッジを維持しつつ改善
- エラー処理の一貫性: 4つのAPIで異なる形式（目標: 統一）

---

*このドキュメントは生きているドキュメントです。継続的に更新し、技術的負債の管理と削減に活用してください。*