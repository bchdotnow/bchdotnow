import { jsonResponse } from "@/lib/cache";
import { getMarket } from "@/lib/providers/market";
import { after, connection } from "next/server";
import { reconcile } from "@/lib/volume";

export async function GET() {
  await connection();
  // Every visitor polls this, so it doubles as the trigger for the background swap check (locked to once per 4 min).
  after(() => reconcile().catch(() => {}));
  return jsonResponse(await getMarket(), 20);
}
