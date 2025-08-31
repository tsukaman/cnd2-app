# iOS NFC対応ガイド

## 現状

Web NFC APIはiOSでサポートされていないため、ブラウザから直接NFCタグを読み取ることはできません。

### 対応状況
| プラットフォーム | NFC対応 | 代替手段 |
|-----------------|---------|----------|
| Android Chrome/Edge | ✅ 対応 | - |
| iOS Safari | ❌ 未対応 | QRコード |
| iOS Chrome/Edge | ❌ 未対応 | QRコード |

## iOSユーザー向け代替案

### 1. QRコード読み取り（推奨）
Prairie Card入力欄の「QR」ボタンを使用してQRコードを読み取ってください。

### 2. iOS Shortcutsアプリを使用（上級者向け）

#### セットアップ手順
1. **Shortcutsアプリを開く**
2. **新規ショートカット作成**
   - 「+」ボタンをタップ
   - 「アクションを追加」

3. **NFCスキャンアクション追加**
   - 「NFC」で検索
   - 「NFCタグをスキャン」を選択
   - NFCタグをスキャンして登録

4. **Safari起動アクション追加**
   - 「Safari」で検索
   - 「URLを開く」を選択
   - URLフィールドに `https://cnd2.cloudnativedays.jp/duo` を設定

5. **ショートカット保存**
   - 名前を「CND² スキャン」などに設定
   - ホーム画面に追加（オプション）

#### 使用方法
1. NFCタグに Prairie Card URLを書き込む
2. iPhoneでNFCタグをスキャン
3. Shortcutsアプリが起動し、CND²アプリが開く
4. URLを手動で入力フィールドに貼り付け

### 3. クリップボード経由
1. 他のNFC読み取りアプリでURLを読み取る
2. URLをコピー
3. CND²アプリの「貼付」ボタンでペースト

## 開発者向け情報

### 将来的な対応可能性

#### 1. Web NFC API の iOS対応待ち
- Apple/WebKitがWeb NFC APIを実装するのを待つ
- 現時点で実装予定なし

#### 2. ネイティブアプリ開発
React Native/Flutterでアプリ開発する場合：
```javascript
// React Native Example
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

async function readNFC() {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    const url = // Extract URL from tag
    // Deep link to web app
    Linking.openURL(`https://cnd2.cloudnativedays.jp/duo?url=${url}`);
  } catch (ex) {
    console.warn('NFC read failed', ex);
  }
}
```

#### 3. プログレッシブ対応
```typescript
// 将来のiOS対応に備えた実装
const checkNFCSupport = () => {
  // Web NFC APIのサポートチェック
  if ('NDEFReader' in window) {
    return true;
  }
  
  // 将来的なiOS APIチェック（仮）
  if ('webkit' in window && 'nfc' in window.webkit) {
    return true;
  }
  
  return false;
};
```

## 推奨事項

### ユーザー向け
- **Androidユーザー**: NFCボタンを使用
- **iOSユーザー**: QRコードボタンを使用

### イベント主催者向け
- Prairie CardのQRコードとNFCタグ両方を準備
- 参加者にプラットフォーム別の使用方法を案内

## 参考リンク
- [WebKit Feature Status](https://webkit.org/status/)
- [iOS Shortcuts User Guide](https://support.apple.com/guide/shortcuts/welcome/ios)
- [React Native NFC Manager](https://github.com/revtel/react-native-nfc-manager)