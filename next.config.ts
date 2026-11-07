import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// The commit this build came from: GitHub Actions or Vercel set it; otherwise ask git (local development).
function commit() {
  const fromEnv = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  // shown in the footer, linked to the exact commit on GitHub
  env: { NEXT_PUBLIC_COMMIT: commit(), NEXT_PUBLIC_BUILD_YEAR: String(new Date().getUTCFullYear()) },
  cacheComponents: true,
  partialPrefetching: true,
  // Basic hardening: nobody can embed the site in a frame (stops overlay tricks on the deposit screen).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
