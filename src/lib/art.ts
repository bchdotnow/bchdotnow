// The media library. Nothing about the art lives in this repo: the art studio uploads the
// images and a catalog.json to Cloudflare R2, and the site reads that catalog at runtime.
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import type { Art, Catalog, Category, Style } from "./art-shared";

export * from "./art-shared";

export const ART_TAG = "art";
const EMPTY: Catalog = { base: "", categories: [], styles: [], items: [] };

type Raw = {
  base?: string;
  taxonomy?: { categories?: Category[]; styles?: Style[] };
  items?: (Omit<Art, "type" | "files"> & Partial<Pick<Art, "type" | "files">> & { source?: string })[];
};

function shape(raw: Raw): Catalog {
  return {
    base: (raw.base ?? "").replace(/\/$/, ""),
    categories: (raw.taxonomy?.categories ?? []).map(({ id, label, blurb }) => ({ id, label, blurb })),
    styles: (raw.taxonomy?.styles ?? []).map(({ id, label }) => ({ id, label })),
    // older entries predate GIF/video support: they're images with a PNG and a JPG
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    items: (raw.items ?? []).map(({ source, ...a }) => ({ ...a, type: a.type ?? "image", files: a.files ?? { png: 0, jpg: 0 } })),
  };
}

/**
 * The catalog, cached. Refreshes on its own every 2 minutes, or straight away when the studio
 * calls /api/art/refresh. The short window covers a refresh that's missed, e.g. one sent while
 * a new deploy is going live.
 *   ART_CATALOG_URL set (production): fetched from R2.
 *   Not set (local preview): read from public/_art/catalog.json, written by the studio.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(ART_TAG);
  const url = process.env.ART_CATALOG_URL;
  try {
    const raw = url
      ? await fetch(url, { signal: AbortSignal.timeout(8000) }).then((res) => {
          if (!res.ok) throw new Error(`catalog ${res.status}`);
          return res.json();
        })
      : JSON.parse(await readFile(join(process.cwd(), "public", "_art", "catalog.json"), "utf8"));
    cacheLife({ stale: 60, revalidate: 120, expire: 60 * 60 * 24 * 30 });
    return shape(raw);
  } catch (e) {
    // couldn't reach it: show an empty gallery for now, but try again soon rather than in minutes
    console.error("art catalog unavailable:", (e as Error).message);
    cacheLife({ stale: 30, revalidate: 30, expire: 300 });
    return EMPTY;
  }
}

/** Same category first, then most shared tags, newest breaking ties. */
export function related(all: Art[], a: Art, n = 8) {
  const tags = new Set(a.tags);
  return all
    .filter((b) => b.slug !== a.slug)
    .map((b) => ({ b, score: (b.category === a.category ? 3 : 0) + (b.style === a.style ? 1 : 0) + b.tags.filter((t) => tags.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.b.added.localeCompare(x.b.added))
    .slice(0, n)
    .map((x) => x.b);
}
