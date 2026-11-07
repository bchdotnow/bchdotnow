// The coins the swap offers, with SideShift network ids and how we label them.
export const COINS = [
  { id: "bitcoin", sym: "BTC", name: "Bitcoin" },
  { id: "ethereum", sym: "ETH", name: "Ethereum" },
  { id: "tether", sym: "USDT", name: "Tether" },
  { id: "usd-coin", sym: "USDC", name: "USD Coin" },
  { id: "solana", sym: "SOL", name: "Solana" },
  { id: "litecoin", sym: "LTC", name: "Litecoin" },
  { id: "dogecoin", sym: "DOGE", name: "Dogecoin" },
  { id: "ripple", sym: "XRP", name: "XRP" },
] as const;

export type Coin = (typeof COINS)[number];

export const NETWORKS: Record<string, { id: string; label: string }[]> = {
  BCH: [{ id: "bitcoincash", label: "Bitcoin Cash" }],
  BTC: [{ id: "bitcoin", label: "Bitcoin" }],
  ETH: [{ id: "ethereum", label: "Ethereum" }],
  USDT: [
    { id: "ethereum", label: "Ethereum" },
    { id: "tron", label: "Tron" },
    { id: "solana", label: "Solana" },
    { id: "bsc", label: "BNB Chain" },
  ],
  USDC: [
    { id: "ethereum", label: "Ethereum" },
    { id: "solana", label: "Solana" },
    { id: "base", label: "Base" },
    { id: "polygon", label: "Polygon" },
  ],
  SOL: [{ id: "solana", label: "Solana" }],
  LTC: [{ id: "litecoin", label: "Litecoin" }],
  DOGE: [{ id: "doge", label: "Dogecoin" }],
  XRP: [{ id: "ripple", label: "XRP Ledger" }],
};

/** Networks where a destination tag / memo may be needed. */
export const MEMO_NETWORKS = new Set(["ripple"]);

const EVM = /^0x[0-9a-fA-F]{40}$/;
export const ADDRESS: Record<string, RegExp> = {
  bitcoincash: /^(bitcoincash:)?[qp][02-9ac-hj-np-z]{41}$/i,
  bitcoin: /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/,
  ethereum: EVM,
  bsc: EVM,
  base: EVM,
  polygon: EVM,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  litecoin: /^(ltc1[02-9ac-hj-np-z]{11,71}|[LM3][1-9A-HJ-NP-Za-km-z]{25,34})$/,
  doge: /^D[1-9A-HJ-NP-Za-km-z]{25,34}$/,
  ripple: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
};

/** Greyed-out partial example shown as the address placeholder, per network. */
export const ADDRESS_EXAMPLE: Record<string, string> = {
  bitcoincash: "bitcoincash:qr7f…x9k2",
  bitcoin: "bc1qxy2k…0wlh",
  ethereum: "0x71C7…976F",
  bsc: "0x71C7…976F",
  base: "0x71C7…976F",
  polygon: "0x71C7…976F",
  tron: "TJYe…8yXb",
  solana: "7EcD…FLtV",
  litecoin: "ltc1qg8…9vlz",
  doge: "DH5y…tLsQ",
  ripple: "rEb8…4xHy",
};
