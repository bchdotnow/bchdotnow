import { after, connection } from "next/server";
import { applyStatus } from "@/lib/volume";
import { errorResponse, ss, userIp } from "@/lib/sideshift";

// Status of a shift, polled by the deposit screen.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  if (!/^[a-zA-Z0-9]{4,40}$/.test(id)) return Response.json({ error: "Bad id" }, { status: 400 });
  try {
    const s = await ss("GET", `/shifts/${id}`, { userIp: userIp(req) });
    after(() => applyStatus(s as Parameters<typeof applyStatus>[0]).catch(() => {}));
    return Response.json(s, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
