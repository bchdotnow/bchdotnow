import "server-only";
import { kv, kvEnabled } from "./kv";

/**
 * Visitor counts, recorded on our side. Plain counters only: nothing about the visitor is stored.
 * A "visit" is the first page someone opens in a browser tab; the browser itself remembers that for
 * the tab (sessionStorage) and only tells us yes or no. We never read or keep IP addresses.
 * Kept: page views, visits, which page, and the referring site's name.
 */

const BOT = /bot|crawl|spider|slurp|preview|scrape|fetch|monitor|headless|lighthouse|pingdom|curl|wget|python|axios|go-http|java\//i;

function cleanPath(p: unknown) {
  const s = typeof p === "string" ? p.split(/[?#]/)[0] : "";
  return /^\/[\w\-/.]{0,80}$/.test(s) ? s : "/other";
}

function cleanRef(r: unknown) {
  const s = typeof r === "string" ? r.toLowerCase().replace(/^www\./, "") : "";
  return /^[a-z0-9.-]{1,80}$/.test(s) && s !== "bch.now" ? s : "";
}

export async function recordVisit(v: { path: unknown; ref: unknown; isNew: boolean; ua: string }) {
  if (!kvEnabled() || !v.ua || BOT.test(v.ua)) return;
  const now = new Date().toISOString();
  const day = now.slice(0, 10);
  const month = now.slice(0, 7);
  const ref = v.isNew ? cleanRef(v.ref) : "";
  await kv([
    ["INCR", "vis:views"],
    ["HINCRBY", "vis:days:views", day, 1],
    ["HINCRBY", `vis:pages:${month}`, cleanPath(v.path), 1],
    ...(v.isNew
      ? [
          ["HINCRBY", "vis:days:visits", day, 1],
          ["HINCRBY", "vis:months:visits", month, 1],
        ]
      : []),
    ...(ref ? [["HINCRBY", `vis:refs:${month}`, ref, 1]] : []),
  ]);
}

const pairsOf = (v: unknown) => {
  const a = (v as string[]) || [];
  const o: Record<string, number> = {};
  for (let i = 0; i < a.length; i += 2) o[a[i]] = Number(a[i + 1]);
  return o;
};

export async function visitStats() {
  const month = new Date().toISOString().slice(0, 7);
  const [views, dayViews, dayVisits, monthVisits, pages, refs] = await kv([
    ["GET", "vis:views"],
    ["HGETALL", "vis:days:views"],
    ["HGETALL", "vis:days:visits"],
    ["HGETALL", "vis:months:visits"],
    ["HGETALL", `vis:pages:${month}`],
    ["HGETALL", `vis:refs:${month}`],
  ]);
  return {
    views: Number(views || 0),
    dayViews: pairsOf(dayViews),
    dayVisits: pairsOf(dayVisits),
    monthVisits: pairsOf(monthVisits),
    pages: pairsOf(pages),
    refs: pairsOf(refs),
  };
}
