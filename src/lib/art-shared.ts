// Media library types and URL helpers, safe to use in client components.

export type MediaType = "image" | "animation" | "video";
export type ArtFormat = "png" | "jpg" | "gif" | "mp4";

export type Art = {
  slug: string;
  title: string;
  description: string;
  alt: string;
  category: string;
  style: string;
  tags: string[];
  type: MediaType;
  width: number;
  height: number;
  duration?: number; // seconds, GIFs and videos
  audio?: boolean;
  files: Partial<Record<ArtFormat, number>>; // format -> bytes
  links?: { url: string; label?: string }[]; // "seen in the wild"
  added: string;
  v: string;
};
export type Category = { id: string; label: string; blurb: string };
export type Style = { id: string; label: string };
export type Catalog = { base: string; categories: Category[]; styles: Style[]; items: Art[] };

export const LICENSE = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
  credit: "bch.now (@bchdotnow)",
};

export const TYPES: { id: MediaType; label: string; one: string }[] = [
  { id: "image", label: "Images", one: "Image" },
  { id: "animation", label: "GIFs", one: "GIF" },
  { id: "video", label: "Videos", one: "Video" },
];

export type ArtFile = "thumb" | "web" | ArtFormat;

/** URL of one of a piece's files. Local preview files are relative; R2 files are absolute. */
export function artFile(base: string, a: Pick<Art, "slug" | "v">, f: ArtFile) {
  const name = f === "thumb" ? "thumb.webp" : f === "web" || f === "jpg" ? "web.jpg" : `bchnow-${a.slug}.${f}`;
  return `${base}/${a.slug}/${a.v}/${name}`;
}

/** What can be downloaded, main format first. */
export function downloadsFor(a: Art): { f: ArtFormat; label: string; bytes?: number }[] {
  const order: ArtFormat[] = a.type === "animation" ? ["gif", "mp4"] : a.type === "video" ? ["mp4", "jpg"] : ["png", "jpg"];
  const label: Record<ArtFormat, string> = { png: "PNG", jpg: a.type === "image" ? "JPG" : "Still JPG", gif: "GIF", mp4: "MP4" };
  return order.filter((f) => f === "jpg" || a.files[f]).map((f) => ({ f, label: label[f], bytes: a.files[f] }));
}

export function fmtBytes(n?: number) {
  if (!n) return "";
  return n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`;
}

export function fmtDuration(s?: number) {
  if (!s) return "";
  const t = Math.round(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** Always absolute, for share cards, sitemaps and structured data. */
export const absolute = (u: string) => (u.startsWith("http") ? u : `https://bch.now${u}`);

/** A readable name for a "seen in the wild" link: the label if set, "@name on X" for X posts, else the site. */
export function linkLabel(l: { url: string; label?: string }) {
  if (l.label) return l.label;
  try {
    const u = new URL(l.url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "x.com" || host === "twitter.com") {
      const who = u.pathname.split("/").filter(Boolean)[0];
      return who && who !== "i" ? `@${who} on X` : "On X";
    }
    return host;
  } catch {
    return l.url;
  }
}
