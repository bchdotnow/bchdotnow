import { after, connection } from "next/server";
import { recordVisit } from "@/lib/visits";

// Page-view counter. See src/lib/visits.ts: plain counts only, no IPs, no cookies.
export async function POST(req: Request) {
  await connection();
  const h = req.headers;
  // Browsers that ask not to be tracked aren't counted at all.
  if (h.get("sec-gpc") === "1" || h.get("dnt") === "1") return new Response(null, { status: 204 });
  const b = (await req.json().catch(() => null)) as { p?: unknown; r?: unknown; n?: unknown } | null;
  if (b) {
    const ua = h.get("user-agent") || "";
    after(() => recordVisit({ path: b.p, ref: b.r, isNew: b.n === 1, ua }).catch(() => {}));
  }
  return new Response(null, { status: 204 });
}
