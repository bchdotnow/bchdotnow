import { connection } from "next/server";
import { affiliateId, commissionRate, errorResponse, isLive, ss, userIp } from "@/lib/sideshift";

type Body = { depositCoin: string; depositNetwork: string; settleCoin: string; settleNetwork: string; depositAmount: string };

// Locked rate: ask SideShift for a fixed quote that a fixed shift can then use.
export async function POST(req: Request) {
  await connection();
  if (!isLive()) return Response.json({ error: "Swaps are not switched on yet." }, { status: 503 });
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b || !/^\d*\.?\d+$/.test(b.depositAmount ?? "")) return Response.json({ error: "Check the amount." }, { status: 400 });
  try {
    const quote = await ss("POST", "/quotes", {
      auth: true,
      userIp: userIp(req),
      body: {
        depositCoin: b.depositCoin,
        depositNetwork: b.depositNetwork,
        settleCoin: b.settleCoin,
        settleNetwork: b.settleNetwork,
        depositAmount: b.depositAmount,
        affiliateId: affiliateId(),
        ...(commissionRate() !== undefined ? { commissionRate: String(commissionRate()) } : {}),
      },
    });
    return Response.json(quote);
  } catch (e) {
    return errorResponse(e);
  }
}
