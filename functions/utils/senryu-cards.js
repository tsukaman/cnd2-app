// Senryu card data for Cloudflare Functions
// Total: 100 x 100 x 100 = 1,000,000 combinations

export const UPPER_CARDS = [
  { id: 'u001', text: 'Kubernetes', category: 'cloudnative', type: 'upper' },
  { id: 'u002', text: 'Docker', category: 'cloudnative', type: 'upper' },
  { id: 'u003', text: 'Prometheus', category: 'cloudnative', type: 'upper' },
  { id: 'u004', text: 'Grafana', category: 'cloudnative', type: 'upper' },
  { id: 'u005', text: 'Terraform', category: 'cloudnative', type: 'upper' },
  { id: 'u006', text: 'CI/CD', category: 'cloudnative', type: 'upper' },
  { id: 'u007', text: 'マイクロサービス', category: 'cloudnative', type: 'upper' },
  { id: 'u008', text: 'サーバーレス', category: 'cloudnative', type: 'upper' },
  { id: 'u009', text: 'オブザーバビリティ', category: 'cloudnative', type: 'upper' },
  { id: 'u010', text: 'GitOps', category: 'cloudnative', type: 'upper' },
];

export const MIDDLE_CARDS = [
  { id: 'm001', text: '朝から夜まで', category: 'temporal', type: 'middle' },
  { id: 'm002', text: 'コンテナいっぱい', category: 'quantity', type: 'middle' },
  { id: 'm003', text: 'スケールアウトして', category: 'action', type: 'middle' },
  { id: 'm004', text: 'ローリングアップデート', category: 'action', type: 'middle' },
  { id: 'm005', text: 'レプリカ増やして', category: 'action', type: 'middle' },
  { id: 'm006', text: 'メトリクス見ながら', category: 'action', type: 'middle' },
  { id: 'm007', text: 'ログを追いかけ', category: 'action', type: 'middle' },
  { id: 'm008', text: 'アラート鳴りまくり', category: 'state', type: 'middle' },
  { id: 'm009', text: '障害対応', category: 'action', type: 'middle' },
  { id: 'm010', text: 'デプロイ失敗', category: 'result', type: 'middle' },
];

export const LOWER_CARDS = [
  { id: 'l001', text: 'ずっとエラー', category: 'result', type: 'lower' },
  { id: 'l002', text: '腹ペコだ', category: 'daily', type: 'lower' },
  { id: 'l003', text: '成功した', category: 'result', type: 'lower' },
  { id: 'l004', text: '失敗した', category: 'result', type: 'lower' },
  { id: 'l005', text: '動いた！', category: 'result', type: 'lower' },
  { id: 'l006', text: '動かない', category: 'result', type: 'lower' },
  { id: 'l007', text: 'なぜだろう', category: 'emotion', type: 'lower' },
  { id: 'l008', text: 'わからない', category: 'emotion', type: 'lower' },
  { id: 'l009', text: 'できた！', category: 'result', type: 'lower' },
  { id: 'l010', text: 'やったね！', category: 'emotion', type: 'lower' },
];