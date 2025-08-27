import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages向けの設定
  experimental: {
    // Edge Runtimeとの互換性のため
    serverComponentsExternalPackages: [],
  },
  // 静的エクスポート時の設定
  trailingSlash: true,
  // セキュリティヘッダー（静的ホスティングでは効果なし、Cloudflare側で設定）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
