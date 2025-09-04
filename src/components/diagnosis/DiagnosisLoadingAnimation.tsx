"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Star, Moon, Sun, Zap, Eye, Heart, Shield, Gem, Feather } from "lucide-react";

// ユーモラスなメッセージも含めた豊富なステップ
const allDiagnosticSteps = [
  {
    icon: Star,
    title: "星座の配置を読み取っています",
    subtitle: "あなたの生まれ持った技術的素質を分析中...",
    color: "from-yellow-400 to-orange-500"
  },
  {
    icon: Moon,
    title: "月のサイクルから相性を導いています",
    subtitle: "お二人のコミュニケーションパターンを予測中...",
    color: "from-purple-400 to-pink-500"
  },
  {
    icon: Sparkles,
    title: "水晶玉がDockerコンテナの未来を映し出しています",
    subtitle: "「docker-compose up」の成功率を占い中...",
    color: "from-blue-400 to-indigo-500"
  },
  {
    icon: Eye,
    title: "タロットカードを展開しています",
    subtitle: "「愚者」のカードが...あ、それはjunior developerの暗示です",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: Zap,
    title: "五行のエネルギーバランスを計測中",
    subtitle: "木・火・土・金・水...あとKubernetesも追加で",
    color: "from-green-400 to-emerald-500"
  },
  {
    icon: Star,
    title: "宇宙の叡智にアクセス中...",
    subtitle: "Stack Overflowにも同時に問い合わせています",
    color: "from-purple-400 to-indigo-500"
  },
  {
    icon: Gem,
    title: "数秘術による運命数を算出しています",
    subtitle: "お二人の隠された才能と可能性を発見中...",
    color: "from-pink-400 to-rose-500"
  },
  {
    icon: Shield,
    title: "守護神からのメッセージを受信中",
    subtitle: "CloudNative の精霊があなたを導いています...",
    color: "from-indigo-400 to-purple-500"
  },
  {
    icon: Moon,
    title: "古代の占星術師に問い合わせ中",
    subtitle: "返事が遅いのでSlackでリマインドを送りました",
    color: "from-gray-400 to-purple-500"
  },
  {
    icon: Sun,
    title: "オーラカラーを解析しています",
    subtitle: "技術的波長の共鳴度を測定中...",
    color: "from-amber-400 to-yellow-500"
  },
  {
    icon: Feather,
    title: "天使のささやきを聞いています",
    subtitle: "「テスト書いた？」と聞こえました...",
    color: "from-teal-400 to-cyan-500"
  },
  {
    icon: Zap,
    title: "魔法陣でCI/CDパイプラインを構築中",
    subtitle: "デプロイの成功を祈祷しています🙏",
    color: "from-green-400 to-lime-500"
  },
  {
    icon: Heart,
    title: "チャクラのアライメントを調整中",
    subtitle: "エンジニアリングの相性を最終計算しています...",
    color: "from-red-400 to-pink-500"
  },
  {
    icon: Sparkles,
    title: "賢者の石でバグを金に変換中",
    subtitle: "失敗...やはりバグはバグのままでした",
    color: "from-yellow-400 to-amber-500"
  },
  {
    icon: Eye,
    title: "未来のプルリクエストを透視中",
    subtitle: "「LGTM」の文字が見えます...見えます...",
    color: "from-purple-400 to-pink-500"
  },
  {
    icon: Shield,
    title: "セキュリティの守護天使を召喚中",
    subtitle: "SQLインジェクションからお二人を守ります",
    color: "from-red-400 to-orange-500"
  },
  {
    icon: Gem,
    title: "技術スタックの宝石を鑑定中",
    subtitle: "React、Vue、Angular...全部使いたい欲張りさんですね",
    color: "from-cyan-400 to-teal-500"
  },
  {
    icon: Moon,
    title: "満月の夜にgit pushすると...",
    subtitle: "コンフリクトが3倍になるという言い伝えを検証中",
    color: "from-indigo-400 to-blue-500"
  },
  {
    icon: Sparkles,
    title: "魔法のコードレビューを実施中",
    subtitle: "「このコード、誰が書いたの？」あ、自分でした...",
    color: "from-pink-400 to-purple-500"
  },
  {
    icon: Star,
    title: "北極星がサーバーの方角を示しています",
    subtitle: "どうやらAWS us-east-1のようです",
    color: "from-blue-400 to-cyan-500"
  },
  {
    icon: Zap,
    title: "雷神がサーバーラックに宿りました",
    subtitle: "電源は大丈夫...多分...",
    color: "from-yellow-400 to-red-500"
  },
  {
    icon: Heart,
    title: "愛のアルゴリズムを最適化中",
    subtitle: "O(n²)からO(n log n)への改善を試みています",
    color: "from-rose-400 to-pink-500"
  },
  {
    icon: Sun,
    title: "太陽神がCPU使用率を祝福中",
    subtitle: "常時100%は熱い愛の証です",
    color: "from-orange-400 to-red-500"
  },
  {
    icon: Feather,
    title: "羽ペンでコミットメッセージを清書中",
    subtitle: "「fix: 修正」では味気ないですからね",
    color: "from-gray-400 to-blue-500"
  },
  {
    icon: Eye,
    title: "第三の目でnull pointerを探索中",
    subtitle: "undefined is not a function...また君か",
    color: "from-purple-400 to-indigo-500"
  },
  {
    icon: Shield,
    title: "ファイアウォールの結界を展開中",
    subtitle: "ポート22は...開いてます（汗）",
    color: "from-green-400 to-teal-500"
  },
  {
    icon: Gem,
    title: "Ruby on Railsの宝石を磨いています",
    subtitle: "gem install fate... そんなgemはありません",
    color: "from-red-400 to-pink-500"
  },
  {
    icon: Star,
    title: "GitHubスターの運勢を占い中",
    subtitle: "今日のラッキーリポジトリはKubernetesです",
    color: "from-gray-400 to-yellow-500"
  },
  {
    icon: Moon,
    title: "深夜のデバッグセッションを予言中",
    subtitle: "コーヒーを3杯用意することをお勧めします",
    color: "from-blue-400 to-purple-500"
  },
  {
    icon: Zap,
    title: "電撃デプロイの成功率を計算中",
    subtitle: "金曜日の夕方は避けましょう...絶対に",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: Sparkles,
    title: "キラキラエフェクトでバグを隠蔽中",
    subtitle: "「それは仕様です」の準備をしています",
    color: "from-purple-400 to-pink-500"
  },
  {
    icon: Heart,
    title: "ペアプログラミングの相性診断中",
    subtitle: "タブ派 vs スペース派の戦いが始まりそうです",
    color: "from-red-400 to-orange-500"
  },
  {
    icon: Sun,
    title: "朝日と共にビルドが成功する確率",
    subtitle: "早起きは三文の得...でもビルドは失敗しました",
    color: "from-yellow-400 to-orange-500"
  },
  {
    icon: Feather,
    title: "軽量フレームワークの精霊と交信中",
    subtitle: "「また新しいJSフレームワーク？」と言われました",
    color: "from-teal-400 to-green-500"
  },
  {
    icon: Eye,
    title: "コードの未来をGitHub Copilotに聞いています",
    subtitle: "AIも「よくわからない」と言っています",
    color: "from-indigo-400 to-purple-500"
  }
];

const floatingIcons = [
  { Icon: Star, delay: 0, duration: 3 },
  { Icon: Moon, delay: 0.5, duration: 3.5 },
  { Icon: Sun, delay: 1, duration: 4 },
  { Icon: Sparkles, delay: 1.5, duration: 3.2 },
  { Icon: Zap, delay: 2, duration: 3.8 }
];

interface DiagnosisLoadingAnimationProps {
  isLoading: boolean;
}

export function DiagnosisLoadingAnimation({ isLoading }: DiagnosisLoadingAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [randomSteps, setRandomSteps] = useState<typeof allDiagnosticSteps>([]);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(0);
      setProgress(0);
      return;
    }

    // ランダムな順序でステップを選択（重複なし）
    const shuffled = [...allDiagnosticSteps].sort(() => Math.random() - 0.5);
    setRandomSteps(shuffled);

    // ステップを2.5秒ごとに切り替え
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % shuffled.length);
    }, 2500);

    // プログレスバーを更新
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // 95%で止める（完了は実際の診断終了時）
        return prev + Math.random() * 2;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  if (!isLoading || randomSteps.length === 0) return null;

  const currentStepData = randomSteps[currentStepIndex];
  const Icon = currentStepData.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-lg flex items-center justify-center"
    >
      {/* 背景の浮遊アイコン */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingIcons.map(({ Icon: FloatingIcon, delay, duration }, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ 
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
              y: typeof window !== 'undefined' ? window.innerHeight + 100 : 800
            }}
            animate={{
              y: -100,
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "linear"
            }}
          >
            <FloatingIcon className="w-8 h-8 text-white/10" />
          </motion.div>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-2xl w-full px-8">
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* メインアイコン */}
          <motion.div
            className="relative inline-block mb-8"
            animate={{ 
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {/* 光の輪 */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${currentStepData.color} blur-xl`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
            <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${currentStepData.color} p-1`}>
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <Icon className="w-16 h-16 text-white" />
              </div>
            </div>
          </motion.div>

          {/* ステップテキスト */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className={`text-3xl font-bold bg-gradient-to-r ${currentStepData.color} bg-clip-text text-transparent mb-3`}>
                {currentStepData.title}
              </h2>
              <p className="text-gray-400 text-lg">
                {currentStepData.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* プログレスバー */}
          <div className="relative">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${currentStepData.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-400">診断進行中...</span>
              <span className="text-gray-400">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* パルスアニメーション */}
          <div className="mt-8 flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>

          {/* 励ましメッセージ */}
          <motion.p
            className="mt-8 text-sm text-gray-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            宇宙の叡智があなたたちの相性を紐解いています...
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}