import { cached, getJson, jsonResponse } from "@/lib/cache";
import { connection } from "next/server";
import { COINS } from "@/lib/coins";



type Gecko = Record<string, { usd: number; usd_24h_change?: number }>;

export async function GET() {
  await connection();
  const res = await cached("rates", 60_000, [
    {
      name: "CoinGecko",
      fetch: async () => {
        const ids = [...COINS.map((c) => c.id), "bitcoin-cash"].join(",");
        const d = await getJson<Gecko>(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        );
        if (!d["bitcoin-cash"]?.usd) throw new Error("no BCH price");
        return {
          bch: d["bitcoin-cash"].usd,
          coins: COINS.map((c) => ({ ...c, usd: d[c.id]?.usd ?? NaN, change24h: d[c.id]?.usd_24h_change ?? NaN })),
        };
      },
    },
  ]);
  return jsonResponse(res, 30);
}
