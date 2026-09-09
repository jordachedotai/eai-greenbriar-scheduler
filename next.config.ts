import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/portcos", destination: "/portfolio", permanent: false },
      { source: "/portcos/:id", destination: "/portfolio/:id", permanent: false },
    ];
  },
  env: {
    // Exposed to the client so the default mode matches .env.local.
    MOCK_MODE: process.env.MOCK_MODE ?? "true",
  },
};

export default nextConfig;
