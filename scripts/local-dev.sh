#!/bin/bash

echo "🚀 CloudNative川柳ゲーム ローカル開発環境起動"
echo ""
echo "📝 Cloudflareダッシュボードで以下を設定してください："
echo "1. KV Namespace 'SENRYU_KV' を作成"
echo "2. 作成後のIDを wrangler.toml に記載"
echo "3. 環境変数 SENRYU_ADMIN_KEY を設定"
echo ""
echo "準備ができたら、Enterキーを押してください..."
read

echo "🔨 ビルド中..."
npm run build

echo ""
echo "🎮 ローカルサーバーを起動します..."
echo "URL: http://localhost:8788"
echo ""
echo "📌 テスト手順:"
echo "1. http://localhost:8788/senryu にアクセス"
echo "2. 部屋を作成（ホスト）"
echo "3. 別のブラウザ/シークレットタブで同じ部屋コードで参加"
echo "4. 3人目も同様に参加"
echo "5. ゲーム開始！"
echo ""

npx wrangler pages dev out --kv=DIAGNOSIS_KV --kv=SENRYU_KV --port=8788