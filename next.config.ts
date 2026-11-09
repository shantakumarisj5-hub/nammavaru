import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["172.21.83.24"],
};

export default nextConfig;