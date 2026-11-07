// Provider-neutral shapes. Every provider adapter maps its own payload into these,
// so a source can be swapped without touching the interface.

export type Sourced<T> = {
  data: T | null;
  source: string;
  fetchedAt: number; // ms epoch of the data actually shown
  stale: boolean; // true when we are serving last-good data after a failure
  error?: string;
};

export type Market = {
  priceUsd: number;
  change24hPct: number;
  marketCapUsd: number;
  volume24hUsd: number;
  priceBtc?: number;
  quotes?: Partial<Record<"usd" | "eur" | "gbp" | "btc" | "eth", number>>;
  changes?: Partial<Record<"usd" | "eur" | "gbp" | "btc" | "eth", number>>; // 24h % change in each currency
};

export type NetworkStats = {
  height: number;
  bestBlockHash: string;
  bestBlockTime: number; // seconds epoch
  blocks24h: number;
  tx24h: number;
  mempoolTx: number;
  mempoolBytes: number;
  mempoolTps: number;
  suggestedFeeSatPerByte: number;
  medianFeeUsd24h: number;
  hashrate24h: number; // H/s
  nodes: number;
};

export type BlockSummary = {
  height: number;
  hash: string;
  time: number; // seconds epoch
  txCount: number;
  sizeBytes: number;
  feeSats: number;
};

export type TokenMarket = {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  iconUrl?: string;
  webUrl?: string;
  priceUsd: number;
  priceSats: number; // sats per whole token
  change24hPct: number; // in BCH terms
  change24hUsdPct: number;
  change7dUsdPct: number;
  tvlSats: number;
  volumeSats: number; // trade volume as reported by indexer
  apy30dPct: number;
  series7d: number[]; // normalised, last point = 1
};

export type CauldronPulse = {
  tvlSats: number;
  volume24hSats: number;
  activePools: number;
  totalInteractions: number;
};

export type LiveTx = {
  txid: string;
  size: number;
  feeSats: number;
  inputs: number;
  outputs: number;
  valueSats: number; // total output value
  hasTokens: boolean;
  seenAt: number; // ms epoch when we saw it
};
