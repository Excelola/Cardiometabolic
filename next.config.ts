import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  logging: { serverFunctions: false },
  serverExternalPackages: ["@node-rs/argon2", "pg"],
};

export default nextConfig;
