import { cached, getJson, jsonResponse } from "@/lib/cache";
import { connection } from "next/server";

// Small live pulse of the chain for the rotating hero stat: latest block, mempool size and latest transaction.
const H = "https://api.haskoin.com/bch";
const BLOCKCHAIR = "https://api.blockchair.com/bitcoin-cash/stats";
// Haskoin's node sometimes stalls on an old tip while still collecting txs, so its mempool
// balloons with already-confirmed txs. Only trust it when its tip is recent.
const MAX_TIP_AGE_S = 60 * 60;

type Pulse = {
  blockHeight: number;
  blockTime: number; // seconds epoch
  mempool: number;
  lastTx: { txid: string; valueSats: number; time: number } | null;
};

type HaskoinTx = { txid: string; time: number; outputs: { value: number }[] };

// Haskoin's /mempool is newest-first; take the head as the latest tx seen on the network.
async function latestTx(): Promise<Pulse["lastTx"]> {
  try {
    const [txid] = await getJson<string[]>(`${H}/mempool?limit=1`);
    if (!txid) return null;
    const [t] = await getJson<HaskoinTx[]>(`${H}/transactions?txids=${txid}`);
    return { txid: t.txid, valueSats: t.outputs.reduce((s, o) => s + o.value, 0), time: t.time };
  } catch {
    return null; // keep block data even if the tx lookup fails
  }
}

export async function GET() {
  await connection();
  const res = await cached<Pulse>("pulse", 30_000, [
    {
      name: "Blockchair",
      fetch: async () => {
        const [{ data }, lastTx] = await Promise.all([
          getJson<{ data: { best_block_height: number; best_block_time: string; mempool_transactions: number } }>(
            BLOCKCHAIR,
          ),
          latestTx(),
        ]);
        return {
          blockHeight: data.best_block_height,
          blockTime: Math.floor(Date.parse(`${data.best_block_time.replace(" ", "T")}Z`) / 1000),
          mempool: data.mempool_transactions,
          lastTx,
        };
      },
    },
    {
      name: "Haskoin",
      fetch: async () => {
        const [best, pool, lastTx] = await Promise.all([
          getJson<{ height: number; time: number }>(`${H}/block/best?notx=true`),
          // without a limit Haskoin returns only the first 100 txids
          getJson<string[]>(`${H}/mempool?limit=100000`),
          latestTx(),
        ]);
        if (Date.now() / 1000 - best.time > MAX_TIP_AGE_S) throw new Error(`tip ${best.height} is stale`);
        return { blockHeight: best.height, blockTime: best.time, mempool: pool.length, lastTx };
      },
    },
  ]);
  return jsonResponse(res, 15);
}
