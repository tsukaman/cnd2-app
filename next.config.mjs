/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Cloudflare Pages
  // Note: Using standard build to enable API routes with Cloudflare Functions
  // Will deploy with @cloudflare/next-on-pages adapter
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Temporarily disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimize images - unoptimized for static export
  images: {
    unoptimized: true,
  },
  
  // Production optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Reduce bundle size
  experimental: {
    // optimizeCss: true, // Disabled due to critters module issue
  },
  
  // Headers for security
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': './src',
      };
    }
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze.html',
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;