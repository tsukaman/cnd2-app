/**
 * CNCF (Cloud Native Computing Foundation) プロジェクトリスト
 * Cloudflare Functions用
 */

// 全プロジェクトリスト（PR #123より）
export const CNCF_PROJECTS = [
  // Graduated Projects
  'Kubernetes', 'Prometheus', 'Envoy', 'CoreDNS', 'containerd', 'Fluentd', 'Harbor', 'Helm',
  'Jaeger', 'etcd', 'TUF', 'Vitess', 'Argo', 'Cilium', 'CloudEvents', 'CNI', 'Flux', 'SPIFFE',
  
  // Incubating Projects
  'OpenTelemetry', 'Linkerd', 'gRPC', 'NATS', 'Notary', 'Rook', 'Thanos', 'Buildpacks',
  'Falco', 'Dragonfly', 'Crossplane', 'Contour', 'Cortex', 'CRI-O', 'Chaos Mesh', 'Dapr',
  'KubeVirt', 'Longhorn',
  
  // Sandbox Projects (主要なもののみ抜粋)
  'Keptn', 'Kyverno', 'KEDA', 'Metal³', 'Volcano', 'OpenEBS', 'LitmusChaos', 'Artifact Hub',
  'Backstage', 'Cert-Manager', 'ChaosBlade', 'Cloud Custodian', 'Crane', 'Dex', 'External Secrets',
  'K8up', 'Karmada', 'KubeArmor', 'KubeEdge', 'Kuberhealthy', 'Kuma', 'Lima', 'Meshery',
  'Open Service Mesh', 'OpenGitOps', 'OpenKruise', 'Paralus', 'Porter', 'Pravega', 'SchemaHero',
  'Serverless Devs', 'SLSA', 'SPIRE', 'Strimzi', 'Submariner', 'Telepresence', 'Teller',
  'Tinkerbell', 'Tremor', 'vArmor', 'Virtual Kubelet', 'WasmEdge', 'Zot'
];

/**
 * ランダムにCNCFプロジェクトを選択
 */
export function getRandomCNCFProject() {
  return CNCF_PROJECTS[Math.floor(Math.random() * CNCF_PROJECTS.length)];
}