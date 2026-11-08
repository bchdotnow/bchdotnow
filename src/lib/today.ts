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
  /** One big transfer: its largest single output to an address that didn't pay into it. */
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
    largest_transaction_24h?: { hash: string; value_usd: number };
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

/**
 * Blockchair ranks transactions by total output, and that total includes change. Change can't be
 * spotted reliably (wallets usually send it to a fresh address of their own), so claim only what's
 * always true: the single biggest output that doesn't go back to an address that paid in, "moved to one address".
 */
async function bigTransfer(hash: string): Promise<Today["big"]> {
  const d = Object.values((await getJson<TxDashboard>(`${BLOCKCHAIR}/dashboards/transaction/${hash}`, 10_000)).data)[0];
  const from = new Set(d.inputs.map((i) => i.recipient));
  const top = d.outputs.filter((o) => !from.has(o.recipient)).sort((a, b) => b.value - a.value)[0];
  if (!top || !(top.value_usd > 0)) return null; // everything went back to the sender: nothing moved
  return {
    sentUsd: top.value_usd,
    sentBch: top.value / 1e8,
    feeUsd: Number.isFinite(d.transaction.fee_usd) ? d.transaction.fee_usd : null,
  };
}

export async function getToday(): Promise<Today | null> {
  "use cache";
  try {
    const [chain, gecko, chart] = await Promise.allSettled([
      getJson<ChainStats>(`${BLOCKCHAIR}/stats`, 10_000),
      getJson<Gecko>(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true",
      ),
      getJson<{ prices: [number, number][] }>("https://api.coingecko.com/api/v3/coins/bitcoin-cash/market_chart?vs_currency=usd&days=1"),
    ]);
    if (chain.status !== "fulfilled") throw chain.reason;
    const c = chain.value.data;
    const g = gecko.status === "fulfilled" ? gecko.value["bitcoin-cash"] : null;
    const spark = chart.status === "fulfilled" ? chart.value.prices.map((p) => p[1]).filter(Number.isFinite) : [];
    const hash = c.largest_transaction_24h?.hash;
    const big = hash ? await bigTransfer(hash).catch(() => null) : null;
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
