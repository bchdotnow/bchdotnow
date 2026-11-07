import { cached, getJson } from "../cache";
import type { Market } from "../types";

type Gecko = {
  "bitcoin-cash": {
    usd: number;
    btc?: number;
    eur?: number;
    gbp?: number;
    eth?: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    eur_24h_change?: number;
    gbp_24h_change?: number;
    btc_24h_change?: number;
    eth_24h_change?: number;
  };
};

const coingecko = {
  name: "CoinGecko",
  async fetch(): Promise<Market> {
    const d = await getJson<Gecko>(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=usd,eur,gbp,btc,eth&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true",
    );
    const b = d["bitcoin-cash"];
    if (!b?.usd) throw new Error("empty payload");
    return {
      priceUsd: b.usd,
      priceBtc: b.btc,
      quotes: { usd: b.usd, eur: b.eur, gbp: b.gbp, btc: b.btc, eth: b.eth },
      changes: {
        usd: b.usd_24h_change,
        eur: b.eur_24h_change,
        gbp: b.gbp_24h_change,
        btc: b.btc_24h_change,
        eth: b.eth_24h_change,
      },
      change24hPct: b.usd_24h_change,
      marketCapUsd: b.usd_market_cap,
      volume24hUsd: b.usd_24h_vol,
    };
  },
};

// Fallback: Blockchair carries price and cap in its stats payload (no volume in USD).
const blockchair = {
  name: "Blockchair",
  async fetch(): Promise<Market> {
    const { data } = await getJson<{ data: Record<string, number> }>("https://api.blockchair.com/bitcoin-cash/stats");
    return {
      priceUsd: data.market_price_usd,
      priceBtc: data.market_price_btc,
      change24hPct: data.market_price_usd_change_24h_percentage,
      marketCapUsd: data.market_cap_usd,
      volume24hUsd: NaN,
    };
  },
};

export const getMarket = () => cached("market", 30_000, [coingecko, blockchair]);
