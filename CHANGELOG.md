# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 診断履歴機能
- エラー境界（Error Boundary）の実装

### Changed
- 大きなコンポーネントのリファクタリング予定

## [1.11.0] - 2025-09-06

### Added
- 📱 **モバイル最適化とUI改善** (#236)
  - CollapsibleSectionコンポーネントの実装（Framer Motion使用）
  - レスポンシブなテキストサイズ（sm/md breakpoints）
  - 最小60pxのタッチターゲット確保
  - アコーディオン形式で診断結果をコンパクトに表示

### Changed
- **診断結果表示の改善** (#236)
  - 非推奨フィールドを削除（strengths, opportunities, advice）
  - スコア表示を画面上部に移動
  - モバイルファーストなレイアウト設計

### Fixed
- **QRスキャナーの安定性向上** (#236)
  - Android端末でのスキャン安定性改善
  - キャメラ権限エラーのハンドリング強化

## [1.10.0] - 2025-09-06

### Added
- 🎨 **ランディングページのUI改善** (#231)
  - ウェルカムメッセージの最適化
  - 「Works with Prairie Card」ブランディング
  - AppDescriptionコンポーネントの追加
  - プライバシーポリシーのアコーディオン表示

### Changed
- **UI/UXの全体的な改善**
  - かんたん3ステップの文言改善
  - 同意文の日本語表現を自然に改善
  - ウェルカムメッセージを簡潔に

## [1.9.0] - 2025-09-05

### Added
- 🌏 **OpenRouter統合による地域制限回避** (#217-221)
  - OpenRouterを優先APIプロバイダーとして統合
  - Cloudflare AI Gatewayサポート
  - 香港リージョン（HKG）からのアクセス問題を完全解決

### Fixed
- **診断機能の安定性向上** (#223-225)
  - 共有機能のKVストレージ保存問題を修正
  - 共有URLで相性スコアが0%表示される問題を修正
  - 環境依存のパフォーマンステストをスキップ

## [1.8.0] - 2025-09-05

### Added
- 🧪 **CNCFプロジェクトテストスイート** (#216)
  - 44個の包括的なCNCFプロジェクトテスト
  - 49個のPrairie URL検証テスト
  - 3シグマルールによる統計的精度向上

### Improved
- **技術的負債の大幅削減** (#208)
  - プロフィール変換処理の共通化（約50行削減）
  - デバッグログのセキュリティ強化
  - エラーメッセージの統一管理
  - KV処理の最適化

## [1.7.0] - 2025-09-04

### Fixed
- 🚨 **リントエラー完全解決** (#156-177)
  - 総リントエラー: 174→0（100%削減）
  - TypeScript strict mode完全準拠
  - any型エラー: 24→0

### Added
- **Prairie Card CNDW2025データ抽出** (#187)
  - ProfileContentブロック抽出機能
  - イベント特有データの解析
  - 興味分野、推しOSS、参加回数等の抽出

## [1.6.0] - 2025-09-03

### Changed
- 🔮 **診断エンジンの占術的アプローチ導入** (#161)
  - 五行思想、西洋占星術、数秘術の統合
  - 40-60点を中心とした正規分布
  - エンターテイメント性の大幅向上

### Fixed
- **Prairie Card取得の502エラー修正** (#183)
  - URL検証強化（my.prairie.cardsのみ許可）
  - タイムアウト処理改善

## [1.5.0] - 2025-09-01

### Added
- 🎯 **診断システムの大幅改善** (#115)
  - 動的スコアリング（0-100%）実装
  - 4スタイル診断を単一診断に統合
  - 紙吹雪エフェクト付き結果ページ

### Added
- **診断結果共有機能** (#121)
  - QRコード生成
  - SNS共有（X/Twitter、LINE、Facebook）
  - NFCタグ書き込み対応

## [1.4.0] - 2025-09-01

### Added
- 🎛️ **フォールバック診断の環境別制御機能** (#116)
  - `ENABLE_FALLBACK`環境変数による制御（デフォルト: false）
  - 開発環境と本番環境で異なるスコア範囲を設定
  - イベント運用時のエラー検知を改善

### Improved
- **コード品質の大幅改善** (#116)
  - 重複コード排除: Cloudflare Functions用の共通設定を作成
  - 型安全性向上: `ExtractedProfileInfo`型を定義
  - 環境判定ヘルパー: `/lib/utils/environment.ts`で一元化
  - 環境変数バリデーション: 型安全な取得関数を実装

### Added
- **包括的なドキュメント整備**
  - 環境変数設定ガイド: `/docs/ENVIRONMENT_VARIABLES.md`
  - イベント運用ガイド: `/docs/EVENT_OPERATION_GUIDE.md`
  - CloudNative Days Winter 2025向けの運用手順を明文化

### Fixed
- 診断エンジンのインポートエラーを修正（PR #115対応）

## [1.3.3] - 2025-09-01

### Fixed
- 🐛 **診断結果表示エラーを修正** (#113)
  - Cloudflare FunctionsのsuccessResponseラッパーによるデータネスト問題を解決
  - `TypeError: Cannot read properties of undefined (reading 'length')`エラーを修正
  - 診断結果画面での防御的データアクセスを実装

### Improved
- **エラーハンドリング強化**
  - レスポンスデータの安全な展開（`responseData.data || responseData`）
  - デフォルト値設定によるundefinedエラー防止
  - APIレスポンス形式の互換性向上

## [1.3.2] - 2025-09-01

### Fixed
- 🚨 **本番環境でのdiagnosis-multi APIエンドポイント405エラーを解決** (#112)
  - Cloudflare Functions用の`functions/api/diagnosis-multi.js`を新規作成
  - Next.jsの静的エクスポート設定によるAPI Route無効化問題を修正
  - Prairie Cardは正常に読み込まれるが診断開始時にエラーになる問題を解決

### Added
- **Cloudflare Functions用のdiagnosis-multi実装**
  - 4つのスタイル（creative, astrological, fortune, technical）の並列処理
  - エラー時のフォールバック診断機能
  - 入力サニタイゼーションによるXSS対策

### Improved
- **セキュリティ強化**
  - HTMLサニタイザー実装（`functions/utils/sanitizer.js`）
  - プロファイルデータの再帰的サニタイゼーション
- **コード品質改善**
  - マジックナンバーを定数化（FALLBACK_COMPATIBILITY）
  - Setを使用したスタイル検証の高速化
  - エラータイプ別の詳細なハンドリング（400, 408, 500）

## [1.3.1] - 2025-09-01

### Changed
- 🎯 **複数スタイル診断の簡素化** (#107)
  - 複数スタイル選択UIを削除
  - 常に4つのスタイル（クリエイティブ、占星術、点取り占い、技術分析）すべてで診断を実行
  - ボタンテキストを「4つのスタイルで診断開始」に変更
  - ユーザー体験の向上：選択の手間を省き、常に全スタイルで診断

### Fixed
- 複数スタイル選択時のエラーを解決
- Prairie Card APIに開発環境用モックデータを追加

### Improved
- DIAGNOSIS_STYLES定数を共通化（`lib/constants/diagnosis.ts`）
- エラーハンドリングにTODOコメント追加（将来的なToast通知への置き換え）
- 関連テストを更新

## [1.3.0] - 2025-08-31

### Added
- 🎉 **複数スタイル同時診断機能** (#100)
  - 4つの診断スタイル（Creative、占星術、点取り占い、技術分析）を並列実行
  - Promise.allによる並列処理で2-3秒の高速診断（従来の8秒から75%削減）
  - タブ/グリッド切り替え可能な比較UI
  - 新APIエンドポイント `/api/diagnosis-multi`
  - コスト効率的な実装（約0.6円/診断）
- 📚 **包括的なドキュメント追加**
  - iOS NFC回避策ガイド (`docs/iOS_NFC_WORKAROUND.md`)
  - ネイティブアプリ移行分析 (`docs/iOS_NATIVE_MIGRATION_ANALYSIS.md`)
  - ネイティブアプリロードマップ (`docs/NATIVE_APP_ROADMAP.md`)
  - Capacitorコスト分析 (`docs/CAPACITOR_COST_ANALYSIS.md`)
  - エンジンスタイル切り替えガイド (`docs/ENGINE_STYLE_GUIDE.md`)
  - 複数スタイル診断分析 (`docs/MULTI_STYLE_DIAGNOSIS_ANALYSIS.md`)
- 🧪 **テストカバレッジ向上**
  - 複数スタイル診断APIテスト: 10テストケース
  - MultiStyleSelectorコンポーネントテスト: 14テストケース

### Changed
- 🔒 **セキュリティ強化**
  - CORS設定を本番環境用に最適化（開発環境のみ*許可）
  - 全入力値にHTMLサニタイゼーション適用
  - APIリトライ機構（最大3回、指数バックオフ）
- 🎨 **コード品質改善**
  - マジックナンバーを定数化（`/lib/constants/diagnosis.ts`）
  - LocalStorageの24時間TTLクリーンアップ実装
  - 処理時間、クリーンアップ間隔、スタイル設定を定数管理

### Fixed
- TypeScriptビルドエラーの修正
- ESLint設定の最適化

## [1.2.0] - 2025-08-29

### Added
- 診断結果のエンターテイメント性向上
  - 「クラウドネイティブの賢者」キャラクター導入
  - スコアを常に85点以上に設定（ポジティブな体験）
  - ラッキーアイテム・ラッキーアクション追加
  - temperature: 0.85で創造的な診断文生成
- Prairie Card解析の完全修正
  - 包括的な抽出パターンを追加
  - 技術キーワードの自動検出（JavaScript、Docker、Kubernetes等）
  - ハッシュタグ抽出機能

### Changed
- UIフローの改善
  - duo/page.tsxに自動画面遷移を実装
  - プログレスバーのビジュアルフィードバック強化
  - ランディングページと統一されたデザイン
- v3エンジンのトークン消費最適化
  - 最適化前: 7,000トークン/診断
  - 最適化後: 1,500トークン/診断（77%削減）

### Fixed
- CIテストエラーの修正
  - NextResponse.jsonのJestモック追加
  - ApiErrorクラスの引数順序修正
  - Edge Runtime互換性の改善

## [1.1.0] - 2025-08-27

### Changed
- テストモック戦略の根本的修正
  - `global.fetch`から`apiClient`の直接モックへ移行
- IntersectionObserver修正
  - Jestモック関数から適切なクラスコンストラクタへ
- React Confettiモック化
  - Canvas関連エラーを完全回避

### Fixed
- ErrorBoundary無限ループ防止
- シングルトンパターン対応（PrairieCardParserに`resetInstance()`追加）

## [1.0.0] - 2025-08-26

### Added
- 🚀 **初回リリース**
- AI診断機能実装（OpenAI GPT-4o-mini統合）
- 2人診断モード
- グループ診断モード（3-6人）
- Prairie Card連携（Edge Runtime対応）
- QRコード/NFC/URL共有機能
- ダークテーマベースUI

### Security
- Prairie Card URL検証
- HTML sanitization（DOMPurify）
- レート制限実装（10リクエスト/分/IP）
- XSS protection
- CSP設定

### Changed
- Edge Runtime対応
  - setInterval削除
  - cheerio→正規表現パーサー
- 型安全性向上（DiagnosisResult型の統一）

---

## 凡例

- 🎉 新機能
- 🔒 セキュリティ
- 🎨 コード品質
- 🧪 テスト
- 📚 ドキュメント
- 🐛 バグ修正
- ⚡ パフォーマンス