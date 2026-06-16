import type { NextConfig } from "next";
import path from "path";
import os from "os";

// Keep build output in /tmp on WSL to avoid corrupted vendor-chunks during dev
const distDir =
  process.env.NEXT_DIST_DIR ||
  (process.env.NODE_ENV === "development"
    ? path.join(os.tmpdir(), "bmmapp-next")
    : ".next");

const nextConfig: NextConfig = {
  distDir,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
