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

// Where art files are served from: the catalog's host (R2), plus any r2.dev address and art.bch.now.
function artOrigins() {
  const out = new Set(["https://*.r2.dev", "https://art.bch.now"]);
  try {
    if (process.env.ART_CATALOG_URL) out.add(new URL(process.env.ART_CATALOG_URL).origin);
  } catch {}
  return [...out].join(" ");
}

function csp() {
  const art = artOrigins();
  const dev = process.env.NODE_ENV !== "production";
  const umami = process.env.NEXT_PUBLIC_UMAMI_ID ? " https://cloud.umami.is https://api-gateway.umami.dev" : "";
  return [
    "default-src 'self'",
    // Next.js needs inline scripts for its own page data; dev mode also needs eval for hot reload
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${umami ? " https://cloud.umami.is" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${art}`,
    `media-src 'self' blob: ${art}`,
    `connect-src 'self' ${art}${umami}${dev ? " ws:" : ""}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  // shown in the footer, linked to the exact commit on GitHub
  env: { NEXT_PUBLIC_COMMIT: commit(), NEXT_PUBLIC_BUILD_YEAR: String(new Date().getUTCFullYear()) },
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Hardening: nobody can frame the site (overlay tricks on the deposit screen), and the browser only
  // runs scripts from bch.now and only sends data to bch.now and the art storage. An injected script
  // couldn't load code from elsewhere or send deposit details anywhere else.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp() },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
