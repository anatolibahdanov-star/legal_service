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
  // cacheComponents: true,
  experimental: {
    // turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  }
};

export default nextConfig;
