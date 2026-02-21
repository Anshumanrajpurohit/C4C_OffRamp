import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    domains: [
      "greenbowl2soul.com",
      "images.unsplash.com",
      "i.ytimg.com",
      "cdn.pixabay.com",
      "upload.wikimedia.org",
    ],
  },
};

export default nextConfig;
