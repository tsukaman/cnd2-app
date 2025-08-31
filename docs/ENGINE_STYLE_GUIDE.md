# 診断エンジン スタイル切り替えガイド

## 🎨 利用可能な診断スタイル

統合エンジンでは4つの診断スタイルが選択可能です：

### 1. **`creative`** （デフォルト）🎨
- **特徴**: 型にはまらない創造的な診断
- **表現**: 予想外のイノベーション、化学反応
- **用途**: 楽しく新鮮な診断結果を求める場合

### 2. **`astrological`** ⭐
- **特徴**: 占星術的な表現を使った診断
- **表現**: エナジー、波動、星回り、宇宙の配置
- **用途**: 神秘的でロマンチックな診断を求める場合

### 3. **`fortune`** 🔮
- **特徴**: 点取り占い形式の親しみやすい診断
- **表現**: 総合運、技術運、コラボ運、成長運
- **用途**: 運勢診断のような楽しい結果を求める場合

### 4. **`technical`** 📊
- **特徴**: データドリブンで技術的な分析
- **表現**: 具体的なスキルマッチング、技術相性
- **用途**: 実用的で詳細な分析を求める場合

---

## 🔧 切り替え方法

### 方法1: フロントエンドから指定（推奨）

#### `/src/app/duo/page.tsx` を修正

```typescript
// 現在のコード（style指定なし = creative がデフォルト）
const response = await fetch('/api/diagnosis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profiles: prairieProfiles,
    mode: 'duo'
  })
});

// スタイルを指定する場合
const response = await fetch('/api/diagnosis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profiles: prairieProfiles,
    mode: 'duo',
    style: 'astrological'  // ← ここでスタイルを指定
  })
});
```

### 方法2: UIにスタイル選択を追加

#### スタイル選択UIコンポーネントの例

```typescript
// src/components/ui/StyleSelector.tsx
import { DiagnosisStyle } from '@/lib/diagnosis-engine-unified';

export function StyleSelector({ 
  onStyleChange 
}: { 
  onStyleChange: (style: DiagnosisStyle) => void 
}) {
  const styles = [
    { value: 'creative', label: '🎨 クリエイティブ', desc: '予想外の化学反応' },
    { value: 'astrological', label: '⭐ 占星術', desc: '星が導く運命' },
    { value: 'fortune', label: '🔮 点取り占い', desc: '運勢を診断' },
    { value: 'technical', label: '📊 技術分析', desc: 'データドリブン' }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {styles.map(style => (
        <button
          key={style.value}
          onClick={() => onStyleChange(style.value as DiagnosisStyle)}
          className="p-4 rounded-lg bg-gray-800 hover:bg-gray-700"
        >
          <div className="text-lg font-bold">{style.label}</div>
          <div className="text-sm text-gray-400">{style.desc}</div>
        </button>
      ))}
    </div>
  );
}
```

#### duo/page.tsx での使用例

```typescript
import { useState } from 'react';
import { StyleSelector } from '@/components/ui/StyleSelector';

export default function DuoPage() {
  const [diagnosisStyle, setDiagnosisStyle] = useState<DiagnosisStyle>('creative');

  const handleDiagnosis = async () => {
    const response = await fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiles: prairieProfiles,
        mode: 'duo',
        style: diagnosisStyle  // 選択されたスタイルを使用
      })
    });
  };

  return (
    <>
      {/* スタイル選択UI */}
      <StyleSelector onStyleChange={setDiagnosisStyle} />
      
      {/* 診断ボタン */}
      <button onClick={handleDiagnosis}>
        診断開始
      </button>
    </>
  );
}
```

---

## 🎯 APIエンドポイントでの処理

### `/api/diagnosis` の現在の実装

```typescript
// src/app/api/diagnosis/route.ts
const { profiles, mode = 'duo', style = 'creative' } = body;

const diagnosisOptions = {
  style: isValidStyle(style) ? style : 'creative',  // デフォルトは creative
  model: 'gpt-4o-mini' as const,
  enableFortuneTelling: true
};
```

### カスタマイズ例

```typescript
// モデルも切り替えたい場合
const diagnosisOptions = {
  style: style,
  model: style === 'technical' ? 'gpt-4o' : 'gpt-4o-mini',  // 技術分析は高性能モデル
  enableFortuneTelling: style === 'fortune'  // 点取り占いスタイルのみ有効
};
```

---

## 📝 実装例：ランダムスタイル

毎回違うスタイルで診断したい場合：

```typescript
// ランダムにスタイルを選択
const styles: DiagnosisStyle[] = ['creative', 'astrological', 'fortune', 'technical'];
const randomStyle = styles[Math.floor(Math.random() * styles.length)];

const response = await fetch('/api/diagnosis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profiles: prairieProfiles,
    mode: 'duo',
    style: randomStyle
  })
});
```

---

## 🔄 環境変数での設定

デフォルトスタイルを環境変数で制御：

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_DIAGNOSIS_STYLE=astrological
```

```typescript
// 使用例
const defaultStyle = process.env.NEXT_PUBLIC_DEFAULT_DIAGNOSIS_STYLE as DiagnosisStyle || 'creative';
```

---

## 📊 スタイル別の違い（例）

### 同じプロフィールでの診断結果の違い

#### Creative スタイル
> "予想を超えた化学反応が、イノベーションを生み出すでしょう。二人の創造性が融合し、素晴らしいものが生まれそうです。"

#### Astrological スタイル
> "二人のエンジニアリング・エナジーが美しく調和し、まるで惑星の配置が完璧に整ったかのような、運命的な技術の調和が生まれています。"

#### Fortune スタイル
> "お二人の技術運が最高潮に達しています！今こそ大きなチャレンジに挑む絶好のタイミングです。"

#### Technical スタイル
> "共通の技術基盤（React、TypeScript）により、スムーズなコミュニケーションと効率的な開発が可能です。"

---

## 🚀 今すぐ試す方法

### 1. APIを直接呼び出す（curlコマンド）

```bash
# Creative スタイル
curl -X POST https://cnd2.cloudnativedays.jp/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [...],
    "mode": "duo",
    "style": "creative"
  }'

# Astrological スタイル
curl -X POST https://cnd2.cloudnativedays.jp/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [...],
    "mode": "duo",
    "style": "astrological"
  }'
```

### 2. ブラウザコンソールで試す

```javascript
// ブラウザのコンソールで実行
fetch('/api/diagnosis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profiles: [/* Prairie profiles */],
    mode: 'duo',
    style: 'fortune'  // スタイルを変更して試す
  })
}).then(r => r.json()).then(console.log);
```

---

## 💡 Tips

1. **イベントごとに変える**
   - 技術カンファレンス → `technical`
   - 懇親会 → `creative`
   - 占いブース → `astrological`

2. **時間帯で変える**
   - 朝 → `fortune`（今日の運勢風）
   - 昼 → `technical`（真面目モード）
   - 夜 → `creative`（楽しいモード）

3. **ユーザー設定として保存**
   ```typescript
   localStorage.setItem('preferredDiagnosisStyle', 'astrological');
   ```

---

## 🔗 関連ファイル

- 統合エンジン: `/src/lib/diagnosis-engine-unified.ts`
- APIルート: `/src/app/api/diagnosis/route.ts`
- 診断ページ: `/src/app/duo/page.tsx`
- 型定義: `/src/types/index.ts`