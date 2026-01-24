import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019bced3-67b3-39e1-139c-b6ac66d4a7fb',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
