import "server-only";
import { createPrivateKey, createPublicKey, sign, type KeyObject } from "node:crypto";

/**
 * SideShift API v2 client, server side only. Keys come from environment variables and never reach the browser.
 *   SIDESHIFT_AFFILIATE_ID   your SideShift account ID
 *   SIDESHIFT_SECRET         64-hex Ed25519 secret key (preferred) or 32-char legacy account secret
 *   SIDESHIFT_COMMISSION_RATE optional, 0 to 0.02 (default 0.005 = 0.5%)
 */
const HOST = "https://sideshift.ai";
const BASE = "/api/v2";

export const affiliateId = () => process.env.SIDESHIFT_AFFILIATE_ID?.trim() || "";
const secret = () => process.env.SIDESHIFT_SECRET?.trim() || "";
export const commissionRate = () => {
  const v = Number(process.env.SIDESHIFT_COMMISSION_RATE);
  return Number.isFinite(v) && v >= 0 && v <= 0.02 ? v : undefined;
};
export const isLive = () => Boolean(affiliateId() && secret());

let keyCache: { priv: KeyObject; pubHex: string } | null = null;
function edKey() {
  if (keyCache) return keyCache;
  const seed = Buffer.from(secret().replace(/^0x/, ""), "hex");
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
  const priv = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const spki = createPublicKey(priv).export({ format: "der", type: "spki" }) as Buffer;
  keyCache = { priv, pubHex: spki.subarray(spki.length - 32).toString("hex") };
  return keyCache;
}

function authHeaders(method: string, path: string, body: string): Record<string, string> {
  const s = secret();
  if (!s) return {};
  if (/^(0x)?[0-9a-fA-F]{64}$/.test(s)) {
    const ts = Date.now().toString();
    const { priv, pubHex } = edKey();
    const sig = sign(null, Buffer.from(ts + method.toUpperCase() + path + body), priv).toString("hex");
    return { "x-sideshift-key": pubHex, "x-sideshift-timestamp": ts, "x-sideshift-signature": sig };
  }
  return { "x-sideshift-secret": s }; // legacy account secret
}

export class SideShiftError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function ss<T>(
  method: "GET" | "POST",
  endpoint: string,
  opts: { userIp?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const path = BASE + endpoint;
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const headers: Record<string, string> = { accept: "application/json" };
  if (body) headers["content-type"] = "application/json";
  if (opts.userIp) headers["x-user-ip"] = opts.userIp;
  if (opts.auth) Object.assign(headers, authHeaders(method, path, body));
  const res = await fetch(HOST + path, {
    method,
    headers,
    body: body || undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } } | null)?.error?.message || `SideShift returned ${res.status}`;
    throw new SideShiftError(msg, res.status);
  }
  return json as T;
}

/** The end user's IP, as SideShift requires for server-side integrations. */
export function userIp(req: Request) {
  const h = req.headers;
  // Prefer the headers Vercel sets itself (a visitor can't fake them), so nobody can dodge SideShift's
  // country check by sending their own X-Forwarded-For.
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  // loopback and private ranges (local development) are not real visitor IPs; SideShift rejects them
  if (!ip || /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|f[cd][0-9a-f]{2}:|::ffff:127\.)/i.test(ip)) return undefined;
  return ip;
}

export function errorResponse(e: unknown) {
  if (e instanceof SideShiftError) return Response.json({ error: e.message }, { status: e.status >= 500 ? 502 : e.status });
  return Response.json({ error: "Could not reach SideShift. Try again in a moment." }, { status: 502 });
}
