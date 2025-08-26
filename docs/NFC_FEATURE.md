# NFC機能実装ガイド

## 概要
CND²アプリケーションにNFC（Near Field Communication）機能を実装し、モバイルデバイスでPrairie Card URLを自動読み取りできるようになりました。

## 機能詳細

### サポート環境
- **ブラウザ**: Chrome/Edge (Android)
- **API**: Web NFC API
- **デバイス**: NFCリーダー機能を搭載したAndroidスマートフォン/タブレット

### 実装内容

#### 1. useNFCフック (`/src/hooks/useNFC.ts`)
NFCスキャン機能を提供するReactフック：
- NFCサポート検出
- スキャン開始/停止
- Prairie Card URL自動認識
- エラーハンドリング

主な機能：
```typescript
- isSupported: NFC対応確認
- isScanning: スキャン状態
- lastReadUrl: 読み取ったURL
- startScan(): スキャン開始
- stopScan(): スキャン停止
```

#### 2. PrairieCardInput改良
NFCボタンとスキャンUIを追加：
- NFCボタン（対応デバイスのみ表示）
- スキャン中のビジュアルフィードバック
- 自動URL入力と読み込み

## 使用方法

### エンドユーザー向け

1. **NFCタグの準備**
   - Prairie Card URLをNFCタグに書き込む
   - テキストまたはURL形式でエンコード

2. **読み取り手順**
   - Prairie Card入力欄の「NFCで読み取る」ボタンをタップ
   - NFCタグをデバイスに近づける
   - 自動的にURLが読み込まれ、プロフィールが取得される

### 開発者向け

#### NFCタグへの書き込み例
```javascript
// NFCタグにPrairie Card URLを書き込む
const writer = new NDEFWriter();
await writer.write({
  records: [{
    recordType: "url",
    data: "https://my.prairie.cards/u/username"
  }]
});
```

#### 対応するNFCレコードタイプ
- `text`: テキスト形式のURL
- `url`: URL形式
- `absolute-url`: 絶対URL形式

## セキュリティ考慮事項

1. **URLバリデーション**
   - Prairie Card URLのみを受け入れる
   - パターンマッチング: `prairie.cards` または `prairie-cards`

2. **権限管理**
   - ユーザーの明示的な許可が必要
   - ブラウザのNFC権限設定

3. **エラーハンドリング**
   - 権限拒否時のフォールバック
   - 読み取りエラーの適切な表示

## トラブルシューティング

### よくある問題と解決策

1. **「NFCで読み取る」ボタンが表示されない**
   - 対応ブラウザ（Chrome/Edge Android）を使用
   - HTTPSでアクセス（NFCはセキュアコンテキストが必要）

2. **「NFC permission denied」エラー**
   - ブラウザ設定でNFC権限を許可
   - サイト設定でNFCアクセスを有効化

3. **NFCタグが読み取れない**
   - NFCが有効になっているか確認
   - タグを正しくデバイスに近づける
   - 対応フォーマットで書き込まれているか確認

## 今後の拡張案

1. **QRコード連携**
   - QRコードとNFCの併用
   - フォールバック機能

2. **カスタムNFCメッセージ**
   - 相性診断結果のNFC共有
   - イベント参加証明のNFC書き込み

3. **iOS対応**
   - iOS Safari対応待ち
   - Core NFC Web API実装時に対応

## 参考資料
- [Web NFC API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)
- [Chrome Platform Status - Web NFC](https://chromestatus.com/feature/6261030015467520)
- [NFC Forum Specifications](https://nfc-forum.org/our-work/specifications-and-application-documents/)