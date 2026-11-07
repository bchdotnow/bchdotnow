import type { Sourced } from "./types";

type Entry = { value: unknown; at: number };
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Memoise a provider call for `ttlMs`. On failure, serve the last good value
 * flagged `stale` instead of failing, so rate limits and outages degrade gracefully.
 * Providers are tried in order; the first that succeeds wins.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  providers: { name: string; fetch: () => Promise<T> }[],
): Promise<Sourced<T>> {
  const hit = store.get(key) as { value: Sourced<T>; at: number } | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;

  const running = inflight.get(key) as Promise<Sourced<T>> | undefined;
  if (running) return running;

  const p = (async (): Promise<Sourced<T>> => {
    const errors: string[] = [];
    for (const provider of providers) {
      try {
        const data = await provider.fetch();
        const value: Sourced<T> = { data, source: provider.name, fetchedAt: Date.now(), stale: false };
        store.set(key, { value, at: Date.now() });
        return value;
      } catch (e) {
        errors.push(`${provider.name}: ${(e as Error).message}`);
      }
    }
    if (hit) {
      const value: Sourced<T> = { ...hit.value, stale: true, error: errors.join("; ") };
      // keep the stale value but retry sooner than a full TTL
      store.set(key, { value, at: Date.now() - ttlMs / 2 });
      return value;
    }
    return { data: null, source: "none", fetchedAt: Date.now(), stale: true, error: errors.join("; ") };
  })().finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}

export async function getJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept: "application/json", "user-agent": "bch.now/0.1 (+https://bch.now)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function jsonResponse(body: unknown, sMaxAge: number) {
  return Response.json(body, {
    headers: { "cache-control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 4}` },
  });
}
