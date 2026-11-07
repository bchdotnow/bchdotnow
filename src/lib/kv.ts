import "server-only";

// Tiny Upstash Redis REST client. Works with the env vars Vercel's Upstash integration adds.
const url = () => (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export const kvEnabled = () => Boolean(url() && token());

type Cmd = (string | number)[];

/** Run several commands in one round trip. Returns each command's result in order. */
export async function kv(cmds: Cmd[]): Promise<unknown[]> {
  if (!kvEnabled() || cmds.length === 0) return [];
  const res = await fetch(`${url()}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
    body: JSON.stringify(cmds.map((c) => c.map(String))),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => r.result);
}

export async function kv1(cmd: Cmd): Promise<unknown> {
  return (await kv([cmd]))[0];
}
