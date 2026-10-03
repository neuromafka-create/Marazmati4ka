import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    middlewareClientMaxBodySize: "520mb",
    serverActions: {
      bodySizeLimit: "520mb",
    },
  },
};

export default nextConfig;
