# QRスキャナー開発ガイド

## 📚 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [実装詳細](#実装詳細)
- [ブラウザ別対応](#ブラウザ別対応)
- [権限管理](#権限管理)
- [トラブルシューティング](#トラブルシューティング)
- [今後の改善案](#今後の改善案)

## 概要

CND2アプリのQRスキャナー機能は、Prairie CardのQRコードを読み取って参加者プロフィールを取得する機能です。クロスブラウザ対応と権限管理が主な技術的チャレンジとなっています。

## 技術スタック

### メインライブラリ
- **qr-scanner**: v1.4.2 - メインのQRコードスキャンライブラリ
- **BarcodeDetector API**: ネイティブWeb API（対応ブラウザのみ）

### 関連技術
- **getUserMedia API**: カメラアクセス
- **Permissions API**: 権限状態の確認
- **Permissions-Policy HTTP Header**: サイトレベルのカメラ権限制御

## アーキテクチャ

```
┌─────────────────┐
│ PrairieCardInput│
│   Component     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useQRScannerV2  │
│      Hook       │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────────┐
│qr-scanner│ │BarcodeDetector│
│ Library │ │     API      │
└─────────┘ └──────────────┘
```

### ファイル構成

```
src/
├── hooks/
│   └── useQRScannerV2.ts    # QRスキャナーのメインロジック
├── components/
│   └── prairie/
│       └── PrairieCardInput.tsx  # UI コンポーネント
├── constants/
│   └── scanner.ts            # スキャナー関連の定数
└── lib/
    └── platform.ts           # プラットフォーム検出

functions/
└── utils/
    └── csp-constants.js      # CSP/Permissions-Policy設定

public/
└── _headers                  # 静的HTTPヘッダー設定
```

## 実装詳細

### 1. デバイス検出

```typescript
function getDeviceInfo() {
  const ua = navigator.userAgent;
  return {
    isAndroid: /Android/i.test(ua),
    isChrome: /Chrome/i.test(ua) && !/Edge|OPR/i.test(ua),
    chromeVersion: extractChromeVersion(ua),
    isWebView: isWebViewEnvironment(ua)
  };
}
```

### 2. スキャナー選択ロジック

```typescript
// BarcodeDetector APIが利用可能な場合は優先使用
if (hasBarcodeDetector && !deviceInfo.isWebView) {
  setScannerType('barcodedetector');
} else {
  // フォールバックとしてqr-scannerライブラリを使用
  setScannerType('qr-scanner');
}
```

### 3. Android Chrome特別処理

Android Chromeは厳格なユーザージェスチャー要件があるため、特別な処理が必要：

```typescript
const handleAndroidChromeCamera = async () => {
  try {
    // まず背面カメラを試みる
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    return stream;
  } catch {
    // フォールバック: 任意のカメラ
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    return stream;
  }
};
```

## ブラウザ別対応

### iOS Safari
- ✅ 完全対応
- qr-scannerライブラリを使用
- 権限ダイアログは自動表示

### iOS Chrome
- ✅ 完全対応
- iOS上のChromeはWebKitベースのため、Safariと同じ動作

### Android Chrome
- ✅ 対応（特別処理必要）
- ユーザージェスチャーコンテキストの保持が必須
- 背面カメラの明示的な指定が必要

### Android Firefox
- ✅ 完全対応
- 標準的なgetUserMedia実装で動作

### デスクトップブラウザ
- ✅ Chrome、Edge、Firefox対応
- BarcodeDetector APIが利用可能な場合は優先使用

## 権限管理

### 1. Permissions-Policy HTTPヘッダー

**重要**: Cloudflare Functionsの設定が優先される

```javascript
// functions/utils/csp-constants.js
const PERMISSIONS_POLICY = 'camera=(self), microphone=(), geolocation=(), payment=()';
```

```
# public/_headers (Cloudflare Functionsが無い場合のフォールバック)
Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()
```

### 2. 権限状態の確認

```typescript
if ('permissions' in navigator) {
  const result = await navigator.permissions.query({ 
    name: 'camera' as PermissionName 
  });
  // result.state: 'prompt' | 'granted' | 'denied'
}
```

### 3. エラーメッセージ

```typescript
const CAMERA_ERROR_MESSAGES = {
  NOT_SUPPORTED: 'カメラアクセスがサポートされていません',
  PERMISSION_DENIED: 'カメラへのアクセスが拒否されました',
  NOT_FOUND: 'カメラが見つかりません',
  IN_USE: 'カメラが他のアプリケーションで使用されています',
  GENERIC: 'カメラの起動に失敗しました'
};
```

## トラブルシューティング

### 問題1: Android Chromeで「カメラアクセス拒否」が即座に表示される

**原因**: Permissions-Policyヘッダーでカメラがブロックされている

**解決策**:
1. `functions/utils/csp-constants.js`の`camera=()`を`camera=(self)`に変更
2. `public/_headers`も同様に修正
3. Cloudflare Functionsが優先されることに注意

### 問題2: フロントカメラが起動してしまう

**原因**: カメラ制約の指定が不適切

**解決策**:
```typescript
// 背面カメラを優先
{ video: { facingMode: 'environment' } }
// フォールバック
{ video: true }
```

### 問題3: WebViewでカメラが動作しない

**原因**: WebViewアプリ側の権限設定が必要

**解決策**: 
- アプリ開発者にカメラ権限の付与を依頼
- 代替手段（NFCや貼り付け）を案内

## 今後の改善案

### 1. パフォーマンス最適化
- [ ] スキャン頻度の動的調整
- [ ] 低解像度プレビューの使用
- [ ] Web Workerでのデコード処理

### 2. UX改善
- [ ] スキャンエリアのハイライト表示
- [ ] 成功時のフィードバック強化
- [ ] カメラ切り替えボタンの追加

### 3. エラーハンドリング
- [ ] リトライボタンの追加
- [ ] より詳細なエラー原因の表示
- [ ] 代替手段への自動切り替え

### 4. セキュリティ
- [ ] QRコード内容の検証強化
- [ ] Prairie Card URLのより厳密な検証
- [ ] CSPの定期的な見直し

---

*最終更新: 2025-09-07*
*v1.0.0 - 初版*