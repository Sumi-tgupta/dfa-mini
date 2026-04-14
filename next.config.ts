import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript errors should fail the build — don't hide them
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
