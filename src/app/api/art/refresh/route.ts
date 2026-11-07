import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { ART_TAG } from "@/lib/art";

// Called by the art studio after it uploads a new catalog, so new art shows up straight away
// instead of within 2 minutes. Needs ART_REFRESH_SECRET set on Vercel and in the studio.
export async function POST(req: Request) {
  const secret = process.env.ART_REFRESH_SECRET || "";
  const got = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const ok = secret.length >= 16 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  revalidateTag(ART_TAG, { expire: 0 });
  return Response.json({ refreshed: true });
}
