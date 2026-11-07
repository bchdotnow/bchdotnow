import { connection } from "next/server";
import { kv1, kvEnabled } from "@/lib/kv";

// Download counts per piece, for "Most downloaded". Cached at the edge for 5 minutes.
export async function GET() {
  await connection();
  const counts: Record<string, number> = {};
  if (kvEnabled()) {
    try {
      const flat = ((await kv1(["HGETALL", "art:dl"])) as string[] | null) ?? [];
      for (let i = 0; i + 1 < flat.length; i += 2) counts[flat[i]] = Number(flat[i + 1]) || 0;
    } catch {
      /* counts are a nice-to-have */
    }
  }
  return Response.json({ counts }, { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=1200" } });
}
