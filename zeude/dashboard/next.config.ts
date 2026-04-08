import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  async rewrites() {
    return [
      { source: '/v1/logs', destination: '/api/otel/logs' },
      { source: '/v1/traces', destination: '/api/otel/traces' },
      { source: '/v1/metrics', destination: '/api/otel/metrics' },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);
