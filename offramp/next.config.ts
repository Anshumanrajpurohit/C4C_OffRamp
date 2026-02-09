import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow importing the shared Mock.json that lives one directory above the Next.js app.
    externalDir: true,
  },
};

export default nextConfig;
