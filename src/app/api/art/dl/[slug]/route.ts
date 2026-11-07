import { after, connection } from "next/server";
import { artFile, downloadsFor, getCatalog, type ArtFormat } from "@/lib/art";
import { kv, kvEnabled } from "@/lib/kv";

// art:dl     slug -> total downloads (drives "Most downloaded")
// art:dl:f   "slug:format" -> downloads of that format (png, jpg, gif, mp4, copy)
const count = (slug: string, f: string) => {
  if (kvEnabled())
    after(() =>
      kv([
        ["HINCRBY", "art:dl", slug, 1],
        ["HINCRBY", "art:dl:f", `${slug}:${f}`, 1],
      ]).catch(() => {}),
    );
};

async function find(slug: string) {
  const { base, items } = await getCatalog();
  const a = items.find((x) => x.slug === slug);
  return a ? { base, a } : null;
}

// Download: count it, then send the browser to the file on R2 (which is served as an attachment).
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const hit = await find((await ctx.params).slug);
  if (!hit) return Response.json({ error: "Not found" }, { status: 404 });
  const offered = downloadsFor(hit.a).map((d) => d.f);
  const want = new URL(req.url).searchParams.get("f") as ArtFormat | null;
  const f = want && offered.includes(want) ? want : offered[0];
  count(hit.a.slug, f);
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL(artFile(hit.base, hit.a, f), req.url).toString(),
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

// "Copy image" counts as a download too.
export async function POST(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const hit = await find((await ctx.params).slug);
  if (!hit) return Response.json({ error: "Not found" }, { status: 404 });
  count(hit.a.slug, "copy");
  return new Response(null, { status: 204 });
}
