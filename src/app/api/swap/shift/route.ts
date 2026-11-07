import { after, connection } from "next/server";
import { recordShift } from "@/lib/volume";
import { affiliateId, commissionRate, errorResponse, isLive, ss, userIp } from "@/lib/sideshift";

type Body = {
  type: "variable" | "fixed";
  quoteId?: string;
  depositCoin: string;
  depositNetwork: string;
  settleCoin: string;
  settleNetwork: string;
  settleAddress: string;
  settleMemo?: string;
  refundAddress?: string;
};

// Create a shift. bch.now never holds funds: SideShift returns a deposit address and pays out to the user's address.
export async function POST(req: Request) {
  await connection();
  if (!isLive()) return Response.json({ error: "Swaps are not switched on yet." }, { status: 503 });
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b || !b.settleAddress) return Response.json({ error: "Add the address to receive your coins." }, { status: 400 });
  const ip = userIp(req);

  try {
    const perm = await ss<{ createShift: boolean }>("GET", "/permissions", { userIp: ip });
    if (perm.createShift === false)
      return Response.json({ error: "SideShift is not available where you are, so we can't start this swap." }, { status: 403 });

    const common = {
      settleAddress: b.settleAddress.trim(),
      ...(b.settleMemo ? { settleMemo: b.settleMemo.trim() } : {}),
      ...(b.refundAddress ? { refundAddress: b.refundAddress.trim() } : {}),
      affiliateId: affiliateId(),
    };
    const shift =
      b.type === "fixed" && b.quoteId
        ? await ss("POST", "/shifts/fixed", { auth: true, userIp: ip, body: { ...common, quoteId: b.quoteId } })
        : await ss("POST", "/shifts/variable", {
            auth: true,
            userIp: ip,
            body: {
              ...common,
              depositCoin: b.depositCoin,
              depositNetwork: b.depositNetwork,
              settleCoin: b.settleCoin,
              settleNetwork: b.settleNetwork,
              ...(commissionRate() !== undefined ? { commissionRate: String(commissionRate()) } : {}),
            },
          });
    after(() => recordShift(shift as Parameters<typeof recordShift>[0]));
    return Response.json(shift);
  } catch (e) {
    return errorResponse(e);
  }
}
