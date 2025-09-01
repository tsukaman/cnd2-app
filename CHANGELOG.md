# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 診断結果の共有機能（準備中）
- 診断履歴機能
- エラー境界（Error Boundary）の実装

### Changed
- 大きなコンポーネントのリファクタリング予定

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