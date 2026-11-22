import "server-only";
import { cacheLife } from "next/cache";
import { getJson } from "./cache";

/**
 * "BCH today": the last 24 hours of Bitcoin Cash in a few honest numbers.
 * Price from CoinGecko (Blockchair if it's down), chain stats from Blockchair.
 * Every number on the page links to a public page that shows it.
 */
export type Today = {
  at: string; // ISO time the numbers were fetched
  priceUsd: number;
  change24h: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  tx24h: number;
  medianFeeUsd: number;
  /** Total of every transaction output in 24h (change included, so it's "moved", not "paid"), in USD at today's price. */
  movedUsd: number | null;
  /** All fees paid in 24h: average fee × number of transactions. */
  feesUsd: number | null;
  spark: number[]; // price over the last 24 hours, oldest first
  priceSource: "CoinGecko" | "Blockchair";
  /** The day's largest transfer: the biggest single output to an address that didn't pay into its transaction. */
  big: { sentUsd: number; sentBch: number; feeUsd: number | null } | null;
};

type ChainStats = {
  data: {
    transactions_24h: number;
    volume_24h: number; // satoshis
    average_transaction_fee_usd_24h: number;
    median_transaction_fee_usd_24h: number;
    market_price_usd: number;
    market_price_usd_change_24h_percentage: number;
    market_cap_usd: number;
  };
};
type TxDashboard = {
  data: Record<
    string,
    {
      transaction: { fee_usd: number };
      inputs: { recipient: string }[];
      outputs: { recipient: string; value: number; value_usd: number }[];
    }
  >;
};
type Gecko = { "bitcoin-cash": { usd: number; usd_24h_change: number; usd_market_cap: number; usd_24h_vol: number } };

const BLOCKCHAIR = "https://api.blockchair.com/bitcoin-cash";

type TopTx = { data: { hash: string; output_total_usd: number }[] };

/**
 * The day's largest transfer to another address. Blockchair ranks transactions by total output,
 * and totals include change (often to a fresh address the sender owns, which can't be told apart),
 * and some big ones send nothing anywhere (a wallet combining its own coins). So: take the 10
 * biggest transactions of the last 24h, and in each find the largest output to an address that
 * didn't pay in. The biggest of those is the day's largest transfer for certain when it beats the
 * 10th transaction's whole total (nothing smaller can contain a bigger output); otherwise show none.
 * Cached for 30 minutes: the search is costly on Blockchair's free tier and the answer changes slowly.
 */
async function getBigTransfer(): Promise<Today["big"]> {
  "use cache";
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
    const top = await getJson<TopTx>(
      `${BLOCKCHAIR}/transactions?q=${encodeURIComponent(`time(${since}..)`)}&s=${encodeURIComponent("output_total(desc)")}&limit=10`,
      10_000,
    );
    if (!top.data.length) throw new Error("no transactions");
    const d = await getJson<TxDashboard>(`${BLOCKCHAIR}/dashboards/transactions/${top.data.map((t) => t.hash).join(",")}`, 10_000);
    let best: NonNullable<Today["big"]> | null = null;
    for (const t of Object.values(d.data)) {
      const from = new Set(t.inputs.map((i) => i.recipient));
      const out = t.outputs.filter((o) => !from.has(o.recipient)).sort((a, b) => b.value - a.value)[0];
      if (out && out.value_usd > 0 && (!best || out.value_usd > best.sentUsd))
        best = { sentUsd: out.value_usd, sentBch: out.value / 1e8, feeUsd: Number.isFinite(t.transaction.fee_usd) ? t.transaction.fee_usd : null };
    }
    const floor = top.data.length === 10 ? top.data[9].output_total_usd : 0;
    cacheLife({ stale: 300, revalidate: 1800, expire: 4 * 3600 });
    return best && best.sentUsd > floor ? best : null;
  } catch {
    cacheLife({ stale: 60, revalidate: 300, expire: 900 });
    return null;
  }
}

export async function getToday(): Promise<Today | null> {
  "use cache";
  try {
    const [chain, gecko, chart, bigRes] = await Promise.allSettled([
      getJson<ChainStats>(`${BLOCKCHAIR}/stats`, 10_000),
      getJson<Gecko>(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true",
      ),
      getJson<{ prices: [number, number][] }>("https://api.coingecko.com/api/v3/coins/bitcoin-cash/market_chart?vs_currency=usd&days=1"),
      getBigTransfer(),
    ]);
    if (chain.status !== "fulfilled") throw chain.reason;
    const c = chain.value.data;
    const g = gecko.status === "fulfilled" ? gecko.value["bitcoin-cash"] : null;
    const spark = chart.status === "fulfilled" ? chart.value.prices.map((p) => p[1]).filter(Number.isFinite) : [];
    const big = bigRes.status === "fulfilled" ? bigRes.value : null;
    const priceUsd = g?.usd ?? c.market_price_usd;
    const movedUsd = c.volume_24h > 0 ? (c.volume_24h / 1e8) * priceUsd : null;
    const feesUsd = c.average_transaction_fee_usd_24h > 0 ? c.average_transaction_fee_usd_24h * c.transactions_24h : null;

    cacheLife({ stale: 60, revalidate: 120, expire: 60 * 60 });
    return {
      at: new Date().toISOString(),
      priceUsd,
      change24h: g?.usd_24h_change ?? c.market_price_usd_change_24h_percentage ?? null,
      marketCapUsd: g?.usd_market_cap ?? c.market_cap_usd ?? null,
      volume24hUsd: g?.usd_24h_vol ?? null,
      tx24h: c.transactions_24h,
      medianFeeUsd: c.median_transaction_fee_usd_24h,
      movedUsd,
      feesUsd,
      spark: spark.length > 2 ? spark : [],
      priceSource: g ? "CoinGecko" : "Blockchair",
      big,
    };
  } catch {
    // try again soon rather than holding on to a failure
    cacheLife({ stale: 30, revalidate: 30, expire: 120 });
    return null;
  }
}

export const SOURCES = {
  stats: "https://blockchair.com/bitcoin-cash",
  price: "https://www.coingecko.com/en/coins/bitcoin-cash",
};

/** Fees in dollars, never cents: "0.16¢" gets read as 16 cents. */
export function fmtFee(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "n/a";
  if (n < 0.0001) return `$${n.toPrecision(2)}`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}
