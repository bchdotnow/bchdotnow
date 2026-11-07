import "server-only";
import { kv, kv1, kvEnabled } from "./kv";
import { ss } from "./sideshift";
import { getMarket } from "./providers/market";

/**
 * Completed-swap volume, recorded on our side.
 * Every shift we create is saved as "open". Its status is checked while the user watches the
 * deposit screen, and in the background every few minutes, so swaps are counted even after the tab closes.
 * The shift ID is kept only while the swap is open. Once it completes, expires or is refunded the ID is
 * dropped, and only totals and an ID-free row (coins, amounts, time) remain. Addresses are never stored.
 */

type Shift = {
  id: string;
  status: string;
  createdAt?: string;
  depositCoin?: string;
  depositNetwork?: string;
  settleCoin?: string;
  settleNetwork?: string;
  depositAmount?: string;
  settleAmount?: string;
  type?: string;
  deposits?: { status?: string; depositAmount?: string; settleAmount?: string }[];
};

const OPEN = "vol:open";
const MAX_OPEN_AGE_MS = 3 * 24 * 3600_000;

export async function recordShift(s: Shift) {
  if (!kvEnabled() || !s?.id) return;
  const day = new Date().toISOString().slice(0, 10);
  await kv([
    ["SADD", OPEN, s.id],
    ["INCR", "vol:created"],
    ["HINCRBY", "vol:days:created", day, 1],
  ]).catch(() => {});
}

async function bchUsd() {
  try {
    return (await getMarket()).data?.priceUsd ?? 0;
  } catch {
    return 0;
  }
}

/** Amounts that actually went through, also for variable shifts that took several deposits. */
function amounts(s: Shift) {
  if (s.status === "multiple" && s.deposits?.length) {
    const done = s.deposits.filter((d) => d.status === "settled");
    return {
      dep: done.reduce((t, d) => t + Number(d.depositAmount || 0), 0),
      set: done.reduce((t, d) => t + Number(d.settleAmount || 0), 0),
      settled: done.length > 0 && done.length === s.deposits.length,
    };
  }
  return { dep: Number(s.depositAmount || 0), set: Number(s.settleAmount || 0), settled: s.status === "settled" };
}

/** Apply a fresh status from SideShift. Counts a swap once, when it settles. */
export async function applyStatus(s: Shift, price?: number) {
  if (!kvEnabled() || !s?.id) return;
  const a = amounts(s);
  if (a.settled) {
    // Removing it from the open set succeeds once, so a swap is never counted twice.
    if ((await kv1(["SREM", OPEN, s.id])) !== 1) return;
    const p = price ?? (await bchUsd());
    const bch = s.settleCoin === "BCH" ? a.set : s.depositCoin === "BCH" ? a.dep : 0;
    const usd = bch * p;
    const day = new Date().toISOString().slice(0, 10);
    const row = {
      at: new Date().toISOString(),
      from: s.depositCoin,
      to: s.settleCoin,
      dep: a.dep,
      set: a.set,
      usd: Math.round(usd * 100) / 100,
    };
    await kv([
      ["INCR", "vol:count"],
      ["INCRBYFLOAT", "vol:usd", usd.toFixed(2)],
      ["INCRBYFLOAT", "vol:bch", bch.toFixed(8)],
      ["HINCRBY", "vol:days:count", day, 1],
      ["HINCRBYFLOAT", "vol:days:usd", day, usd.toFixed(2)],
      ["HINCRBY", "vol:pairs", `${s.depositCoin} to ${s.settleCoin}`, 1],
      ["LPUSH", "vol:recent", JSON.stringify(row)],
      ["LTRIM", "vol:recent", 0, 99],
    ]);
    return;
  }
  if (["expired", "refunded"].includes(s.status)) {
    const removed = (await kv1(["SREM", OPEN, s.id])) === 1;
    if (removed) await kv1(["INCR", `vol:${s.status}`]);
  }
}

/** One-off: earlier versions kept finished shift IDs. Remove them. */
async function dropLegacyIds() {
  if ((await kv1(["SET", "vol:migrated:noids", "1", "NX"])) !== "OK") return;
  const rows = ((await kv1(["LRANGE", "vol:recent", 0, 99])) as string[]) || [];
  const clean = rows.map((r) => {
    const row = JSON.parse(r) as Record<string, unknown>;
    delete row.id;
    return JSON.stringify(row);
  });
  await kv([["DEL", "vol:done", "vol:recent"], ...(clean.length ? [["RPUSH", "vol:recent", ...clean]] : [])]);
  let cursor = "0";
  do {
    const [next, keys] = ((await kv1(["SCAN", cursor, "MATCH", "vol:shift:*", "COUNT", 200])) as [string, string[]]) || ["0", []];
    if (keys?.length) await kv1(["DEL", ...keys]);
    cursor = next;
  } while (cursor !== "0");
}

/** Check every open shift with SideShift. Runs at most once every few minutes, whoever triggers it. */
export async function reconcile({ force = false } = {}) {
  if (!kvEnabled()) return { skipped: "no store" };
  if (!force) {
    const got = await kv1(["SET", "vol:lock", "1", "NX", "EX", 240]);
    if (got !== "OK") return { skipped: "recently checked" };
  }
  await dropLegacyIds();
  const ids = ((await kv1(["SMEMBERS", OPEN])) as string[]) || [];
  if (!ids.length) return { checked: 0 };
  const price = await bchUsd();
  let checked = 0;
  for (const id of ids.slice(0, 60)) {
    try {
      const s = await ss<Shift>("GET", `/shifts/${id}`);
      await applyStatus(s, price);
      checked++;
      // Never deposited and long gone: stop checking it.
      const created = Date.parse(s.createdAt || "");
      if (s.status === "waiting" && created && Date.now() - created > MAX_OPEN_AGE_MS) await kv1(["SREM", OPEN, id]);
    } catch {
      /* try again next round */
    }
  }
  return { checked, open: ids.length };
}

export async function volumeStats() {
  const [count, usd, bch, created, expired, refunded, open, days, dayUsd, pairs, recent, dayCreated] = await kv([
    ["GET", "vol:count"],
    ["GET", "vol:usd"],
    ["GET", "vol:bch"],
    ["GET", "vol:created"],
    ["GET", "vol:expired"],
    ["GET", "vol:refunded"],
    ["SCARD", OPEN],
    ["HGETALL", "vol:days:count"],
    ["HGETALL", "vol:days:usd"],
    ["HGETALL", "vol:pairs"],
    ["LRANGE", "vol:recent", 0, 49],
    ["HGETALL", "vol:days:created"],
  ]);
  const pairsOf = (v: unknown) => {
    const a = (v as string[]) || [];
    const o: Record<string, number> = {};
    for (let i = 0; i < a.length; i += 2) o[a[i]] = Number(a[i + 1]);
    return o;
  };
  return {
    completed: Number(count || 0),
    usd: Number(usd || 0),
    bch: Number(bch || 0),
    started: Number(created || 0),
    expired: Number(expired || 0),
    refunded: Number(refunded || 0),
    open: Number(open || 0),
    days: pairsOf(days),
    dayUsd: pairsOf(dayUsd),
    pairs: pairsOf(pairs),
    dayCreated: pairsOf(dayCreated),
    recent: ((recent as string[]) || []).map((r) => JSON.parse(r) as Record<string, string | number>),
  };
}
