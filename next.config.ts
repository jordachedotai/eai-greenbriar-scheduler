import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Exposed to the client so the default mode matches .env.local.
    MOCK_MODE: process.env.MOCK_MODE ?? "true",
  },
};

export default nextConfig;
