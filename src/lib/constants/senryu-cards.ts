/**
 * CloudNative川柳カードゲーム - カードデータ（100×100×100）
 * 100万通りの組み合わせを生成可能
 */

// カードの型定義
export interface SenryuCard {
  id: string;
  text: string;
  category: string;
  type: 'upper' | 'middle' | 'lower';
}

// 採点項目（川柳らしい評価軸）
export const SCORING_CRITERIA = [
  { id: 'humor', label: '面白さ', emoji: '😂', color: 'yellow', description: '笑えるか・クスッとくるか' },
  { id: 'unexpected', label: '意外性', emoji: '😲', color: 'purple', description: '予想外の組み合わせか' },
  { id: 'empathy', label: '共感度', emoji: '🤝', color: 'green', description: '「あるある！」と思えるか' },
  { id: 'tech', label: '技術感', emoji: '💻', color: 'blue', description: 'CloudNativeらしさがあるか' },
  { id: 'rhythm', label: 'リズム感', emoji: '🎵', color: 'orange', description: '5-7-5の響きが良いか' }
] as const;

// 上の句データ（100種類）
const UPPER_CARDS: Omit<SenryuCard, 'type'>[] = [
  // CloudNative技術系（40個）
  { id: 'u001', text: 'Kubernetes', category: 'cloudnative' },
  { id: 'u002', text: 'Docker', category: 'cloudnative' },
  { id: 'u003', text: 'Prometheus', category: 'cloudnative' },
  { id: 'u004', text: 'Grafana', category: 'cloudnative' },
  { id: 'u005', text: 'Terraform', category: 'cloudnative' },
  { id: 'u006', text: 'ArgoCD', category: 'cloudnative' },
  { id: 'u007', text: 'Istio', category: 'cloudnative' },
  { id: 'u008', text: 'Helm', category: 'cloudnative' },
  { id: 'u009', text: 'Jenkins', category: 'cloudnative' },
  { id: 'u010', text: 'GitOps', category: 'cloudnative' },
  { id: 'u011', text: 'CI/CD', category: 'cloudnative' },
  { id: 'u012', text: 'Fluentd', category: 'cloudnative' },
  { id: 'u013', text: 'Jaeger', category: 'cloudnative' },
  { id: 'u014', text: 'Envoy', category: 'cloudnative' },
  { id: 'u015', text: 'etcd', category: 'cloudnative' },
  { id: 'u016', text: 'CoreDNS', category: 'cloudnative' },
  { id: 'u017', text: 'Linkerd', category: 'cloudnative' },
  { id: 'u018', text: 'Falco', category: 'cloudnative' },
  { id: 'u019', text: 'OPA', category: 'cloudnative' },
  { id: 'u020', text: 'Vitess', category: 'cloudnative' },
  { id: 'u021', text: 'TiKV', category: 'cloudnative' },
  { id: 'u022', text: 'NATS', category: 'cloudnative' },
  { id: 'u023', text: 'Harbor', category: 'cloudnative' },
  { id: 'u024', text: 'Contour', category: 'cloudnative' },
  { id: 'u025', text: 'Flux', category: 'cloudnative' },
  { id: 'u026', text: 'Rook', category: 'cloudnative' },
  { id: 'u027', text: 'OpenTelemetry', category: 'cloudnative' },
  { id: 'u028', text: 'gRPC', category: 'cloudnative' },
  { id: 'u029', text: 'containerd', category: 'cloudnative' },
  { id: 'u030', text: 'CRI-O', category: 'cloudnative' },
  { id: 'u031', text: 'Podのメモリ', category: 'cloudnative' },
  { id: 'u032', text: 'Nodeが落ちて', category: 'cloudnative' },
  { id: 'u033', text: 'Serviceメッシュ', category: 'cloudnative' },
  { id: 'u034', text: 'ConfigMapが', category: 'cloudnative' },
  { id: 'u035', text: 'Secretの管理', category: 'cloudnative' },
  { id: 'u036', text: 'Ingressルール', category: 'cloudnative' },
  { id: 'u037', text: 'Volumeマウント', category: 'cloudnative' },
  { id: 'u038', text: 'ReplicaSetが', category: 'cloudnative' },
  { id: 'u039', text: 'StatefulSet', category: 'cloudnative' },
  { id: 'u040', text: 'DaemonSetで', category: 'cloudnative' },

  // アクション系（25個）
  { id: 'u041', text: 'デプロイが', category: 'action' },
  { id: 'u042', text: 'ビルドして', category: 'action' },
  { id: 'u043', text: 'プッシュした', category: 'action' },
  { id: 'u044', text: 'マージした', category: 'action' },
  { id: 'u045', text: 'リリースが', category: 'action' },
  { id: 'u046', text: 'テストが', category: 'action' },
  { id: 'u047', text: 'ロールバック', category: 'action' },
  { id: 'u048', text: 'スケールアップ', category: 'action' },
  { id: 'u049', text: 'リファクタ', category: 'action' },
  { id: 'u050', text: 'デバッグ中', category: 'action' },
  { id: 'u051', text: 'コミットした', category: 'action' },
  { id: 'u052', text: 'レビュー待ち', category: 'action' },
  { id: 'u053', text: 'ブランチ切って', category: 'action' },
  { id: 'u054', text: 'タグ付けて', category: 'action' },
  { id: 'u055', text: 'Issue立てて', category: 'action' },
  { id: 'u056', text: 'プルリク出して', category: 'action' },
  { id: 'u057', text: 'ログ見てたら', category: 'action' },
  { id: 'u058', text: 'モニタリング', category: 'action' },
  { id: 'u059', text: 'アラート来た', category: 'action' },
  { id: 'u060', text: 'インシデント', category: 'action' },
  { id: 'u061', text: 'リストアして', category: 'action' },
  { id: 'u062', text: 'バックアップ', category: 'action' },
  { id: 'u063', text: 'マイグレート', category: 'action' },
  { id: 'u064', text: 'アップデート', category: 'action' },
  { id: 'u065', text: 'パッチ当てて', category: 'action' },

  // 日常系（20個）
  { id: 'u066', text: '朝ごはん', category: 'daily' },
  { id: 'u067', text: '昼休み', category: 'daily' },
  { id: 'u068', text: '定時後', category: 'daily' },
  { id: 'u069', text: '深夜二時', category: 'daily' },
  { id: 'u070', text: 'リモートで', category: 'daily' },
  { id: 'u071', text: '会議中', category: 'daily' },
  { id: 'u072', text: 'スタンドアップ', category: 'daily' },
  { id: 'u073', text: 'ランチタイム', category: 'daily' },
  { id: 'u074', text: '月曜日', category: 'daily' },
  { id: 'u075', text: '金曜日', category: 'daily' },
  { id: 'u076', text: '休み明け', category: 'daily' },
  { id: 'u077', text: '締切前', category: 'daily' },
  { id: 'u078', text: '年度末', category: 'daily' },
  { id: 'u079', text: '新年度', category: 'daily' },
  { id: 'u080', text: 'ボーナス日', category: 'daily' },
  { id: 'u081', text: '健康診断', category: 'daily' },
  { id: 'u082', text: '忘年会', category: 'daily' },
  { id: 'u083', text: '歓送迎会', category: 'daily' },
  { id: 'u084', text: 'オフィスで', category: 'daily' },
  { id: 'u085', text: '在宅勤務', category: 'daily' },

  // 感情系（15個）
  { id: 'u086', text: 'なぜだろう', category: 'emotion' },
  { id: 'u087', text: 'やっちゃった', category: 'emotion' },
  { id: 'u088', text: 'まさかの', category: 'emotion' },
  { id: 'u089', text: 'ついに来た', category: 'emotion' },
  { id: 'u090', text: 'どうしよう', category: 'emotion' },
  { id: 'u091', text: 'うれしいな', category: 'emotion' },
  { id: 'u092', text: 'つらいけど', category: 'emotion' },
  { id: 'u093', text: 'がんばった', category: 'emotion' },
  { id: 'u094', text: 'もう無理', category: 'emotion' },
  { id: 'u095', text: 'やったぜ', category: 'emotion' },
  { id: 'u096', text: 'ありがとう', category: 'emotion' },
  { id: 'u097', text: 'ごめんなさい', category: 'emotion' },
  { id: 'u098', text: 'お疲れさま', category: 'emotion' },
  { id: 'u099', text: '助けてください', category: 'emotion' },
  { id: 'u100', text: 'よろしくです', category: 'emotion' }
];

// 中の句データ（100種類）
const MIDDLE_CARDS: Omit<SenryuCard, 'type'>[] = [
  // 時間表現系（30個）
  { id: 'm001', text: '朝から夜まで', category: 'temporal' },
  { id: 'm002', text: '一日中', category: 'temporal' },
  { id: 'm003', text: '三日三晩', category: 'temporal' },
  { id: 'm004', text: '今日もまた', category: 'temporal' },
  { id: 'm005', text: '週末も', category: 'temporal' },
  { id: 'm006', text: '深夜まで', category: 'temporal' },
  { id: 'm007', text: '早朝から', category: 'temporal' },
  { id: 'm008', text: '休みなく', category: 'temporal' },
  { id: 'm009', text: '延々と', category: 'temporal' },
  { id: 'm010', text: 'ずっとずっと', category: 'temporal' },
  { id: 'm011', text: '気づけば朝', category: 'temporal' },
  { id: 'm012', text: '終わらない', category: 'temporal' },
  { id: 'm013', text: '永遠に', category: 'temporal' },
  { id: 'm014', text: '瞬く間に', category: 'temporal' },
  { id: 'm015', text: 'あっという間', category: 'temporal' },
  { id: 'm016', text: '時間切れ', category: 'temporal' },
  { id: 'm017', text: 'タイムアウト', category: 'temporal' },
  { id: 'm018', text: '締切まで', category: 'temporal' },
  { id: 'm019', text: 'リリース前', category: 'temporal' },
  { id: 'm020', text: '月末まで', category: 'temporal' },
  { id: 'm021', text: '年末まで', category: 'temporal' },
  { id: 'm022', text: '来週まで', category: 'temporal' },
  { id: 'm023', text: '明日まで', category: 'temporal' },
  { id: 'm024', text: '今すぐに', category: 'temporal' },
  { id: 'm025', text: 'そのうちに', category: 'temporal' },
  { id: 'm026', text: 'いつかきっと', category: 'temporal' },
  { id: 'm027', text: 'もうすぐだ', category: 'temporal' },
  { id: 'm028', text: 'まだまだだ', category: 'temporal' },
  { id: 'm029', text: 'やっと終わる', category: 'temporal' },
  { id: 'm030', text: 'はじまった', category: 'temporal' },

  // 量的表現系（30個）
  { id: 'm031', text: 'コンテナいっぱい', category: 'quantity' },
  { id: 'm032', text: 'エラーだらけ', category: 'quantity' },
  { id: 'm033', text: 'ログまみれ', category: 'quantity' },
  { id: 'm034', text: 'アラート祭り', category: 'quantity' },
  { id: 'm035', text: 'プルリク山積み', category: 'quantity' },
  { id: 'm036', text: 'Issue満載', category: 'quantity' },
  { id: 'm037', text: 'メモリ爆食い', category: 'quantity' },
  { id: 'm038', text: 'CPU100%', category: 'quantity' },
  { id: 'm039', text: 'ディスク満杯', category: 'quantity' },
  { id: 'm040', text: 'トラフィック爆発', category: 'quantity' },
  { id: 'm041', text: 'リクエスト殺到', category: 'quantity' },
  { id: 'm042', text: 'タスク山盛り', category: 'quantity' },
  { id: 'm043', text: 'バグだらけで', category: 'quantity' },
  { id: 'm044', text: 'テスト全滅', category: 'quantity' },
  { id: 'm045', text: 'カバレッジゼロ', category: 'quantity' },
  { id: 'm046', text: 'レビュー地獄', category: 'quantity' },
  { id: 'm047', text: 'コンフリクト祭り', category: 'quantity' },
  { id: 'm048', text: 'インシデント多発', category: 'quantity' },
  { id: 'm049', text: 'チケット爆増', category: 'quantity' },
  { id: 'm050', text: 'ミーティング地獄', category: 'quantity' },
  { id: 'm051', text: 'メール大量', category: 'quantity' },
  { id: 'm052', text: 'Slack鳴りやまず', category: 'quantity' },
  { id: 'm053', text: '通知が止まらん', category: 'quantity' },
  { id: 'm054', text: 'コード膨大', category: 'quantity' },
  { id: 'm055', text: 'ドキュメントなし', category: 'quantity' },
  { id: 'm056', text: 'コメントゼロ', category: 'quantity' },
  { id: 'm057', text: 'テストケース不足', category: 'quantity' },
  { id: 'm058', text: '依存関係地獄', category: 'quantity' },
  { id: 'm059', text: 'パッケージ大量', category: 'quantity' },
  { id: 'm060', text: 'ブランチ乱立', category: 'quantity' },

  // 技術アクション系（25個）
  { id: 'm061', text: 'スケールアウトで', category: 'action' },
  { id: 'm062', text: 'ローリングアップデート', category: 'action' },
  { id: 'm063', text: 'カナリアリリース', category: 'action' },
  { id: 'm064', text: 'ブルーグリーンで', category: 'action' },
  { id: 'm065', text: 'A/Bテスト', category: 'action' },
  { id: 'm066', text: 'ヘルスチェック', category: 'action' },
  { id: 'm067', text: 'オートスケール', category: 'action' },
  { id: 'm068', text: 'ロードバランス', category: 'action' },
  { id: 'm069', text: 'フェイルオーバー', category: 'action' },
  { id: 'm070', text: 'レプリケーション', category: 'action' },
  { id: 'm071', text: 'シャーディング', category: 'action' },
  { id: 'm072', text: 'キャッシング', category: 'action' },
  { id: 'm073', text: 'バッチ処理', category: 'action' },
  { id: 'm074', text: 'ストリーミング', category: 'action' },
  { id: 'm075', text: 'パイプライン', category: 'action' },
  { id: 'm076', text: 'オーケストレーション', category: 'action' },
  { id: 'm077', text: 'プロビジョニング', category: 'action' },
  { id: 'm078', text: 'モニタリング', category: 'action' },
  { id: 'm079', text: 'ロギングして', category: 'action' },
  { id: 'm080', text: 'トレーシング', category: 'action' },
  { id: 'm081', text: 'プロファイリング', category: 'action' },
  { id: 'm082', text: 'ベンチマーク', category: 'action' },
  { id: 'm083', text: 'リファクタリング', category: 'action' },
  { id: 'm084', text: 'マイグレーション', category: 'action' },
  { id: 'm085', text: 'インテグレーション', category: 'action' },

  // 状態表現系（15個）
  { id: 'm086', text: 'なんとかかんとか', category: 'state' },
  { id: 'm087', text: 'あれこれやって', category: 'state' },
  { id: 'm088', text: 'どうにかこうにか', category: 'state' },
  { id: 'm089', text: 'ぐるぐる回って', category: 'state' },
  { id: 'm090', text: 'ひたすら待って', category: 'state' },
  { id: 'm091', text: 'じっと耐えて', category: 'state' },
  { id: 'm092', text: 'もがきながら', category: 'state' },
  { id: 'm093', text: '試行錯誤', category: 'state' },
  { id: 'm094', text: 'うまくいかず', category: 'state' },
  { id: 'm095', text: '順調に進み', category: 'state' },
  { id: 'm096', text: '予想外に', category: 'state' },
  { id: 'm097', text: '奇跡的に', category: 'state' },
  { id: 'm098', text: '偶然にも', category: 'state' },
  { id: 'm099', text: 'まさかまさかの', category: 'state' },
  { id: 'm100', text: 'なんということか', category: 'state' }
];

// 下の句データ（100種類）
const LOWER_CARDS: Omit<SenryuCard, 'type'>[] = [
  // 結果系（35個）
  { id: 'l001', text: 'ずっとエラー', category: 'result' },
  { id: 'l002', text: 'やっと動いた', category: 'result' },
  { id: 'l003', text: '無事デプロイ', category: 'result' },
  { id: 'l004', text: '全部落ちた', category: 'result' },
  { id: 'l005', text: 'メモリリーク', category: 'result' },
  { id: 'l006', text: '無限ループ', category: 'result' },
  { id: 'l007', text: '完全復旧', category: 'result' },
  { id: 'l008', text: '原因不明', category: 'result' },
  { id: 'l009', text: '解決した', category: 'result' },
  { id: 'l010', text: 'また明日', category: 'result' },
  { id: 'l011', text: 'バグ発見', category: 'result' },
  { id: 'l012', text: 'テスト通った', category: 'result' },
  { id: 'l013', text: 'ビルド成功', category: 'result' },
  { id: 'l014', text: 'マージ完了', category: 'result' },
  { id: 'l015', text: 'リリース延期', category: 'result' },
  { id: 'l016', text: '本番障害', category: 'result' },
  { id: 'l017', text: '顧客満足', category: 'result' },
  { id: 'l018', text: 'パフォーマンス改善', category: 'result' },
  { id: 'l019', text: 'セキュリティホール', category: 'result' },
  { id: 'l020', text: '脆弱性発見', category: 'result' },
  { id: 'l021', text: 'データ消失', category: 'result' },
  { id: 'l022', text: 'バックアップなし', category: 'result' },
  { id: 'l023', text: 'ロールバック成功', category: 'result' },
  { id: 'l024', text: '切り戻し完了', category: 'result' },
  { id: 'l025', text: 'インシデント解決', category: 'result' },
  { id: 'l026', text: 'タスク完了', category: 'result' },
  { id: 'l027', text: 'プロジェクト終了', category: 'result' },
  { id: 'l028', text: 'スプリント完了', category: 'result' },
  { id: 'l029', text: 'レビュー通過', category: 'result' },
  { id: 'l030', text: '承認された', category: 'result' },
  { id: 'l031', text: '却下された', category: 'result' },
  { id: 'l032', text: '保留になった', category: 'result' },
  { id: 'l033', text: '延期決定', category: 'result' },
  { id: 'l034', text: '中止になった', category: 'result' },
  { id: 'l035', text: '大成功だ', category: 'result' },

  // 感情系（30個）
  { id: 'l036', text: '泣きそうだ', category: 'emotion' },
  { id: 'l037', text: '嬉しすぎる', category: 'emotion' },
  { id: 'l038', text: '疲れ果てた', category: 'emotion' },
  { id: 'l039', text: '達成感', category: 'emotion' },
  { id: 'l040', text: '虚無感', category: 'emotion' },
  { id: 'l041', text: '爆笑した', category: 'emotion' },
  { id: 'l042', text: '感動した', category: 'emotion' },
  { id: 'l043', text: 'やりきった', category: 'emotion' },
  { id: 'l044', text: 'もう無理', category: 'emotion' },
  { id: 'l045', text: '最高だ', category: 'emotion' },
  { id: 'l046', text: 'つらすぎる', category: 'emotion' },
  { id: 'l047', text: '楽しすぎる', category: 'emotion' },
  { id: 'l048', text: 'やばすぎる', category: 'emotion' },
  { id: 'l049', text: 'すごすぎる', category: 'emotion' },
  { id: 'l050', text: 'ありがたい', category: 'emotion' },
  { id: 'l051', text: '申し訳ない', category: 'emotion' },
  { id: 'l052', text: 'ほっとした', category: 'emotion' },
  { id: 'l053', text: 'びっくりした', category: 'emotion' },
  { id: 'l054', text: 'がっかりだ', category: 'emotion' },
  { id: 'l055', text: 'わくわくする', category: 'emotion' },
  { id: 'l056', text: 'ドキドキする', category: 'emotion' },
  { id: 'l057', text: 'イライラする', category: 'emotion' },
  { id: 'l058', text: 'モヤモヤする', category: 'emotion' },
  { id: 'l059', text: 'スッキリした', category: 'emotion' },
  { id: 'l060', text: 'ワクワクだ', category: 'emotion' },
  { id: 'l061', text: '感謝です', category: 'emotion' },
  { id: 'l062', text: '尊敬です', category: 'emotion' },
  { id: 'l063', text: '神だった', category: 'emotion' },
  { id: 'l064', text: '天才だ', category: 'emotion' },
  { id: 'l065', text: '奇跡だ', category: 'emotion' },

  // 日常系（20個）
  { id: 'l066', text: '腹ペコだ', category: 'daily' },
  { id: 'l067', text: '眠すぎる', category: 'daily' },
  { id: 'l068', text: 'コーヒー飲む', category: 'daily' },
  { id: 'l069', text: '帰りたい', category: 'daily' },
  { id: 'l070', text: '頑張ろう', category: 'daily' },
  { id: 'l071', text: 'ビール飲みたい', category: 'daily' },
  { id: 'l072', text: 'もう寝よう', category: 'daily' },
  { id: 'l073', text: '筋肉痛', category: 'daily' },
  { id: 'l074', text: '目が痛い', category: 'daily' },
  { id: 'l075', text: '幸せだ', category: 'daily' },
  { id: 'l076', text: '休みたい', category: 'daily' },
  { id: 'l077', text: '遊びたい', category: 'daily' },
  { id: 'l078', text: '勉強しよう', category: 'daily' },
  { id: 'l079', text: '運動しよう', category: 'daily' },
  { id: 'l080', text: '掃除しよう', category: 'daily' },
  { id: 'l081', text: 'ラーメン食べたい', category: 'daily' },
  { id: 'l082', text: 'カレー食べたい', category: 'daily' },
  { id: 'l083', text: '寿司食べたい', category: 'daily' },
  { id: 'l084', text: '温泉行きたい', category: 'daily' },
  { id: 'l085', text: '旅行したい', category: 'daily' },

  // ユーモア系（15個）
  { id: 'l086', text: 'それな', category: 'humor' },
  { id: 'l087', text: 'ワロタ', category: 'humor' },
  { id: 'l088', text: 'マジ卍', category: 'humor' },
  { id: 'l089', text: '草生える', category: 'humor' },
  { id: 'l090', text: '尊い', category: 'humor' },
  { id: 'l091', text: 'エモい', category: 'humor' },
  { id: 'l092', text: 'ヤバい', category: 'humor' },
  { id: 'l093', text: 'つらたん', category: 'humor' },
  { id: 'l094', text: 'ぴえん', category: 'humor' },
  { id: 'l095', text: '優勝', category: 'humor' },
  { id: 'l096', text: '無理ゲー', category: 'humor' },
  { id: 'l097', text: '詰んだ', category: 'humor' },
  { id: 'l098', text: 'ガチで', category: 'humor' },
  { id: 'l099', text: 'マジか', category: 'humor' },
  { id: 'l100', text: 'なるほど', category: 'humor' }
];

// カードデータをエクスポート用に整形
export const SENRYU_CARDS = {
  upper: UPPER_CARDS.map(card => ({ ...card, type: 'upper' as const })),
  middle: MIDDLE_CARDS.map(card => ({ ...card, type: 'middle' as const })),
  lower: LOWER_CARDS.map(card => ({ ...card, type: 'lower' as const }))
};

// ランダムにカードを取得する関数
export function getRandomCard(type: 'upper' | 'middle' | 'lower'): SenryuCard {
  const cards = SENRYU_CARDS[type];
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

// 川柳を生成する関数
export function generateSenryu(): { upper: SenryuCard; middle: SenryuCard; lower: SenryuCard } {
  return {
    upper: getRandomCard('upper'),
    middle: getRandomCard('middle'),
    lower: getRandomCard('lower')
  };
}

// カード総数の統計
export const CARD_STATISTICS = {
  total: UPPER_CARDS.length + MIDDLE_CARDS.length + LOWER_CARDS.length,
  combinations: UPPER_CARDS.length * MIDDLE_CARDS.length * LOWER_CARDS.length,
  byType: {
    upper: UPPER_CARDS.length,
    middle: MIDDLE_CARDS.length,
    lower: LOWER_CARDS.length
  },
  byCategory: {
    upper: {
      cloudnative: UPPER_CARDS.filter(c => c.category === 'cloudnative').length,
      action: UPPER_CARDS.filter(c => c.category === 'action').length,
      daily: UPPER_CARDS.filter(c => c.category === 'daily').length,
      emotion: UPPER_CARDS.filter(c => c.category === 'emotion').length
    },
    middle: {
      temporal: MIDDLE_CARDS.filter(c => c.category === 'temporal').length,
      quantity: MIDDLE_CARDS.filter(c => c.category === 'quantity').length,
      action: MIDDLE_CARDS.filter(c => c.category === 'action').length,
      state: MIDDLE_CARDS.filter(c => c.category === 'state').length
    },
    lower: {
      result: LOWER_CARDS.filter(c => c.category === 'result').length,
      emotion: LOWER_CARDS.filter(c => c.category === 'emotion').length,
      daily: LOWER_CARDS.filter(c => c.category === 'daily').length,
      humor: LOWER_CARDS.filter(c => c.category === 'humor').length
    }
  }
};