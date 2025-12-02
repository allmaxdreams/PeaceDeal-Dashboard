import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ігноруємо помилки TypeScript (це працює в v16)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;