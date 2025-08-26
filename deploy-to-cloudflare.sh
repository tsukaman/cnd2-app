#!/bin/bash

# Cloudflare Pages Deployment Script
# This script deploys the CND2 app to Cloudflare Pages

set -e

echo "🚀 CND2 Cloudflare Pages Deployment"
echo "===================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check authentication
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please authenticate with Cloudflare:"
    wrangler login
fi

# Build the project
echo "🏗️ Building the project..."
npm run build

# Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy .next --project-name=cnd2-app --branch=main

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/"
echo "2. Navigate to Pages → cnd2-app"
echo "3. Set up environment variables:"
echo "   - OPENAI_API_KEY"
echo "   - NEXT_PUBLIC_APP_URL=https://cnd2.cloudnativedays.jp"
echo "   - SENTRY_DSN (optional)"
echo "4. Configure custom domain: cnd2.cloudnativedays.jp"
echo "5. Set up KV namespace for persistent storage"