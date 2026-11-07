import { connection } from "next/server";
import { isLive, ss, userIp } from "@/lib/sideshift";

// Is the swap live (keys configured) and may this visitor use SideShift from where they are?
export async function GET(req: Request) {
  await connection();
  let allowed = true;
  try {
    const p = await ss<{ createShift: boolean }>("GET", "/permissions", { userIp: userIp(req) });
    allowed = p.createShift !== false;
  } catch {
    allowed = true; // do not block on a failed check; shift creation re-checks server side
  }
  return Response.json({ live: isLive(), allowed }, { headers: { "cache-control": "no-store" } });
}
