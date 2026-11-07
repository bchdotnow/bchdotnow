import { connection } from "next/server";
import { affiliateId, commissionRate, errorResponse, ss, userIp } from "@/lib/sideshift";

type Pair = { min: string; max: string; rate: string; depositCoin: string; settleCoin: string; depositNetwork: string; settleNetwork: string };

const ok = (s: string | null) => !!s && /^[a-z0-9-]{1,24}$/i.test(s);

// Live SideShift rate, minimum and maximum for a coin pair.
export async function GET(req: Request) {
  await connection();
  const q = new URL(req.url).searchParams;
  const from = q.get("from"), fromNet = q.get("fromNet"), to = q.get("to"), toNet = q.get("toNet");
  if (![from, fromNet, to, toNet].every(ok)) return Response.json({ error: "Bad pair" }, { status: 400 });
  const params = new URLSearchParams();
  const amount = q.get("amount");
  if (amount && /^\d*\.?\d+$/.test(amount)) params.set("amount", amount);
  if (affiliateId()) params.set("affiliateId", affiliateId());
  const cr = commissionRate();
  if (cr !== undefined) params.set("commissionRate", String(cr));
  try {
    const p = await ss<Pair>(
      "GET",
      `/pair/${from!.toLowerCase()}-${fromNet}/${to!.toLowerCase()}-${toNet}${params.size ? `?${params}` : ""}`,
      { userIp: userIp(req) },
    );
    return Response.json(p, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
