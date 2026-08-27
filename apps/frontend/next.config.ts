import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework version in response headers
  poweredByHeader: false,
  // Self-contained output for Docker deployments (see apps/frontend/Dockerfile)
  output: "standalone",
};

export default nextConfig;
