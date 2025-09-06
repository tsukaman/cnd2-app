# Capacitor 利用コスト分析

## 🎉 **朗報：Capacitorは完全無料！**

### 📋 ライセンス情報
- **ライセンス**: MIT License
- **料金**: **永久無料**
- **商用利用**: ✅ 可能
- **ソースコード**: オープンソース

## 💰 Capacitor関連のコスト内訳

### 1. **Capacitor本体**: 無料 ✅
```bash
npm install @capacitor/core    # 無料
npm install @capacitor/ios     # 無料
npm install @capacitor/android # 無料
```

### 2. **公式プラグイン**: 無料 ✅
```bash
# すべて無料で利用可能
@capacitor/camera       # カメラ
@capacitor/filesystem   # ファイルシステム
@capacitor/geolocation  # 位置情報
@capacitor/share        # 共有
@capacitor/push-notifications # プッシュ通知
```

### 3. **コミュニティプラグイン**: 無料 ✅
```bash
# NFCプラグインも無料
npm install @capacitor-community/nfc  # 無料
```

---

## 📊 実際にかかる費用

### 開発時の費用

| 項目 | 費用 | 必須 | 備考 |
|------|------|------|------|
| **Capacitor** | **¥0** | ✅ | MIT License |
| **プラグイン** | **¥0** | ✅ | すべて無料 |
| **開発ツール** | **¥0** | ✅ | VS Code等 |
| **ビルドツール** | **¥0** | ✅ | Xcode（Mac必要）, Android Studio |

### 公開時の費用

| 項目 | 費用 | 必須 | 備考 |
|------|------|------|------|
| **Apple Developer** | $99/年 | ✅（iOS） | App Store公開に必要 |
| **Google Play** | $25（初回のみ） | ✅（Android） | Play Store公開に必要 |
| **コード署名証明書** | ¥0 | ✅ | Xcode/Android Studio付属 |

### 運用時の費用

| 項目 | 費用 | 必須 | 備考 |
|------|------|------|------|
| **Capacitor更新** | **¥0** | ✅ | 永久無料 |
| **プラグイン更新** | **¥0** | ✅ | 永久無料 |
| **サポート** | **¥0** | ❌ | コミュニティサポート |

---

## 🆚 Ionic商用サービスとの違い

### 無料で使えるもの ✅
- **Capacitor** - クロスプラットフォーム開発
- **Ionic Framework** - UIコンポーネント
- **すべての基本機能** - NFC、カメラ、GPS等

### 有料だったもの（2024年に販売終了）
- ~~Ionic Appflow~~ - CI/CD（$499/月〜）
- ~~Identity Vault~~ - 生体認証（Enterprise）
- ~~Ionic Portals~~ - マイクロフロントエンド

**→ CND²アプリには不要なので影響なし**

---

## 💡 CND²アプリでの実際のコスト

### 初期費用
```
Capacitor本体:        ¥0
NFCプラグイン:        ¥0
その他プラグイン:      ¥0
開発ツール:          ¥0
-------------------
合計:               ¥0
```

### 年間費用（ストア公開する場合）
```
Apple Developer:     ¥14,000/年（$99）
Google Play:         ¥3,500（初回のみ、$25）
-------------------
初年度:            ¥17,500
2年目以降:         ¥14,000/年
```

### 開発工数（人件費）
```
Capacitor導入:       2週間
エンジニア単価:      ¥100万/月
-------------------
開発費:            約¥50万
```

---

## 🎯 コスト比較

| 方法 | ライセンス費 | ストア費用 | 開発費 | 合計（初年度） |
|------|------------|-----------|--------|--------------|
| **Capacitor** | **¥0** | ¥17,500 | ¥500,000 | **¥517,500** |
| React Native | ¥0 | ¥17,500 | ¥1,000,000 | ¥1,017,500 |
| Flutter | ¥0 | ¥17,500 | ¥3,000,000 | ¥3,017,500 |
| Swift/Kotlin | ¥0 | ¥17,500 | ¥7,000,000 | ¥7,017,500 |

---

## ✅ まとめ

### Capacitorのコスト
- **ソフトウェア費用**: **完全無料**
- **ライセンス**: MIT（商用利用OK）
- **サポート**: コミュニティ（無料）

### 実際にかかる費用
- **開発費**: 約50万円（2週間の人件費）
- **ストア費用**: 年間1.4万円 + 初回0.35万円
- **Capacitor使用料**: **¥0**

### 結論
**Capacitor自体は永久無料で商用利用可能。**
費用は開発工数とストア登録費のみです。

---

## 📝 注意事項

### Mac必須（iOS開発）
- iOSアプリのビルドにはMacが必要
- GitHub ActionsやCloud Buildでの代替も可能

### 無料の範囲
- すべての基本機能
- すべての公式プラグイン
- アップデート
- バグ修正

### サポート
- 公式サポートは無料（コミュニティ）
- 有償サポートが必要な場合は別途契約

---

## 🔗 参考リンク
- [Capacitor公式サイト](https://capacitorjs.com/)
- [Capacitor GitHub（MITライセンス確認）](https://github.com/ionic-team/capacitor/blob/main/LICENSE)
- [Capacitorプラグイン一覧](https://capacitorjs.com/docs/plugins)