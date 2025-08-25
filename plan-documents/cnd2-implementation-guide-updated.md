# CND² (CND Squared) Claude Code実装ガイド
## CloudNative Days Winter 2025 相性診断アプリ

---

## 🚀 プロジェクト概要

| 項目 | 内容 |
|------|------|
| **アプリ名** | CND² (CND Squared) |
| **正式名称** | CloudNative Days × Connect 'n' Discover |
| **タグライン** | CND × CnD = Your Connection² |
| **ハッシュタグ** | #CNDxCnD |
| **開発期間** | 2025年8月24日〜11月17日 |
| **本番稼働** | 2025年11月18-19日 |
| **開発ツール** | Claude Code |

---

## 📁 Phase 1: プロジェクト初期化（Day 1-2）

### Step 1: プロジェクト作成
```bash
# 1. プロジェクトディレクトリ作成
mkdir cnd2-app
cd cnd2-app

# 2. Next.js 14プロジェクトを初期化
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# 設定後の追加推奨設定
ESLintを選択した後、.eslintrc.jsonに以下を追加すると良いでしょう

{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "off",  // CND²のロゴ画像用
    "react/no-unescaped-entities": "off"  // 「²」記号対応
  }
}

# 3. 必要なパッケージをインストール
npm install \
  openai \
  cheerio \
  qrcode \
  nanoid \
  framer-motion \
  three @react-three/fiber @react-three/drei \
  react-confetti \
  react-hot-toast \
  sonner \
  lucide-react

# 4. 開発用パッケージ
npm install -D \
  @types/qrcode \
  @types/three \
  @types/cheerio \
  vitest \
  @testing-library/react \
  wrangler
```

### Step 2: プロジェクト構造作成
```bash
# ディレクトリ構造を作成
mkdir -p src/{components,lib,hooks,config,types,styles}
mkdir -p src/app/{api,duo,group,result}
mkdir -p src/components/{ui,diagnosis,prairie,effects}
mkdir -p public/{fonts,images,sounds}
mkdir -p tests/{unit,integration,e2e}
mkdir -p workers/{api,cache}
```

### プロジェクト構造
```
cnd2-app/
├── src/
│   ├── app/
│   │   ├── page.tsx          # メインページ
│   │   ├── layout.tsx        # レイアウト
│   │   ├── globals.css       # グローバルCSS
│   │   ├── duo/              # 2人診断
│   │   ├── group/            # グループ診断
│   │   └── result/           # 結果表示
│   ├── components/
│   │   ├── ui/               # UIコンポーネント
│   │   ├── diagnosis/        # 診断関連
│   │   ├── prairie/          # Prairie Card関連
│   │   └── effects/          # エフェクト
│   ├── lib/
│   │   ├── prairie-parser.ts # Prairie Cardパーサー
│   │   ├── diagnosis-engine.ts # AI診断エンジン
│   │   ├── cache.ts          # キャッシュ戦略
│   │   └── utils.ts          # ユーティリティ
│   ├── config/
│   │   └── cnd2.config.ts    # CND²設定
│   └── types/
│       └── index.ts          # 型定義
├── public/                    # 静的ファイル
├── workers/                   # Cloudflare Workers
├── tests/                     # テストファイル
└── package.json
```

---

## 📝 Phase 2: 基本設定ファイル作成

### Step 3: CND²設定ファイル
```typescript
// src/config/cnd2.config.ts
export const CND2_CONFIG = {
  app: {
    name: 'CND²',
    displayName: 'CND Squared',
    version: '4.0.0',
    tagline: 'CND × CnD = Your Connection²',
    hashtag: '#CNDxCnD',
    hashtagRaw: 'CNDxCnD',
    poweredBy: 'Prairie Card'
  },
  
  domains: {
    development: 'http://localhost:3000',
    staging: 'https://dev.tsukaman.com/cnd2',
    production: 'https://cdn2.cloudnativedays.jp'
  },
  
  api: {
    openai: process.env.OPENAI_API_KEY,
    prairieCard: process.env.NEXT_PUBLIC_PRAIRIE_URL || 'https://my.prairie.cards',
    cnd2Endpoint: process.env.NEXT_PUBLIC_CND2_API || '/api'
  },
  
  features: {
    enableNFC: true,
    enableQR: true,
    enableGroupDiagnosis: true,
    maxGroupSize: 6,  // 6² = 36の相性
    enableSquaredEffects: true
  },
  
  cache: {
    ttl: {
      memory: 3600,      // 1時間
      browser: 7200,     // 2時間（二乗っぽく）
      kv: 604800        // 7日間
    }
  },
  
  rateLimit: {
    prairie: {
      requestsPerSecond: 2,
      requestsPerMinute: 3
    },
    api: {
      requestsPerMinute: 60
    }
  }
};
```

### Step 4: 環境変数設定
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_NAME=CND²
NEXT_PUBLIC_HASHTAG=#CNDxCnD
NEXT_PUBLIC_PRAIRIE_URL=https://my.prairie.cards
NEXT_PUBLIC_CND2_API=http://localhost:3000/api

# .env.production
OPENAI_API_KEY=production_openai_key
NEXT_PUBLIC_APP_NAME=CND²
NEXT_PUBLIC_HASHTAG=#CNDxCnD
NEXT_PUBLIC_PRAIRIE_URL=https://my.prairie.cards
NEXT_PUBLIC_CND2_API=https://cdn2.cloudnativedays.jp/api
```

### Step 5: 型定義
```typescript
// src/types/index.ts
export interface PrairieProfile {
  basic: {
    name: string;
    title: string;
    company: string;
    bio: string;
    avatar?: string;
  };
  details: {
    tags: string[];
    skills: string[];
    interests: string[];
    certifications: string[];
    communities: string[];
    motto?: string;
  };
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    blog?: string;
    qiita?: string;
    zenn?: string;
  };
  custom: Record<string, any>;
  meta: {
    createdAt?: Date;
    updatedAt?: Date;
    connectedBy?: string;
    hashtag?: string;
  };
}

export interface DiagnosisResult {
  type: string;
  score: number;
  message: string;
  conversationStarters: string[];
  hiddenGems: string;
  shareTag: string;
  participants: PrairieProfile[];
  createdAt: Date;
  id: string;
}

export interface CND2State {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  result: DiagnosisResult | null;
}

export interface Participant {
  id: string;
  url: string;
  profile: PrairieProfile | null;
  status: 'empty' | 'loading' | 'loaded' | 'error';
}
```

---

## 🎨 Phase 3: UI基盤実装

### Step 6: メインページ実装
```typescript
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CND2_CONFIG } from '@/config/cnd2.config';
import Link from 'next/link';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // プライバシー同意確認
    const consent = localStorage.getItem('cnd2-privacy-consent');
    if (consent) {
      setHasConsented(true);
    }
    setTimeout(() => setIsReady(true), 1000);
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!hasConsented) {
    return <ConsentScreen onConsent={() => {
      localStorage.setItem('cnd2-privacy-consent', 'true');
      setHasConsented(true);
    }} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* アニメーション背景 */}
      <div className="fixed inset-0 opacity-20">
        <FloatingSymbols />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* CND²ロゴ */}
        <motion.div 
          className="text-center mb-12"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <motion.h1 
            className="text-8xl font-black mb-4"
            style={{
              background: 'linear-gradient(45deg, #00D4FF, #9B59B6, #00FF88)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
            }}
            transition={{ duration: 10, repeat: Infinity }}
          >
            CND²
          </motion.h1>
          
          <p className="text-2xl text-white mb-2">
            {CND2_CONFIG.app.tagline}
          </p>
          
          <p className="text-xl text-cyan-400">
            {CND2_CONFIG.app.hashtag}
          </p>
          
          <p className="text-sm text-white/60 mt-4">
            Powered by {CND2_CONFIG.app.poweredBy}
          </p>
        </motion.div>
        
        {/* メニューカード */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <MenuCard
            href="/duo"
            icon="👥"
            title="2人診断"
            description="相性をチェック"
            delay={0.2}
          />
          <MenuCard
            href="/group"
            icon="🎯"
            title="グループ診断"
            description="3-6人で診断"
            delay={0.4}
          />
        </div>
      </div>
    </main>
  );
}
```

### Step 7: レイアウト設定
```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CND2_CONFIG } from '@/config/cnd2.config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${CND2_CONFIG.app.name} - ${CND2_CONFIG.app.tagline}`,
  description: 'CloudNative Days Winter 2025 相性診断アプリ。Prairie Cardで出会いを二乗でスケール！',
  keywords: ['CloudNative Days', 'CND²', 'CNDxCnD', 'Prairie Card', '相性診断'],
  openGraph: {
    title: CND2_CONFIG.app.name,
    description: CND2_CONFIG.app.tagline,
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: CND2_CONFIG.app.name,
    description: CND2_CONFIG.app.tagline,
    creator: '@cndw2025',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

---

## 🔧 Phase 4: Prairie Card連携

### Step 8: Prairie Cardパーサー実装

**Claude Codeへの実装依頼:**
```markdown
Prairie Cardの全情報を取得するパーサーを実装してください。

要件:
1. cheerioを使ってHTMLをスクレイピング
2. 以下の情報を取得:
   - 基本情報（名前、肩書き、所属、自己紹介文全文、アバター）
   - 詳細情報（タグ、スキル、興味、資格、コミュニティ、モットー）
   - SNSリンク（Twitter、GitHub、LinkedIn、Qiita、Zenn等）
   - カスタムフィールド（全ての追加情報）
   - メタデータ（作成日時、更新日時、カードスタイル）
3. レート制限: 2req/sec
4. キャッシュ戦略:
   - メモリキャッシュ: 1時間
   - KVキャッシュ: 7日間
5. エラーハンドリングとリトライ機能
6. CND²タグを追加（connectedBy: 'CND²', hashtag: '#CNDxCnD'）

ファイル: src/lib/prairie-parser.ts
```

### Step 9: AI診断エンジン実装

**Claude Codeへの実装依頼:**
```markdown
OpenAI APIを使ってCND²の診断エンジンを実装してください。

要件:
1. GPT-4o-miniを使用
2. Prairie Cardの全情報を活用
3. 診断結果に含めるもの:
   - Cloud Native用語を使った楽しい相性タイプ
   - 100点満点の相性スコア
   - "Scaling Together²"のメッセージ
   - 具体的な会話のきっかけ3つ以上
   - 意外な共通点
   - #CNDxCnD でシェアしたくなる要素
4. グループ診断対応（3-6人）
   - 役割分析（Control Plane役、Worker Node役など）
   - グループアクティビティ提案
5. プロンプトエンジニアリング:
   - CND²のブランディングを強調
   - エンターテイメント性重視
   - 技術的な共通点と人間的な共通点の両方

ファイル: src/lib/diagnosis-engine.ts
```

---

## 🎯 Phase 5: 必須機能実装

### Step 10: NFC/QR機能

**Claude Codeへの実装依頼:**
```markdown
NFCとQRコードでPrairie CardのURLを読み取る機能を実装してください。

NFC読み取り (src/components/prairie/NFCReader.tsx):
1. Web NFC APIを使用
2. Prairie CardのURLを自動検出
3. 読み取り中のアニメーション表示
4. 成功時にコンフェッティエフェクト
5. エラーハンドリング

QRコード読み取り (src/components/prairie/QRCodeReader.tsx):
1. カメラアクセス許可の取得
2. リアルタイムQRコード検出
3. Prairie Card URLの検証
4. スキャン成功時のフィードバック

QRコード生成 (src/components/prairie/QRCodeGenerator.tsx):
1. 診断結果URLのQRコード生成
2. CND²ロゴ埋め込み
3. #CNDxCnD タグ表示
4. ダウンロード機能
```

### Step 11: グループ診断機能

**Claude Codeへの実装依頼:**
```markdown
3-6人のグループ診断機能を実装してください。

要件 (src/app/group/page.tsx):
1. 参加者の動的追加・削除
2. 最小3人、最大6人の制限
3. 6²=36通りの相性を分析
4. 参加者カードのドラッグ&ドロップ対応
5. グループ診断特有の結果:
   - Kubernetes Cluster型などのグループタイプ
   - 役割分析
   - チーム相性スコア
   - グループアクティビティ提案
6. アニメーション:
   - 参加者追加時のスライドイン
   - 削除時のフェードアウト
   - 診断開始時の集合エフェクト
```

---

## 🎨 Phase 6: エンターテイメント機能

### Step 12: アニメーションとエフェクト

**Claude Codeへの実装依頼:**
```markdown
CND²のエンターテイメント機能を実装してください。

1. 背景アニメーション (src/components/effects/AnimatedBackground.tsx):
   - Three.jsを使った3D背景
   - 浮遊する²シンボル
   - グラデーションメッシュ
   - パーティクルエフェクト

2. CND²ロゴ3D表示 (src/components/effects/CND2Logo3D.tsx):
   - @react-three/fiberを使用
   - 回転アニメーション
   - グロー効果
   - インタラクティブな反応

3. スコアメーター (src/components/diagnosis/ScoreMeter.tsx):
   - 円形プログレスバー
   - 二乗効果のアニメーション
   - カウントアップ表示
   - グラデーション効果

4. 結果表示エフェクト (src/components/effects/ResultEffects.tsx):
   - コンフェッティ
   - ファイヤーワーク
   - 二乗エクスプロージョン
   - シェア促進アニメーション
```

### Step 13: 共有機能

**Claude Codeへの実装依頼:**
```markdown
#CNDxCnD での共有機能を実装してください。

要件 (src/components/diagnosis/ShareFeatures.tsx):
1. Twitter/X共有:
   - 診断結果の自動テキスト生成
   - #CNDxCnD タグ自動付与
   - URL短縮
   - OGP画像対応

2. 結果保存:
   - QRコード生成
   - 画像ダウンロード
   - URLコピー
   - 7日間の結果保持

3. シェアテンプレート:
   【CND²診断結果】
   相性タイプ：[タイプ名]
   相性スコア：[スコア]/100
   
   [メッセージ]
   
   Prairie Cardで出会いを二乗する体験！
   CND × CnD = Your Connection²
   
   診断はこちら → https://cdn2.cloudnativedays.jp
   
   #CNDxCnD #CNDW2025 #PrairieCard
```

---

## 🚀 Phase 7: Cloudflare設定

### Step 14: Workers設定
```toml
# wrangler.toml
name = "cnd2-api"
main = "workers/api/index.ts"
compatibility_date = "2025-01-01"

[env.production]
name = "cnd2-api-production"
kv_namespaces = [
  { binding = "CACHE", id = "your-kv-namespace-id" },
  { binding = "RESULTS", id = "your-results-kv-id" }
]
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "cnd2-api-staging"
kv_namespaces = [
  { binding = "CACHE", id = "your-staging-cache-kv-id" },
  { binding = "RESULTS", id = "your-staging-results-kv-id" }
]
vars = { ENVIRONMENT = "staging" }

[[rules]]
type = "Basic"
```

### Step 15: Workers KV作成
```bash
# KVネームスペース作成
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --env staging
wrangler kv:namespace create "RESULTS"
wrangler kv:namespace create "RESULTS" --env staging

# 環境変数設定
wrangler secret put OPENAI_API_KEY
wrangler secret put PRAIRIE_CARD_CACHE_TTL --env production
```

---

## ✅ Phase 8: テストとデプロイ

### Step 16: テスト実装

**Claude Codeへの実装依頼:**
```markdown
CND²の包括的なテストスイートを実装してください。

1. ユニットテスト (tests/unit/):
   - Prairie Cardパーサー
   - 診断エンジン
   - キャッシュ戦略
   - ユーティリティ関数

2. 統合テスト (tests/integration/):
   - Prairie Card取得 → AI診断 → 結果表示のフロー
   - グループ診断の全体フロー
   - NFC/QR読み取りからの診断
   - 共有機能の動作確認

3. E2Eテスト (tests/e2e/):
   - Playwrightを使用
   - ユーザーシナリオのテスト
   - パフォーマンステスト
   - エラーケースの確認

テストカバレッジ目標: 80%以上
```

### Step 17: ビルドとデプロイ
```bash
# ローカルテスト
npm run dev
npm test
npm run test:e2e

# ビルド
npm run build

# Cloudflare Pagesデプロイ（ステージング）
npx wrangler pages publish ./out \
  --project-name=cnd2-staging \
  --branch=staging

# 本番デプロイ（11月11日以降）
npx wrangler pages publish ./out \
  --project-name=cnd2 \
  --branch=main \
  --env=production

# カスタムドメイン設定
# Cloudflareダッシュボードで cdn2.cloudnativedays.jp を設定
```

---

## 📋 実装チェックリスト

### 初期設定（Day 1-2）
- [ ] プロジェクト作成
- [ ] パッケージインストール
- [ ] ディレクトリ構造作成
- [ ] 設定ファイル作成
- [ ] 環境変数設定
- [ ] 型定義

### 基本機能（Day 3-7）
- [ ] メインページ実装
- [ ] レイアウト設定
- [ ] Prairie Cardパーサー
- [ ] AI診断エンジン
- [ ] 基本UI/UX
- [ ] プライバシー同意フロー

### 必須機能（Week 2）
- [ ] NFC読み取り
- [ ] QRコード読み取り
- [ ] QRコード生成
- [ ] 2人診断
- [ ] グループ診断（3-6人）
- [ ] 結果表示

### エンタメ機能（Week 3）
- [ ] アニメーション背景
- [ ] CND²ロゴ3D表示
- [ ] 二乗エフェクト
- [ ] スコアメーター
- [ ] コンフェッティ
- [ ] #CNDxCnD共有

### 最適化（Week 4）
- [ ] 二乗キャッシュ戦略
- [ ] Prairie Card負荷軽減
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング
- [ ] レート制限実装

### テスト（Week 5）
- [ ] ユニットテスト
- [ ] 統合テスト
- [ ] E2Eテスト
- [ ] 負荷テスト
- [ ] セキュリティテスト

### デプロイ準備（Week 6）
- [ ] Cloudflare Workers設定
- [ ] Workers KV作成
- [ ] ステージング環境構築
- [ ] 本番環境準備
- [ ] ドメイン設定（cdn2.cloudnativedays.jp）

### 最終確認（11月上旬）
- [ ] 全機能動作確認
- [ ] Prairie Card連携確認
- [ ] #CNDxCnD共有確認
- [ ] パフォーマンス確認
- [ ] 運用マニュアル作成

---

## 💡 Claude Code活用のコツ

### 効率的な実装依頼の例

#### 1. Prairie Card連携
```markdown
Prairie Cardの全情報を取得し、二乗キャッシュ戦略でキャッシュする機能を実装してください。
レート制限は2req/secで、7日間キャッシュします。
CND²タグ（connectedBy: 'CND²'）を追加してください。
```

#### 2. CND²ブランディング
```markdown
CND²のロゴと二乗エフェクトを含むアニメーションを実装してください。
Three.jsを使って3D表現を追加し、²シンボルが浮遊するエフェクトも含めてください。
グラデーションは from-blue-600 via-purple-600 to-cyan-500 を使用します。
```

#### 3. 診断ロジック
```markdown
Prairie Cardの情報からCloud Native用語を使った楽しい診断結果を生成してください。
必ず以下を含めてください：
- #CNDxCnD タグ
- 'Scaling Together²' のメッセージ
- 二乗を感じさせる表現
- Kubernetes/Cloud Native用語（Pod、Container、Cluster等）
```

#### 4. グループ診断
```markdown
3-6人のグループ診断機能を実装してください。
6人の場合は6²=36通りの相性を分析することを明記し、
Kubernetes Clusterのような役割分析も含めてください。
```

#### 5. テスト実装
```markdown
CND²の統合テストを実装してください。
Prairie Card取得、AI診断、結果表示、#CNDxCnD共有の一連の流れをテストし、
二乗キャッシュの効果も検証してください。
```

---

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### Prairie Card取得エラー
```bash
# CORSエラーの場合
# Workers経由でプロキシ実装
wrangler dev workers/api/prairie-proxy.ts

# レート制限エラーの場合
# キャッシュTTLを延長
export PRAIRIE_CACHE_TTL=7200
```

#### OpenAI APIエラー
```bash
# APIキー確認
echo $OPENAI_API_KEY

# レート制限の場合
# リトライロジックを実装
npm install p-retry
```

#### Cloudflareデプロイエラー
```bash
# ビルドサイズ超過の場合
npm run analyze
npm run optimize

# KVバインディングエラー
wrangler kv:namespace list
wrangler kv:namespace create "CACHE"
```

---

## 📚 参考リソース

### 公式ドキュメント
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Prairie Card](https://my.prairie.cards)
- [OpenAI API](https://platform.openai.com/docs)
- [Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)

### 技術スタック
- [Framer Motion](https://www.framer.com/motion/)
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)

### CND²プロジェクト
- リポジトリ: `github.com/cloudnative-days/cnd2`
- デモサイト: `https://cnd2-staging.pages.dev`
- 本番サイト: `https://cdn2.cloudnativedays.jp`（11月18日〜）

---

## 🎯 成功指標

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| **利用者数** | 500名 | Google Analytics |
| **診断回数** | 1,500回 | API呼び出し数 |
| **#CNDxCnD投稿** | 200件 | Twitter検索API |
| **Prairie Card活用度** | 80% | 全情報取得率 |
| **エラー率** | <1% | Sentry |
| **応答時間** | <3秒 | Performance API |
| **満足度** | 90% | アンケート |

---

## 📧 お問い合わせ先

**CND²プロジェクトチーム**
- 担当: つかまん
- Prairie Card: https://my.prairie.cards/u/tsukaman
- メール: tsukaman@mac.com
- ハッシュタグ: #CNDxCnD

### 緊急連絡先（イベント当日）
- 技術責任者: [電話番号]
- サポート: [メールアドレス]

---

**CND² - 出会いを二乗でスケールする、CloudNative Daysの新体験！**

**#CNDxCnD**

*本ガイドは2025年8月24日時点の最新仕様です。*