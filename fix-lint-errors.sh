#!/bin/bash

echo "🔧 Phase 3: 大規模リントエラー修正開始"

# 1. catchブロックの未使用errorをアンダースコアに
echo "📝 catchブロックの未使用errorを修正中..."
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "catch (error)" | while read file; do
  sed -i '' 's/catch (error)/catch (_error)/g' "$file"
done

find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "catch (err)" | while read file; do
  sed -i '' 's/catch (err)/catch (_err)/g' "$file"
done

# 2. 未使用のrequestパラメータを削除またはアンダースコアに
echo "📝 未使用のrequestパラメータを修正中..."
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "request: Request" | while read file; do
  # APIルートで未使用のrequestパラメータをアンダースコアに
  sed -i '' 's/async function \([A-Z]*\)(request: Request)/async function \1(_request: Request)/g' "$file"
done

# 3. 完了メッセージ
echo "✅ 一括修正完了"
