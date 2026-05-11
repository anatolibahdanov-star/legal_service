import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://lllms-dev.ru/api/:path*',
  //     },
  //   ]
  // },
  reactCompiler: true,
  compiler: {
    // Remove console.* in production, but keep it in development
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // cacheComponents: true,
  experimental: {
    // turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  }
};

export default nextConfig;
