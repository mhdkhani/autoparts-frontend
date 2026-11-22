import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker prod image (.next/standalone/server.js)
  output: 'standalone',
};

export default nextConfig;
