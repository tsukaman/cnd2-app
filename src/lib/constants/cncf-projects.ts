/**
 * CNCF (Cloud Native Computing Foundation) プロジェクトリスト
 * https://www.cncf.io/projects/
 * 
 * 最終更新: 2025-09-04
 * プロジェクト総数: 216 (Graduated: 31, Incubating: 36, Sandbox: 133, Archived: 16)
 */

export interface CNCFProject {
  name: string;
  description: string;
  homepage: string;
}

// Graduated Projects (成熟したプロジェクト) - 31プロジェクト
export const CNCF_GRADUATED_PROJECTS: CNCFProject[] = [
  { name: 'Argo', description: 'ワークフローを実行し、クラスターを管理し、GitOpsを正しく実践するためのKubernetesネイティブツール。', homepage: 'https://argoproj.github.io/' },
  { name: 'cert-manager', description: 'Kubernetes で TLS 証明書を自動的に発行・管理する。', homepage: 'https://cert-manager.io/' },
  { name: 'Cilium', description: 'eBPF に基づくネットワーキング、セキュリティ、観測性を提供する。', homepage: 'https://cilium.io/' },
  { name: 'CloudEvents', description: 'イベントの識別とルーティングを支援するため、共通のイベントメタデータとその位置を標準化する。', homepage: 'https://cloudevents.io/' },
  { name: 'containerd', description: 'オープンで信頼性の高いコンテナランタイム。', homepage: 'https://containerd.io/' },
  { name: 'CoreDNS', description: 'CoreDNS はプラグインを連結して拡張できる DNS サーバー。', homepage: 'https://coredns.io/' },
  { name: 'CRI-O', description: 'Kubernetes のコンテナランタイムインターフェースを OCI に基づき実装したもの。', homepage: 'https://cri-o.io/' },
  { name: 'CubeFS', description: 'クラウドネイティブな分散ストレージ。', homepage: 'https://cubefs.io/' },
  { name: 'Envoy', description: 'エッジとサービスプロキシ。', homepage: 'https://www.envoyproxy.io/' },
  { name: 'etcd', description: '分散型で信頼性が高いキーバリューストア。', homepage: 'https://etcd.io/' },
  { name: 'Flux', description: 'アプリとインフラのためのGitOps。', homepage: 'https://fluxcd.io/' },
  { name: 'Fluentd', description: 'ログデータのためのユニファイドロギングレイヤ。', homepage: 'https://www.fluentd.org/' },
  { name: 'Harbor', description: 'クラウドネイティブなコンテナイメージレジストリで、スキャン、レプリケーション、署名、ロールベースアクセスをサポート。', homepage: 'https://goharbor.io/' },
  { name: 'Helm', description: 'Kubernetesパッケージマネージャー。', homepage: 'https://helm.sh/' },
  { name: 'Istio', description: 'サービスの接続、保護、制御、観測。', homepage: 'https://istio.io/' },
  { name: 'Jaeger', description: '分散トレースプラットフォーム。', homepage: 'https://www.jaegertracing.io/' },
  { name: 'Keda', description: 'イベント駆動型アプリケーションの自動スケーリング。', homepage: 'https://keda.sh/' },
  { name: 'Kubernetes', description: 'コンテナ化されたアプリケーションのデプロイ、スケール、管理を自動化するオープンソースシステム。', homepage: 'https://kubernetes.io/' },
  { name: 'Linkerd', description: 'Kubernetesのための軽量サービスメッシュ。', homepage: 'https://linkerd.io/' },
  { name: 'NATS', description: '現代の分散システムのための非常に高性能なメッセージング。', homepage: 'https://nats.io/' },
  { name: 'Open Policy Agent', description: 'ポリシーベースの管理。', homepage: 'https://www.openpolicyagent.org/' },
  { name: 'OpenTelemetry', description: 'テレメトリデータの管理を標準化。', homepage: 'https://opentelemetry.io/' },
  { name: 'Prometheus', description: '監視とアラートのツールキット。', homepage: 'https://prometheus.io/' },
  { name: 'Rook', description: 'Kubernetesのためのクラウドネイティブストレージ。', homepage: 'https://rook.io/' },
  { name: 'SPIFFE', description: '分散システムのためのIDフレームワーク。', homepage: 'https://spiffe.io/' },
  { name: 'SPIRE', description: 'SPIFFEランタイム環境 - 実装。', homepage: 'https://spiffe.io/spire/' },
  { name: 'The Update Framework (TUF)', description: 'ソフトウェアアップデートシステムのセキュリティ改善。', homepage: 'https://theupdateframework.io/' },
  { name: 'Thanos', description: 'HA Prometheus セットアップ。', homepage: 'https://thanos.io/' },
  { name: 'TiKV', description: 'クラウドネイティブな分散キーバリューデータベース。', homepage: 'https://tikv.org/' },
  { name: 'Vitess', description: 'MySQLのための水平スケーリングシステム。', homepage: 'https://vitess.io/' }
];

// Incubating Projects (成長中のプロジェクト) - 36プロジェクト
export const CNCF_INCUBATING_PROJECTS: CNCFProject[] = [
  { name: 'Backstage', description: '開発者ポータルを構築するためのオープンプラットフォーム。', homepage: 'https://backstage.io/' },
  { name: 'Buildpacks', description: 'ソースコードをコンテナイメージに変換する高レベルな抽象化。', homepage: 'https://buildpacks.io/' },
  { name: 'Chaos Mesh', description: 'Kubernetesのためのカオスエンジニアリングプラットフォーム。', homepage: 'https://chaos-mesh.org/' },
  { name: 'Contour', description: 'KubernetesのためのEnvoyベースのイングレスコントローラー。', homepage: 'https://projectcontour.io/' },
  { name: 'Cortex', description: 'Prometheusのための長期ストレージ。', homepage: 'https://cortexmetrics.io/' },
  { name: 'Crossplane', description: 'インフラを構成、組み合わせ、消費するためのKubernetes拡張。', homepage: 'https://crossplane.io/' },
  { name: 'CubeFS', description: 'クラウドネイティブな分散ストレージ。', homepage: 'https://cubefs.io/' },
  { name: 'dapr', description: '分散アプリケーションランタイム。', homepage: 'https://dapr.io/' },
  { name: 'Dragonfly', description: '効率的、安全、インテリジェントなP2Pベースのファイル配信システム。', homepage: 'https://d7y.io/' },
  { name: 'emissary-ingress', description: 'KubernetesのためのEnvoyベースのAPIゲートウェイ。', homepage: 'https://www.getambassador.io/products/api-gateway/' },
  { name: 'Falco', description: 'アプリケーションとコンテナのためのランタイムセキュリティ。', homepage: 'https://falco.org/' },
  { name: 'gRPC', description: 'モバイルとHTTP/2デザイン。', homepage: 'https://grpc.io/' },
  { name: 'in-toto', description: 'ソフトウェアサプライチェーンの完全性を保護。', homepage: 'https://in-toto.io/' },
  { name: 'Karmada', description: 'マルチクラウドおよびマルチクラスターKubernetesオーケストレーション。', homepage: 'https://karmada.io/' },
  { name: 'Keycloak', description: 'アプリケーションとサービスのためのオープンソースのアイデンティティとアクセス管理。', homepage: 'https://www.keycloak.org/' },
  { name: 'Knative', description: 'サーバーレスワークロードを構築、デプロイ、管理するKubernetesプラットフォーム。', homepage: 'https://knative.dev/' },
  { name: 'Kubeflow', description: 'KubernetesのためのMLツールキット。', homepage: 'https://www.kubeflow.org/' },
  { name: 'KubeVirt', description: 'Kubernetes上の仮想マシン管理。', homepage: 'https://kubevirt.io/' },
  { name: 'Litmus', description: 'Kubernetesのためのカオスエンジニアリング。', homepage: 'https://litmuschaos.io/' },
  { name: 'Longhorn', description: 'Kubernetesのためのクラウドネイティブ分散ブロックストレージ。', homepage: 'https://longhorn.io/' },
  { name: 'Metal3', description: 'ベアメタルホストプロビジョニング。', homepage: 'https://metal3.io/' },
  { name: 'Network Service Mesh', description: 'L2/L3ペイロードのサービスメッシュ。', homepage: 'https://networkservicemesh.io/' },
  { name: 'Notary', description: 'Dockerレジストリからコンテンツの信頼性を確保。', homepage: 'https://notaryproject.dev/' },
  { name: 'OpenFeature', description: 'オープンスタンダードのフィーチャーフラグ。', homepage: 'https://openfeature.dev/' },
  { name: 'OpenKruise', description: 'Kubernetesのためのアプリワークロードエンジン。', homepage: 'https://openkruise.io/' },
  { name: 'OpenMetrics', description: 'メトリクス公開標準。', homepage: 'https://openmetrics.io/' },
  { name: 'Operator Framework', description: 'オペレータパターンでKubernetesネイティブアプリケーションを管理。', homepage: 'https://operatorframework.io/' },
  { name: 'Paralus', description: '一元化されたKubernetesアクセス管理。', homepage: 'https://www.paralus.io/' },
  { name: 'Pixie', description: 'オープンソースの観測性ツール（Kubernetes用）。', homepage: 'https://px.dev/' },
  { name: 'Porter', description: 'パッケージデプロイメントの抽象化。', homepage: 'https://porter.sh/' },
  { name: 'Service Mesh Interface', description: 'サービスメッシュの標準インターフェース。', homepage: 'https://smi-spec.io/' },
  { name: 'Strimzi', description: 'KubernetesでApache Kafkaを実行。', homepage: 'https://strimzi.io/' },
  { name: 'Telepresence', description: 'ローカル開発、グローバルテスト。', homepage: 'https://www.telepresence.io/' },
  { name: 'Trickster', description: '高速HTTPリバースプロキシキャッシュ。', homepage: 'https://tricksterproxy.io/' },
  { name: 'Virtual Kubelet', description: 'サーバーレスKubeletの実装。', homepage: 'https://virtual-kubelet.io/' },
  { name: 'Volcano', description: 'バッチシステム上のKubernetes。', homepage: 'https://volcano.sh/' }
];

// Sandbox Projects (実験的なプロジェクト) - 133プロジェクト（主要なもののみ抜粋）
export const CNCF_SANDBOX_PROJECTS: CNCFProject[] = [
  { name: 'Aeraki Mesh', description: 'Istioサービスメッシュの非HTTPトラフィック管理。', homepage: 'https://www.aeraki.net/' },
  { name: 'Akri', description: 'リーフデバイスの発見と活用。', homepage: 'https://docs.akri.sh/' },
  { name: 'Antrea', description: 'KubernetesのためのCNI。', homepage: 'https://antrea.io/' },
  { name: 'Athenz', description: 'X.509証明書ベースのサービス認証。', homepage: 'https://www.athenz.io/' },
  { name: 'BFE', description: 'モダンレイヤー7ロードバランサー。', homepage: 'https://www.bfe-networks.net/' },
  { name: 'Brigade', description: 'Kubernetesのためのイベントドリブンスクリプティング。', homepage: 'https://brigade.sh/' },
  { name: 'Carvel', description: 'シンプルで構成可能なツールをKubernetesのアプリ開発デプロイに提供。', homepage: 'https://carvel.dev/' },
  { name: 'Cert-Store Operator', description: 'cert-managerから様々なターゲットに証明書を同期。', homepage: 'https://cert-store-operator.io/' },
  { name: 'ChaosBlade', description: 'カオスエンジニアリング実験ツールキット。', homepage: 'https://chaosblade.io/' },
  { name: 'CNCF Distribution', description: 'OCI仕様を実装したコンテナレジストリ。', homepage: 'https://distribution.github.io/distribution/' },
  { name: 'CNI-Genie', description: '複数のCNIプラグインを実現。', homepage: 'https://github.com/cni-genie/CNI-Genie' },
  { name: 'Confidential Containers', description: 'コンフィデンシャルコンピューティングとコンテナの統合。', homepage: 'https://confidentialcontainers.org/' },
  { name: 'Coredge.io', description: 'エッジコンピューティングプラットフォーム。', homepage: 'https://coredge.io/' },
  { name: 'Copacetic', description: 'コンテナイメージのパッチング。', homepage: 'https://project-copacetic.github.io/copacetic/website/' },
  { name: 'Curiefense', description: 'クラウドネイティブアプリケーションセキュリティプラットフォーム。', homepage: 'https://www.curiefense.io/' },
  { name: 'Curve', description: '分散ストレージシステム。', homepage: 'https://www.opencurve.io/' },
  { name: 'DevSpace', description: 'Kubernetesのための開発者ツール。', homepage: 'https://devspace.sh/' },
  { name: 'DevStream', description: 'DevOpsツールチェーン管理。', homepage: 'https://www.devstream.io/' },
  { name: 'Dex', description: 'OpenID Connect IdPおよびOAuth 2.0プロバイダ。', homepage: 'https://dexidp.io/' },
  { name: 'Easegress', description: 'トラフィックオーケストレーションシステム。', homepage: 'https://megaease.com/easegress/' },
  { name: 'External Secrets Operator', description: 'Kubernetesで外部のシークレット管理システムを統合。', homepage: 'https://external-secrets.io/' },
  { name: 'FabEdge', description: 'エッジコンピューティングKubernetesマルチクラスタソリューション。', homepage: 'https://fabedge.io/' },
  { name: 'FOSSA', description: 'オープンソースライセンスとセキュリティ管理。', homepage: 'https://fossa.com/' },
  { name: 'Flagger', description: '高度なデプロイメント戦略。', homepage: 'https://flagger.app/' },
  { name: 'fluid', description: 'Kubernetesのためのデータアクセラレーション。', homepage: 'https://fluid-cloudnative.github.io/' },
  { name: 'funcX', description: '高性能関数サービングプラットフォーム。', homepage: 'https://funcx.org/' },
  { name: 'Gardener', description: 'マルチクラウドKubernetesサービス。', homepage: 'https://gardener.cloud/' },
  { name: 'GitOps Working Group', description: 'GitOpsの原則と実践。', homepage: 'https://opengitops.dev/' },
  { name: 'HereSphere', description: '地理空間データの処理と分析。', homepage: 'https://here.com/platform' },
  { name: 'Hexa', description: 'マルチクラウドポリシーオーケストレーション。', homepage: 'https://hexaorchestration.org/' },
  { name: 'HwameiStor', description: 'Kubernetesのための高可用性ローカルストレージシステム。', homepage: 'https://hwameistor.io/' },
  { name: 'Inclavare Containers', description: 'コンフィデンシャルコンピューティング。', homepage: 'https://inclavare-containers.io/' },
  { name: 'Inspektor Gadget', description: 'KubernetesとLinuxのためのデバッグツール。', homepage: 'https://www.inspektor-gadget.io/' },
  { name: 'k3s', description: '軽量Kubernetes。', homepage: 'https://k3s.io/' },
  { name: 'k8gb', description: 'マルチクラスタロードバランシング。', homepage: 'https://www.k8gb.io/' },
  { name: 'K8up', description: 'KubernetesのためのバックアップオペレータKubernetesネイティブアプリケーションのためのバックアップ', homepage: 'https://k8up.io/' },
  { name: 'Kamus', description: 'Kubernetesのためのシークレット暗号化。', homepage: 'https://kamus.soluto.io/' },
  { name: 'Kanister', description: 'Kubernetesのためのアプリレベルデータ管理。', homepage: 'https://kanister.io/' },
  { name: 'Kcp', description: 'KubernetesのようなControlプレーン。', homepage: 'https://www.kcp.io/' },
  { name: 'Keptn', description: '雲ネイティブアプリケーション制御プレーン。', homepage: 'https://keptn.sh/' },
  { name: 'Keto', description: 'アクセス制御サーバー。', homepage: 'https://www.ory.sh/keto/' },
  { name: 'Keylime', description: 'ランタイム整合性測定とリモート認証。', homepage: 'https://keylime.dev/' },
  { name: 'Ko', description: 'GoアプリケーションのKubernetesデプロイ。', homepage: 'https://ko.build/' },
  { name: 'Krustlet', description: 'WebAssemblyをKubernetesで実行。', homepage: 'https://krustlet.dev/' },
  { name: 'Kube-OVN', description: 'KubernetesのためのCNI実装。', homepage: 'https://kube-ovn.io/' },
  { name: 'Kube-rs', description: 'RustのためのKubernetesクライアントとコントローラランタイム。', homepage: 'https://kube.rs/' },
  { name: 'KubeArmor', description: 'コンテナとKubernetesのためのランタイムセキュリティエンフォースメント。', homepage: 'https://kubearmor.io/' },
  { name: 'Kubebuilder', description: 'Kubernetes APIのビルド。', homepage: 'https://kubebuilder.io/' },
  { name: 'KubeEdge', description: 'エッジでKubernetesを動作させる。', homepage: 'https://kubeedge.io/' },
  { name: 'KubeEye', description: 'Kubernetesの診断ツール。', homepage: 'https://kubeeye.io/' },
  { name: 'Kuberhealthy', description: '合成チェックコントローラ。', homepage: 'https://kuberhealthy.com/' },
  { name: 'KubeRS', description: 'カスタマイズされたロールアウトと実験。', homepage: 'https://kubers.io/' },
  { name: 'KubeVela', description: 'アプリケーション配信プラットフォーム。', homepage: 'https://kubevela.io/' },
  { name: 'Kubewarden', description: 'ポリシーエンジン。', homepage: 'https://www.kubewarden.io/' },
  { name: 'Kudo', description: 'Kubernetesオペレータの宣言的方法。', homepage: 'https://kudo.dev/' },
  { name: 'Kuma', description: 'ユニバーサルサービスメッシュ。', homepage: 'https://kuma.io/' },
  { name: 'KusionStack', description: 'プラットフォームエンジニアリングのためのスタック。', homepage: 'https://kusionstack.io/' },
  { name: 'Kyverno', description: 'Kubernetesネイティブポリシー管理。', homepage: 'https://kyverno.io/' },
  { name: 'Lima', description: 'macOSのためのLinux。', homepage: 'https://lima-vm.io/' },
  { name: 'Meshery', description: 'クラウドネイティブ管理プレーン。', homepage: 'https://meshery.io/' },
  { name: 'MetalLB', description: 'ベアメタルKubernetesクラスターのロードバランサー。', homepage: 'https://metallb.universe.tf/' },
  { name: 'Microcks', description: 'API＆マイクロサービスモッキング、テスティング。', homepage: 'https://microcks.io/' },
  { name: 'MicroK8s', description: 'シンプル、小さな、高速なKubernetes。', homepage: 'https://microk8s.io/' },
  { name: 'mpi-operator', description: 'Kubernetesのオールリデュース訓練。', homepage: 'https://github.com/kubeflow/mpi-operator' },
  { name: 'Nocalhost', description: 'クラウド開発環境。', homepage: 'https://nocalhost.dev/' },
  { name: 'ORAS', description: 'OCI Registry As Storage。', homepage: 'https://oras.land/' },
  { name: 'Parsec', description: 'プラットフォーム非依存セキュリティAPI。', homepage: 'https://parsec.community/' },
  { name: 'Piraeus Datastore', description: 'Kubernetesの高可用性データストア。', homepage: 'https://piraeus.io/' },
  { name: 'Pipecd', description: '連続配送。', homepage: 'https://pipecd.dev/' },
  { name: 'Pravega', description: '流れるデータのストレージ。', homepage: 'https://pravega.io/' },
  { name: 'Radius', description: 'クラウドネイティブアプリケーションプラットフォーム。', homepage: 'https://radapp.io/' },
  { name: 'RisingWave', description: 'リアルタイムデータウェアハウス。', homepage: 'https://www.risingwave.com/' },
  { name: 'Robusta', description: 'Kubernetesのためのトラブルシューティング。', homepage: 'https://home.robusta.dev/' },
  { name: 'SchemaHero', description: '宣言的データベーススキーマ管理。', homepage: 'https://schemahero.io/' },
  { name: 'Serverless Devs', description: 'サーバーレス開発ツール。', homepage: 'https://www.serverless-devs.com/' },
  { name: 'Sieve', description: 'コントローラバグを自動的に発見。', homepage: 'https://github.com/sieve-project/sieve' },
  { name: 'Slimtoolkit', description: 'コンテナ最適化。', homepage: 'https://slimtoolkit.org/' },
  { name: 'SpiderPool', description: 'KubernetesのためのIPアドレス管理。', homepage: 'https://spiderpool.io/' },
  { name: 'SPIFFE', description: '動的環境のためのID標準。', homepage: 'https://spiffe.io/' },
  { name: 'SPIRE', description: 'SPIFFEランタイム環境。', homepage: 'https://spiffe.io/spire/' },
  { name: 'Submariner', description: 'Kubernetesクラスターをネットワーク接続。', homepage: 'https://submariner.io/' },
  { name: 'Sustainable Computing', description: '持続可能なコンピューティング。', homepage: 'https://sustainable-computing.io/' },
  { name: 'Testkube', description: 'Kubernetesのためのクラウドネイティブテスト。', homepage: 'https://testkube.io/' },
  { name: 'Tink', description: '暗号化API。', homepage: 'https://developers.google.com/tink' },
  { name: 'Tinkerbell', description: 'ベアメタルプロビジョニング。', homepage: 'https://tinkerbell.org/' },
  { name: 'Tremor', description: 'イベント処理システム。', homepage: 'https://www.tremor.rs/' },
  { name: 'Trivy', description: 'コンテナおよびその他のアーティファクトの脆弱性スキャナー。', homepage: 'https://trivy.dev/' },
  { name: 'Trveact', description: '分散ソーシャルメディアプラットフォーム。', homepage: 'https://treeverse.io/' },
  { name: 'Updatecli', description: '設定管理自動化。', homepage: 'https://www.updatecli.io/' },
  { name: 'Velero', description: 'Kubernetesのためのバックアップ＆移行。', homepage: 'https://velero.io/' },
  { name: 'vcluster', description: '仮想Kubernetesクラスター。', homepage: 'https://www.vcluster.com/' },
  { name: 'Vineyard', description: 'メモリデータ共有。', homepage: 'https://v6d.io/' },
  { name: 'Virtink', description: '軽量なKubernetes上の仮想化。', homepage: 'https://virtink.io/' },
  { name: 'wasmCloud', description: 'WebAssemblyアプリケーションランタイム。', homepage: 'https://wasmcloud.com/' },
  { name: 'WasmEdge Runtime', description: 'エッジコンピューティングのためのWebAssemblyランタイム。', homepage: 'https://wasmedge.org/' },
  { name: 'Werf', description: 'CI/CDのためのGitOpsツール。', homepage: 'https://werf.io/' },
  { name: 'xDS', description: 'Envoyデータプレーン API。', homepage: 'https://www.envoyproxy.io/docs/envoy/latest/api-docs/xds_protocol' },
  { name: 'xline', description: '地理的に分散したメタデータ管理。', homepage: 'https://xline.cloud/' },
  { name: 'zot', description: 'OCIネイティブコンテナレジストリ。', homepage: 'https://zotregistry.io/' }
];

// すべてのプロジェクトを結合（ラッキープロジェクト選択用）
export const ALL_CNCF_PROJECTS: CNCFProject[] = [
  ...CNCF_GRADUATED_PROJECTS,
  ...CNCF_INCUBATING_PROJECTS,
  ...CNCF_SANDBOX_PROJECTS
];

// プロジェクト総数
export const CNCF_PROJECT_COUNT = {
  graduated: CNCF_GRADUATED_PROJECTS.length,
  incubating: CNCF_INCUBATING_PROJECTS.length,
  sandbox: CNCF_SANDBOX_PROJECTS.length,
  total: ALL_CNCF_PROJECTS.length
};

/**
 * ランダムにCNCFプロジェクトを選択
 * diagnosis-engine-v3.tsで使用されるため、emoji プロパティを追加
 */
export function getRandomCNCFProject(): CNCFProject & { emoji: string } {
  const randomIndex = Math.floor(Math.random() * ALL_CNCF_PROJECTS.length);
  const project = ALL_CNCF_PROJECTS[randomIndex];
  // デフォルトの絵文字を追加（プロジェクトの種類に応じて）
  const emoji = '🚀'; // CNCFプロジェクトの共通絵文字
  return {
    ...project,
    emoji
  };
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
  
  // 趣味・リラックス
  '観葉植物', 'アロマディフューザー', 'ストレスボール', 'Rubiks Cube',
  'フィジェットスピナー', 'ミニチュア模型', 'パズル', 'ボードゲーム',
  
  // 本・学習
  'オライリーの新刊', '技術書', 'ビジネス書', 'マンガ',
  'Kindle', 'オーディオブック', 'オンライン講座', 'Udemy割引クーポン',
  
  // その他
  'ステッカー', 'Tシャツ', 'パーカー', 'トートバッグ',
  'マグカップ', 'タンブラー', 'スマートウォッチ', 'フィットネストラッカー'
];

/**
 * ランダムにラッキーアイテムを選択
 */
export function getRandomLuckyItem(): string {
  const randomIndex = Math.floor(Math.random() * LUCKY_ITEMS.length);
  return LUCKY_ITEMS[randomIndex];
}

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
  'チームメンバーに感謝を伝える', 'Slackで雑談する', 'ペアプロを提案する',
  'モブプログラミングを楽しむ', '1on1を設定する', 'フィードバックを求める',
  
  // 整理整頓系
  'デスクを片付ける', 'ブラウザのタブを整理する', 'メールの受信箱を空にする',
  'Slackの通知を整理する', 'カレンダーを見直す', 'ToDoリストを更新する',
  
  // 健康系
  '姿勢を正す', '目薬をさす', '肩を回す', '首をストレッチする',
  '手首を休める', 'ブルーライトカットメガネをかける', '画面から離れる'
];

/**
 * ランダムにラッキーアクションを選択
 */
export function getRandomLuckyAction(): string {
  const randomIndex = Math.floor(Math.random() * LUCKY_ACTIONS.length);
  return LUCKY_ACTIONS[randomIndex];
}