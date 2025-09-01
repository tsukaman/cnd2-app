/**
 * CNCF (Cloud Native Computing Foundation) プロジェクトリスト
 * https://www.cncf.io/projects/
 * https://www.cncf.io/sandbox-projects/
 */

// Graduated Projects (成熟したプロジェクト)
export const CNCF_GRADUATED_PROJECTS = [
  { name: 'Kubernetes', description: 'コンテナオーケストレーション', emoji: '☸️' },
  { name: 'Prometheus', description: '監視とアラート', emoji: '📊' },
  { name: 'Envoy', description: 'エッジ・サービスプロキシ', emoji: '🔀' },
  { name: 'CoreDNS', description: 'DNSサーバー', emoji: '🌐' },
  { name: 'containerd', description: 'コンテナランタイム', emoji: '📦' },
  { name: 'Fluentd', description: 'ログ収集', emoji: '📝' },
  { name: 'Harbor', description: 'コンテナレジストリ', emoji: '⚓' },
  { name: 'Helm', description: 'Kubernetesパッケージマネージャー', emoji: '⛵' },
  { name: 'Jaeger', description: '分散トレーシング', emoji: '🔍' },
  { name: 'etcd', description: '分散KVストア', emoji: '🗄️' },
  { name: 'TUF', description: 'アップデートフレームワーク', emoji: '🔒' },
  { name: 'Vitess', description: 'データベースクラスタリング', emoji: '💾' },
  { name: 'Argo', description: 'ワークフロー・GitOps', emoji: '🔄' },
  { name: 'Cilium', description: 'ネットワーキング、セキュリティ', emoji: '🐝' },
  { name: 'CloudEvents', description: 'イベント仕様', emoji: '☁️' },
  { name: 'CNI', description: 'コンテナネットワークインターフェース', emoji: '🔌' },
  { name: 'Flux', description: 'GitOps', emoji: '🔀' },
  { name: 'SPIFFE', description: 'サービスアイデンティティ', emoji: '🆔' },
];

// Incubating Projects (成長中のプロジェクト)
export const CNCF_INCUBATING_PROJECTS = [
  { name: 'OpenTelemetry', description: 'オブザーバビリティ', emoji: '🔭' },
  { name: 'Linkerd', description: 'サービスメッシュ', emoji: '🔗' },
  { name: 'gRPC', description: 'RPC フレームワーク', emoji: '📡' },
  { name: 'NATS', description: 'メッセージング', emoji: '💬' },
  { name: 'Notary', description: 'コンテンツ署名', emoji: '✍️' },
  { name: 'Rook', description: 'ストレージオーケストレーション', emoji: '♜' },
  { name: 'Thanos', description: 'Prometheusの長期保存', emoji: '⚡' },
  { name: 'Buildpacks', description: 'アプリケーションビルド', emoji: '📦' },
  { name: 'Falco', description: 'ランタイムセキュリティ', emoji: '🦅' },
  { name: 'Dragonfly', description: 'P2Pファイル配信', emoji: '🐉' },
  { name: 'Crossplane', description: 'インフラ管理', emoji: '🏗️' },
  { name: 'Contour', description: 'Ingressコントローラー', emoji: '🛣️' },
  { name: 'Cortex', description: 'Prometheusの長期保存', emoji: '🧠' },
  { name: 'CRI-O', description: 'コンテナランタイム', emoji: '🐙' },
  { name: 'Chaos Mesh', description: 'カオスエンジニアリング', emoji: '🌀' },
  { name: 'Dapr', description: 'マイクロサービスランタイム', emoji: '🎯' },
  { name: 'KubeVirt', description: 'VM管理', emoji: '💻' },
  { name: 'Longhorn', description: '分散ストレージ', emoji: '🦏' },
];

// Sandbox Projects (実験的なプロジェクト)
export const CNCF_SANDBOX_PROJECTS = [
  { name: 'Keptn', description: 'イベント駆動型オーケストレーション', emoji: '🚢' },
  { name: 'Kyverno', description: 'ポリシー管理', emoji: '📋' },
  { name: 'KEDA', description: 'イベント駆動型オートスケーリング', emoji: '📈' },
  { name: 'Metal³', description: 'ベアメタル管理', emoji: '🔧' },
  { name: 'Volcano', description: 'バッチシステム', emoji: '🌋' },
  { name: 'OpenEBS', description: 'コンテナストレージ', emoji: '💽' },
  { name: 'LitmusChaos', description: 'カオスエンジニアリング', emoji: '⚡' },
  { name: 'Artifact Hub', description: 'パッケージ検索', emoji: '📦' },
  { name: 'Backstage', description: '開発者ポータル', emoji: '🎭' },
  { name: 'Cert-Manager', description: '証明書管理', emoji: '🔐' },
  { name: 'ChaosBlade', description: 'カオスエンジニアリング', emoji: '⚔️' },
  { name: 'Chaosd', description: 'カオスデーモン', emoji: '😈' },
  { name: 'Cloud Custodian', description: 'ルールエンジン', emoji: '🧹' },
  { name: 'CNI-Genie', description: 'CNIメタプラグイン', emoji: '🧞' },
  { name: 'Crane', description: 'コスト最適化', emoji: '🏗️' },
  { name: 'Curiefense', description: 'アプリケーションセキュリティ', emoji: '🛡️' },
  { name: 'Dex', description: 'OpenIDプロバイダー', emoji: '🔑' },
  { name: 'Distribution', description: 'OCIレジストリ', emoji: '📦' },
  { name: 'External Secrets', description: 'シークレット管理', emoji: '🔐' },
  { name: 'K8up', description: 'バックアップオペレーター', emoji: '💾' },
  { name: 'Karmada', description: 'マルチクラスタ管理', emoji: '🌍' },
  { name: 'Kator', description: 'リソースカタログ', emoji: '📚' },
  { name: 'Kube-OVN', description: 'CNIプラグイン', emoji: '🔌' },
  { name: 'KubeArmor', description: 'ランタイム保護', emoji: '🛡️' },
  { name: 'KubeClipper', description: 'K8s管理', emoji: '✂️' },
  { name: 'KubeEdge', description: 'エッジコンピューティング', emoji: '📡' },
  { name: 'Kuberhealthy', description: 'ヘルスチェック', emoji: '💚' },
  { name: 'Kuma', description: 'サービスメッシュ', emoji: '🐻' },
  { name: 'Kusk', description: 'APIゲートウェイ', emoji: '🚪' },
  { name: 'Lima', description: 'Linux VM', emoji: '🐧' },
  { name: 'Meshery', description: 'サービスメッシュ管理', emoji: '🕸️' },
  { name: 'Open Service Mesh', description: 'サービスメッシュ', emoji: '🔗' },
  { name: 'OpenGitOps', description: 'GitOps原則', emoji: '📖' },
  { name: 'OpenKruise', description: 'アプリケーション管理', emoji: '🚀' },
  { name: 'Paralus', description: 'アクセス管理', emoji: '🔐' },
  { name: 'Parsec', description: 'セキュリティAPI', emoji: '🔒' },
  { name: 'Piraeus', description: 'ストレージ', emoji: '💾' },
  { name: 'Porter', description: 'CNABツール', emoji: '🧳' },
  { name: 'Pravega', description: 'ストリーミングストレージ', emoji: '📊' },
  { name: 'SchemaHero', description: 'データベーススキーマ管理', emoji: '🦸' },
  { name: 'Serverless Devs', description: 'サーバーレスツール', emoji: '⚡' },
  { name: 'Service Mesh Performance', description: 'パフォーマンス測定', emoji: '📈' },
  { name: 'Skooner', description: 'K8sダッシュボード', emoji: '📊' },
  { name: 'SLSA', description: 'ソフトウェアサプライチェーン', emoji: '🔗' },
  { name: 'SPIRE', description: 'アイデンティティ管理', emoji: '🆔' },
  { name: 'Strimzi', description: 'Kafka on K8s', emoji: '📨' },
  { name: 'Submariner', description: 'マルチクラスタネットワーク', emoji: '🚢' },
  { name: 'Telepresence', description: '開発ツール', emoji: '📡' },
  { name: 'Teller', description: 'シークレット管理', emoji: '🤫' },
  { name: 'Tinkerbell', description: 'ベアメタル管理', emoji: '🔔' },
  { name: 'Tremor', description: 'イベント処理', emoji: '📊' },
  { name: 'vArmor', description: 'セキュリティ', emoji: '🛡️' },
  { name: 'Virtual Kubelet', description: 'Kubeletの実装', emoji: '🤖' },
  { name: 'WasmEdge', description: 'WebAssemblyランタイム', emoji: '🌐' },
  { name: 'Zot', description: 'OCIレジストリ', emoji: '📦' },
];

// 全プロジェクトを結合
export const ALL_CNCF_PROJECTS = [
  ...CNCF_GRADUATED_PROJECTS,
  ...CNCF_INCUBATING_PROJECTS,
  ...CNCF_SANDBOX_PROJECTS,
];

/**
 * ランダムにCNCFプロジェクトを1つ選択
 */
export function getRandomCNCFProject() {
  const randomIndex = Math.floor(Math.random() * ALL_CNCF_PROJECTS.length);
  return ALL_CNCF_PROJECTS[randomIndex];
}

/**
 * 多様なラッキーアイテムのリスト
 */
export const LUCKY_ITEMS = [
  // 技術系
  'メカニカルキーボード', 'ワイヤレスマウス', 'USB-Cハブ', 'ノイズキャンセリングヘッドフォン',
  'スタンディングデスク', 'モニターアーム', '4Kディスプレイ', 'エルゴノミクスチェア',
  
  // 飲み物・食べ物
  'コーヒー豆', '緑茶', 'エナジードリンク', 'プロテインバー', 'ナッツ',
  'チョコレート', 'グミ', '炭酸水', 'スムージー', 'ヨーグルト',
  
  // 文房具
  'モレスキンノート', '万年筆', 'ポストイット', 'ホワイトボードマーカー',
  '消せるボールペン', 'マインドマップ用紙', '付箋', 'クリップボード',
  
  // 日用品
  'アロマキャンドル', '観葉植物', '加湿器', 'ブルーライトカットメガネ',
  'リストレスト', 'デスクライト', 'タイマー', 'カレンダー',
  
  // エンタメ
  'Kindle', 'ポッドキャスト', 'Spotifyプレイリスト', '技術書',
  'Udemy講座', 'オーディオブック', 'ボードゲーム', 'パズル',
  
  // アウトドア
  '散歩シューズ', 'バックパック', '水筒', 'サングラス',
  'フィットネストラッカー', 'ヨガマット', 'ランニングシューズ', '自転車',
  
  // その他
  'ラバーダック', 'フィジェットトイ', 'ストレスボール', 'マスコット',
  'ステッカー', 'Tシャツ', 'パーカー', 'ソックス',
];

/**
 * 多様なラッキーアクションのリスト
 */
export const LUCKY_ACTIONS = [
  // 技術系
  'git commit --amend を試してみる', 'READMEを更新する', 'テストを1つ書く',
  '新しいVSCode拡張を試す', 'コードレビューをする', 'リファクタリングを楽しむ',
  'ドキュメントを改善する', 'issueを1つクローズする', 'デバッグを楽しむ',
  
  // 学習系
  '新しいプログラミング言語を15分触る', 'YouTubeで技術動画を観る', 'Qiitaに記事を書く',
  'オンライン勉強会に参加する', 'OSSにコントリビュートする', 'ブログを書く',
  
  // 休憩系
  '15分の散歩をする', 'ストレッチをする', '深呼吸を3回する',
  '好きな音楽を1曲聴く', 'コーヒーブレイクを取る', '窓の外を眺める',
  '瞑想を5分する', '目を閉じて休憩する', '水分補給をする',
  
  // コミュニケーション系
  '同僚とランチに行く', 'Slackで感謝を伝える', '雑談タイムを作る',
  'ペアプログラミングを提案する', 'フィードバックを求める', '褒め言葉を送る',
  
  // 整理整頓系
  'デスクトップを整理する', 'ブラウザのタブを整理する', 'Slackの未読を消化する',
  'メールを整理する', 'ToDoリストを更新する', 'カレンダーを確認する',
  
  // クリエイティブ系
  'アイデアをメモする', '絵を描いてみる', 'マインドマップを作る',
  'ブレインストーミングをする', '新しいアプローチを考える', '図を描いて説明する',
  
  // 日常系
  '植物に水をやる', 'お気に入りのお菓子を食べる', '好きな飲み物を買う',
  '早めに帰宅する', '新しいカフェを探す', '本を読む', '映画を観る計画を立てる',
];

/**
 * ランダムにラッキーアイテムを選択
 */
export function getRandomLuckyItem(): string {
  const randomIndex = Math.floor(Math.random() * LUCKY_ITEMS.length);
  return LUCKY_ITEMS[randomIndex];
}

/**
 * ランダムにラッキーアクションを選択
 */
export function getRandomLuckyAction(): string {
  const randomIndex = Math.floor(Math.random() * LUCKY_ACTIONS.length);
  return LUCKY_ACTIONS[randomIndex];
}