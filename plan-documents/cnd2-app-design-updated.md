# CloudNative Days Winter 2025 CND²（CND Squared）
# 技術設計書 v4.0

---

## 1. システム概要

### 1.1 基本情報

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | CND² (CND Squared) |
| **正式名称** | CloudNative Days × Connect 'n' Discover |
| **タグライン** | CND × CnD = Your Connection² |
| **ハッシュタグ** | #CNDxCnD |
| **バージョン** | 4.0.0 |
| **開発期間** | 2025年8月24日〜11月17日 |
| **本番稼働** | 2025年11月18-19日 |
| **想定利用者** | 500名（参加者の50%） |
| **想定診断数** | 1,500回（3回/人） |
| **必須機能** | NFC読取、QRコード、グループ診断（3-6人） |
| **Domain** | cdn2.cloudnativedays.jp（CloudNative Days公式） |

### 1.2 技術スタック

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  Language: TypeScript 5.0+
  Styling: Tailwind CSS 3.4
  UI Library: shadcn/ui + カスタムコンポーネント
  Animation: Framer Motion
  Effects: Three.js (背景エフェクト、CND²ロゴ3D表示)
  
Backend:
  Runtime: Cloudflare Workers
  Edge Functions: Workers Functions
  Cache: Workers KV
  
External Services:
  AI: OpenAI GPT-4o-mini
  Prairie Card: HTMLスクレイピング（全情報取得）
  
Infrastructure:
  Hosting: Cloudflare Pages
  CDN: Cloudflare CDN
  Domain: cdn2.cloudnativedays.jp（CloudNative Days公式）
  SSL: Cloudflare提供
  
Development:
  Version Control: Git/GitHub (cloudnative-days/cnd2)
  CI/CD: GitHub Actions
  Package Manager: npm/pnpm
  Testing: Vitest, Playwright
```

---

## 2. UI/UXデザイン

### 2.1 CND²デザインコンセプト

```typescript
const CND2_DESIGN = {
  // ブランドアイデンティティ
  brand: {
    name: "CND²",
    fullName: "CND Squared",
    tagline: "CND × CnD = Your Connection²",
    hashtag: "#CNDxCnD",
    concept: "出会いを二乗でスケールする"
  },
  
  // ビジュアルテーマ
  theme: {
    style: "Tech-Entertainment Fusion with Squared Effect",
    mood: "楽しくてワクワクする、倍々ゲームのような体験"
  },
  
  // カラーパレット（二乗をイメージ）
  colors: {
    primary: {
      cnd: "#326CE5",      // CloudNative Days Blue
      squared: "#9B59B6",  // 二乗パープル
      connect: "#00D4FF"   // コネクションシアン
    },
    gradient: {
      main: "from-blue-600 via-purple-600 to-cyan-500",
      squared: "from-purple-500 to-pink-500",
      accent: "from-green-400 to-blue-500"
    },
    glass: {
      background: "bg-white/10 backdrop-blur-xl",
      border: "border-white/20"
    }
  },
  
  // インタラクション
  interactions: {
    hover: "scale-105 with squared glow effect",
    click: "scale-95 with ripple²",
    transition: "smooth with exponential easing"
  },
  
  // アニメーション（二乗テーマ）
  animations: {
    entrance: "scale from 0 to 1 to 1.1 to 1",
    loading: "rotating-squared-loader",
    success: "explosion-squared-effect",
    particles: "floating ² symbols"
  }
};
```

### 2.2 画面構成

#### トップ画面（CND²ブランディング）
```tsx
export function CND2HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* アニメーション背景 */}
      <CND2AnimatedBackground />
      
      {/* フローティング二乗シンボル */}
      <FloatingSquaredSymbols />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* CND²ロゴ（3D） */}
        <motion.div className="text-center mb-8">
          <motion.h1 
            className="text-8xl font-black mb-4"
            style={{ 
              background: "linear-gradient(45deg, #00D4FF, #9B59B6, #00FF88)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent"
            }}
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity }}
          >
            CND²
          </motion.h1>
          
          {/* タグライン */}
          <motion.p className="text-2xl text-white mb-2">
            {CND2_DESIGN.brand.tagline}
          </motion.p>
          
          {/* ハッシュタグ */}
          <motion.p className="text-xl text-cyan-400">
            {CND2_DESIGN.brand.hashtag}
          </motion.p>
        </motion.div>
        
        {/* Prairie Card連携表示 */}
        <div className="text-center mb-8">
          <p className="text-white/80">
            Powered by Prairie Card
          </p>
          <p className="text-sm text-white/60 mt-2">
            プレーリードッグの挨拶のように、タッチでつながる
          </p>
        </div>
        
        {/* メニューカード */}
        <CND2MenuCards />
      </div>
    </div>
  );
}
```

#### 診断入力画面（CND²スタイル）
```tsx
export function CND2DiagnosisInput() {
  return (
    <div className="space-y-6">
      {/* CND²ヘッダー */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">
          CND² 相性診断
        </h2>
        <p className="text-cyan-400">
          Prairie Cardで出会いを二乗する
        </p>
      </div>
      
      {participants.map((participant, index) => (
        <CND2ParticipantCard
          key={participant.id}
          index={index}
          participant={participant}
          onUpdate={updateParticipant}
        />
      ))}
      
      {/* 診断開始ボタン（CND²デザイン） */}
      <CND2DiagnosisButton participants={participants} />
    </div>
  );
}
```

#### 診断結果画面（CND²演出）
```tsx
export function CND2DiagnosisResult({ result }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", duration: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* CND²ロゴアニメーション */}
      <motion.div className="text-center mb-6">
        <motion.span 
          className="text-6xl font-bold text-cyan-400"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          CND²
        </motion.span>
      </motion.div>
      
      {/* 結果カード */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 relative overflow-hidden">
        {/* 二乗エフェクト */}
        <SquaredParticleEffect active={true} />
        
        {/* スコアメーター（二乗表示） */}
        <CND2ScoreMeter score={result.score} />
        
        {/* 診断タイプ */}
        <motion.h2 className="text-4xl font-bold text-center mb-6 text-cyan-400">
          {result.type}
        </motion.h2>
        
        {/* 診断メッセージ */}
        <p className="text-xl text-white text-center mb-4">
          {result.message}
        </p>
        
        {/* Scaling Together²メッセージ */}
        <p className="text-lg text-purple-400 text-center mb-8">
          "Scaling Together² - 出会いを二乗でスケール！"
        </p>
        
        {/* シェアボタン */}
        <div className="flex justify-center gap-4">
          <CND2ShareButton result={result} />
          <CND2SaveButton result={result} />
        </div>
        
        {/* ハッシュタグ促進 */}
        <p className="text-center mt-6 text-white/80">
          結果を {CND2_DESIGN.brand.hashtag} でシェアしよう！
        </p>
      </div>
    </motion.div>
  );
}
```

---

## 3. Prairie Card連携仕様（CND²最適化）

### 3.1 データ取得実装

```typescript
// src/lib/cnd2-prairie-scraper.ts
import * as cheerio from 'cheerio';
import { CND2_CONFIG } from '@/config/cnd2.config';

export class CND2PrairieScraper {
  private static readonly SERVICE_NAME = 'CND²';
  private static readonly USER_AGENT = `${CND2_CONFIG.name}/${CND2_CONFIG.version}`;
  
  async scrapeProfile(url: string): Promise<CompleteProfile> {
    console.log(`[CND²] Fetching Prairie Card: ${url}`);
    
    // キャッシュ確認（二乗効果でヒット率向上）
    const cached = await this.getFromSquaredCache(url);
    if (cached) {
      console.log(`[CND²] Cache hit! Scaling connection²`);
      return cached;
    }
    
    // Prairie Card取得
    const profile = await this.fetchWithCND2Optimization(url);
    
    // CND²タグを追加
    profile.meta.connectedBy = 'CND²';
    profile.meta.hashtag = '#CNDxCnD';
    
    return profile;
  }
  
  private async getFromSquaredCache(url: string): Promise<CompleteProfile | null> {
    // 二乗キャッシュ戦略：関連URLも含めてキャッシュ
    const cache = await this.cache.get(url);
    if (cache) {
      // キャッシュヒット時に関連性スコアを上げる
      cache.cnd2Score = (cache.cnd2Score || 1) * 2;
      return cache;
    }
    return null;
  }
}
```

### 3.2 診断での情報活用（CND²版）

```typescript
// src/lib/cnd2-diagnosis-engine.ts
export class CND2DiagnosisEngine {
  generatePrompt(profiles: CompleteProfile[]): string {
    return `
あなたはCND²（CND Squared）の診断AIです。
「出会いを二乗でスケールする」という理念のもと、
CloudNative Daysらしい楽しい診断を提供してください。

ブランド情報：
- アプリ名: CND²
- タグライン: ${CND2_CONFIG.tagline}
- ハッシュタグ: ${CND2_CONFIG.hashtag}
- コンセプト: 出会いを二乗でスケール

Prairie Card情報を最大限活用して、
参加者同士の相性を「二乗」で表現してください。

${profiles.map((p, i) => `
参加者${i + 1}:
${JSON.stringify(p, null, 2)}
`).join('\n')}

診断結果に必ず含めること：
1. 「二乗」を感じさせる相性タイプ名
2. 100点満点の相性スコア
3. 「Scaling Together²」のメッセージ
4. #CNDxCnD でシェアしたくなる要素
5. Prairie Cardの詳細情報から見つけた意外な共通点
    `;
  }
}
```

---

## 4. 必須機能実装（CND²仕様）

### 4.1 NFC読み取り（CND²エフェクト）

```typescript
// src/components/CND2NFCReader.tsx
export function CND2NFCReader({ onRead }: Props) {
  return (
    <motion.button
      onClick={startNFC}
      className="relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold"
      whileHover={{ scale: 1.1 }} // 二乗っぽく1.1倍
      whileTap={{ scale: 0.9 }}
    >
      <span className="flex items-center gap-2">
        <span className="text-xl">📱</span>
        NFCで Prairie Card を読む
        <span className="text-xs align-super">²</span>
      </span>
    </motion.button>
  );
}
```

### 4.2 QRコード機能（CND²ブランディング）

```typescript
// src/components/CND2QRCode.tsx
export function CND2QRCodeGenerator({ url }: { url: string }) {
  return (
    <motion.div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4 text-center">
        CND² 診断結果をシェア
      </h3>
      
      <div className="bg-white rounded-xl p-4 mb-4">
        <QRCode 
          value={url} 
          size={200} 
          className="mx-auto"
          imageSettings={{
            src: "/cnd2-logo.png",
            height: 40,
            width: 40,
            excavate: true
          }}
        />
      </div>
      
      <p className="text-center text-cyan-400 font-bold">
        #CNDxCnD
      </p>
      <p className="text-center text-white/80 text-sm mt-2">
        QRコードで出会いを二乗！
      </p>
    </motion.div>
  );
}
```

### 4.3 グループ診断（CND²版：最大6人で6²=36の相性）

```typescript
// src/components/CND2GroupDiagnosis.tsx
export function CND2GroupDiagnosis() {
  return (
    <div className="space-y-6">
      <motion.h2 className="text-3xl font-bold text-center text-white">
        CND² グループ診断
      </motion.h2>
      <p className="text-center text-cyan-400">
        最大6人で診断 → 6² = 36通りの相性を分析！
      </p>
      
      {/* 参加者カード */}
      <div className="grid gap-4">
        {participants.map((p, i) => (
          <CND2ParticipantCard 
            key={i}
            index={i}
            participant={p}
            showSquaredEffect={true}
          />
        ))}
      </div>
      
      {/* 診断開始ボタン */}
      <CND2StartGroupDiagnosisButton 
        participantCount={participants.length}
        possibleConnections={participants.length ** 2}
      />
    </div>
  );
}
```

---

## 5. エンターテイメント機能（CND²特別仕様）

### 5.1 二乗アニメーション背景

```typescript
// src/components/CND2Background.tsx
export function CND2AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas>
        {/* 二乗グリッド */}
        <SquaredGrid />
        
        {/* CND²ロゴの3D表示 */}
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
          <Text3D
            font="/fonts/bold.json"
            size={2}
            position={[0, 0, -10]}
          >
            CND²
            <meshNormalMaterial />
          </Text3D>
        </Float>
        
        {/* パーティクル（²マーク） */}
        <SquaredParticles count={50} />
      </Canvas>
    </div>
  );
}
```

### 5.2 CND²スコアメーター

```typescript
// src/components/CND2ScoreMeter.tsx
export function CND2ScoreMeter({ score }: Props) {
  const squaredScore = Math.min(100, Math.sqrt(score) * 10); // 二乗効果の演出
  
  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* 外側の円（CND） */}
      <motion.svg 
        viewBox="0 0 200 200" 
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="url(#cndGradient)"
          strokeWidth="4"
          fill="none"
        />
      </motion.svg>
      
      {/* 内側の円（二乗効果） */}
      <motion.svg viewBox="0 0 200 200" className="absolute inset-0">
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke="url(#squaredGradient)"
          strokeWidth="20"
          fill="none"
          strokeDasharray={`${squaredScore * 4.4} 440`}
        />
      </motion.svg>
      
      {/* スコア表示 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold text-white">
          {score}
        </span>
        <span className="text-xs text-cyan-400">²</span>
        <span className="text-sm text-white/80 mt-2">
          相性スコア
        </span>
      </div>
    </div>
  );
}
```

### 5.3 結果共有機能（CND²版）

```typescript
// src/components/CND2ShareFeatures.tsx
export function CND2ShareButton({ result }: Props) {
  const shareText = `
【CND²診断結果】
相性タイプ：${result.type}
相性スコア：${result.score}/100

${result.message}

Prairie Cardで出会いを二乗する体験！
${CND2_CONFIG.tagline}

診断はこちら → https://cdn2.cloudnativedays.jp

#CNDxCnD #CNDW2025 #PrairieCard
  `;
  
  return (
    <motion.button
      onClick={() => shareToTwitter(shareText)}
      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold relative overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 二乗エフェクト */}
      <motion.div
        className="absolute inset-0 bg-white opacity-20"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.2, 0, 0.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
      
      <span className="relative z-10 flex items-center gap-2">
        <span className="text-xl">🎉</span>
        #CNDxCnD でシェア
        <span className="text-xs align-super">²</span>
      </span>
    </motion.button>
  );
}
```

---

## 6. パフォーマンス最適化（CND²二乗効果）

### 6.1 二乗キャッシュ戦略

```yaml
CND²キャッシュ戦略:
  L1キャッシュ（メモリ）:
    TTL: 3600秒
    効果: 即座にレスポンス
    
  L2キャッシュ（ブラウザ）:
    TTL: 7200秒（2時間 = 二乗っぽく）
    効果: ネットワーク不要
    
  L3キャッシュ（Workers KV）:
    TTL: 604800秒（7日）
    効果: 永続的な保存
    
  二乗効果:
    - 関連診断もプリフェッチ
    - グループメンバーの組み合わせを先読み
    - ヒット率を指数関数的に向上
```

### 6.2 Prairie Card負荷軽減（CND²最適化）

```typescript
export class CND2CacheStrategy {
  // 二乗キャッシュ：関連URLも含めてキャッシュ
  async getWithSquaredCache(url: string): Promise<any> {
    // 直接キャッシュ
    const direct = await this.cache.get(url);
    if (direct) return direct;
    
    // 関連キャッシュ（同じイベント参加者など）
    const related = await this.findRelatedCache(url);
    if (related) {
      console.log('[CND²] Related cache hit! Connection squared!');
      return related;
    }
    
    return null;
  }
}
```

---

## 7. セキュリティ設計（CND²仕様）

### 7.1 セキュリティ対策

| 項目 | 実装 | CND²追加対策 |
|------|------|-------------|
| **Rate Limiting** | 3req/min/IP | 二乗バースト許可（瞬間的に多い） |
| **Input Validation** | Prairie URL検証 | CND²タグ付きURLを優先 |
| **XSS Protection** | React + CSP | #CNDxCnD投稿のサニタイズ |
| **Data Encryption** | HTTPS only | 診断結果の暗号化保存 |
| **Privacy** | 7日後削除 | CND²同意フローの実装 |

### 7.2 プライバシー保護（CND²版）

```typescript
export class CND2PrivacyManager {
  async checkConsent(): Promise<boolean> {
    const consent = localStorage.getItem('cnd2-privacy-consent');
    if (consent) return true;
    
    const agreed = await showCND2ConsentDialog({
      title: "CND²へようこそ！",
      message: "Prairie Cardの情報で出会いを二乗します",
      tagline: CND2_CONFIG.tagline,
      action: "診断を開始（Scaling Together²）"
    });
    
    if (agreed) {
      localStorage.setItem('cnd2-privacy-consent', 'true');
      trackEvent('CND2_Consent_Given');
    }
    
    return agreed;
  }
}
```

---

## 8. 開発・本番環境（CND²構成）

### 8.1 環境構成

| 環境 | URL | 用途 |
|------|-----|------|
| **Development** | localhost:3000 | ローカル開発 |
| **Dev Server** | dev.個人ドメイン/cnd2 | 開発テスト |
| **Staging** | cnd2-staging.pages.dev | 本番前テスト |
| **Production** | cdn2.cloudnativedays.jp | 本番環境 |

### 8.2 環境設定（CND²）

```typescript
// src/config/cnd2.config.ts
export const CND2_CONFIG = {
  app: {
    name: 'CND²',
    displayName: 'CND Squared',
    version: '4.0.0',
    tagline: 'CND × CnD = Your Connection²',
    hashtag: '#CNDxCnD',
    hashtagRaw: 'CNDxCnD'
  },
  
  api: {
    prairieCard: process.env.NEXT_PUBLIC_PRAIRIE_URL,
    openai: process.env.OPENAI_API_KEY,
    cnd2Endpoint: process.env.NEXT_PUBLIC_CND2_API
  },
  
  domain: process.env.NODE_ENV === 'production' 
    ? 'https://cdn2.cloudnativedays.jp'
    : 'https://dev.tsukaman.com/cnd2',
    
  features: {
    enableNFC: true,
    enableQR: true,
    enableGroupDiagnosis: true,
    maxGroupSize: 6, // 6² = 36の相性
    enableSquaredEffects: true
  }
};
```

---

## 9. まとめ

本設計書は、CloudNative Days Winter 2025向け「**CND²（CND Squared）**」の技術仕様を定義しています。

### CND²の重要ポイント
1. **ブランドアイデンティティ**: CND² = 出会いを二乗でスケール
2. **Prairie Card連携**: 全情報を活用した精度の高い診断
3. **エンターテイメント性**: 二乗エフェクトで楽しさ倍増
4. **ハッシュタグ戦略**: #CNDxCnD での拡散
5. **現実的な運用**: 段階的利用を前提とした設計

### 成功指標
- エラー率 <1%
- 応答時間 <3秒
- #CNDxCnD 投稿 200件以上
- 利用者満足度 二乗レベル

### キャッチフレーズ
**「CND × CnD = Your Connection²」**

---

*本設計書は2025年8月24日時点の最新仕様です。*
*CND²で、CloudNative Daysの出会いを二乗でスケールします。*
*#CNDxCnD*