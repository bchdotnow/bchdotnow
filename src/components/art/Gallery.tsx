"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Art, Category, MediaType, Style } from "@/lib/art-shared";
import { artFile, TYPES } from "@/lib/art-shared";
import MediaBadge from "./MediaBadge";
import FilterSelect from "./FilterSelect";

const TYPE_WORDS: Record<MediaType, string> = { image: "image picture still", animation: "gif animated animation loop", video: "video clip movie" };


const PAGE = 48;
type Sort = "new" | "old" | "popular" | "az" | "za";
const SORTS: Sort[] = ["new", "old", "popular", "az", "za"];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();

type Indexed = Art & { hay: string; titleN: string; tagsN: string };

/** Every word typed must appear somewhere; title and tag hits rank higher. */
function score(a: Indexed, words: string[]) {
  let s = 0;
  for (const w of words) {
    if (!a.hay.includes(w)) return -1;
    if (a.titleN.includes(w)) s += 3;
    if (a.tagsN.includes(w)) s += 2;
    s += 1;
  }
  return s;
}

export default function Gallery({ base, items, categories, styles }: { base: string; items: Art[]; categories: Category[]; styles: Style[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [style, setStyle] = useState("");
  const [type, setType] = useState<MediaType | "">("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [shown, setShown] = useState(PAGE);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const catLabel = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);
  const styleLabel = useMemo(() => Object.fromEntries(styles.map((s) => [s.id, s.label])), [styles]);

  const indexed = useMemo<Indexed[]>(
    () =>
      items.map((a) => ({
        ...a,
        titleN: norm(a.title),
        tagsN: a.tags.map(norm).join(" | "),
        hay: norm([a.title, a.tags.join(" "), catLabel[a.category], styleLabel[a.style], TYPE_WORDS[a.type], a.description, a.alt].join(" ")),
      })),
    [items, catLabel, styleLabel],
  );

  // Filters live in the URL so a search can be shared: /media?q=cat&c=markets&tag=bull
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = setTimeout(() => {
      setQ(p.get("q") ?? "");
      setCat(p.get("c") ?? "");
      setStyle(p.get("style") ?? "");
      const ty = p.get("type");
      if (ty === "image" || ty === "animation" || ty === "video") setType(ty);
      setTag(p.get("tag") ?? "");
      const s = p.get("sort");
      if (s && SORTS.includes(s as Sort)) setSort(s as Sort);
    }, 0);
    fetch("/api/art/counts")
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: { counts?: Record<string, number> }) => setCounts(j.counts ?? {}))
      .catch(() => {});
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("c", cat);
    if (style) p.set("style", style);
    if (type) p.set("type", type);
    if (tag) p.set("tag", tag);
    if (sort !== "new") p.set("sort", sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [q, cat, style, type, tag, sort]);

  const words = useMemo(() => norm(q).split(" ").filter(Boolean), [q]);

  // everything except the category, so the chip counts show what each would give
  const pool = useMemo(
    () =>
      indexed
        .filter((a) => (!style || a.style === style) && (!type || a.type === type) && (!tag || a.tags.includes(tag)))
        .map((a) => ({ a, s: words.length ? score(a, words) : 0 }))
        .filter((x) => x.s >= 0),
    [indexed, style, type, tag, words],
  );

  const results = useMemo(() => {
    const r = pool.filter((x) => !cat || x.a.category === cat);
    r.sort((x, y) => {
      if (sort === "popular") return (counts[y.a.slug] ?? 0) - (counts[x.a.slug] ?? 0) || y.a.added.localeCompare(x.a.added);
      if (sort === "az") return x.a.title.localeCompare(y.a.title);
      if (sort === "za") return y.a.title.localeCompare(x.a.title);
      if (sort === "old") return x.a.added.localeCompare(y.a.added) || x.a.title.localeCompare(y.a.title);
      if (words.length && y.s !== x.s) return y.s - x.s;
      return y.a.added.localeCompare(x.a.added);
    });
    return r.map((x) => x.a);
  }, [pool, cat, sort, counts, words]);

  const catCounts = useMemo(() => {
    const n: Record<string, number> = {};
    for (const { a } of pool) n[a.category] = (n[a.category] ?? 0) + 1;
    return n;
  }, [pool]);

  // per-style counts with every other filter applied
  const styleCounts = useMemo(() => {
    const n: Record<string, number> = {};
    for (const a of indexed) {
      if ((cat && a.category !== cat) || (type && a.type !== type) || (tag && !a.tags.includes(tag))) continue;
      if (words.length && score(a, words) < 0) continue;
      n[a.style] = (n[a.style] ?? 0) + 1;
    }
    return n;
  }, [indexed, cat, type, tag, words]);

  const filtered = Boolean(q || cat || style || type || tag);
  // counts per type with every other filter applied, so each option shows what it would give
  const typeCounts = useMemo(() => {
    const n: Record<string, number> = {};
    for (const a of indexed) {
      if ((cat && a.category !== cat) || (style && a.style !== style) || (tag && !a.tags.includes(tag))) continue;
      if (words.length && score(a, words) < 0) continue;
      n[a.type] = (n[a.type] ?? 0) + 1;
    }
    return n;
  }, [indexed, cat, style, tag, words]);
  const typeTotal = Object.values(typeCounts).reduce((x, y) => x + y, 0);
  const reset = () => {
    setQ("");
    setCat("");
    setStyle("");
    setType("");
    setTag("");
    setShown(PAGE);
  };
  const pick = (fn: () => void) => {
    fn();
    setShown(PAGE);
  };

  return (
    <div className="gal">
      <div className="gal__bar">
        <label className="gal__search">
          <span className="sr-only">Search the art</span>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.41-5.4-5.39A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => pick(() => setQ(e.target.value))}
            placeholder={`Search ${items.length} pieces: cat, surveillance, gif…`}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="gal__filters">
        <div className="gal__types" role="group" aria-label="Media type">
          {[{ id: "" as const, label: "All", n: typeTotal }, ...TYPES.map((t) => ({ id: t.id, label: t.label, n: typeCounts[t.id] ?? 0 }))].map((t) => (
            <button
              key={t.id || "all"}
              type="button"
              className={type === t.id ? "is-on" : ""}
              aria-pressed={type === t.id}
              disabled={t.id !== "" && t.n === 0 && type !== t.id}
              onClick={() => pick(() => setType(t.id))}
            >
              {t.label} <span>{t.n}</span>
            </button>
          ))}
        </div>
        <FilterSelect
          className="fsel--cat"
          label="Category"
          value={cat}
          onChange={(v) => pick(() => setCat(v))}
          options={[
            { value: "", label: "All", count: pool.length },
            ...categories.filter((c) => catCounts[c.id] || cat === c.id).map((c) => ({ value: c.id, label: c.label, count: catCounts[c.id] ?? 0, hint: c.blurb })),
          ]}
        />
        <FilterSelect
          label="Style"
          value={style}
          onChange={(v) => pick(() => setStyle(v))}
          options={[
            { value: "", label: "All", count: Object.values(styleCounts).reduce((x, y) => x + y, 0) },
            ...styles.filter((st) => styleCounts[st.id] || style === st.id).map((st) => ({ value: st.id, label: st.label, count: styleCounts[st.id] ?? 0 })),
          ]}
        />
        <FilterSelect
          label="Sort by"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "new", label: "Newest" },
            { value: "old", label: "Oldest" },
            { value: "popular", label: "Most downloaded" },
            { value: "az", label: "A to Z" },
            { value: "za", label: "Z to A" },
          ]}
        />
      </div>

      {tag && (
        <div className="gal__tags">
          <button type="button" className="gtag is-on" onClick={() => pick(() => setTag(""))} aria-label={`Remove tag ${tag}`}>
            #{tag} <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      <p className="gal__count" aria-live="polite">
        {results.length === items.length ? `${items.length} pieces` : `${results.length} of ${items.length} pieces`}
        {filtered && (
          <button type="button" className="gal__clear" onClick={reset}>
            Clear filters
          </button>
        )}
      </p>

      {results.length === 0 ? (
        <div className="gal__empty">
          <p>Nothing matches that yet.</p>
          <button type="button" className="btn btn--solid" onClick={reset}>
            Show everything
          </button>
        </div>
      ) : (
        <ul className="gal__grid">
          {results.slice(0, shown).map((a, i) => (
            <li key={a.slug}>
              <Link href={`/media/${a.slug}`} className="gcard">
                <span className="gcard__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artFile(base, a, "thumb")}
                    alt={a.alt}
                    width={480}
                    height={480}
                    loading={i < 8 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <MediaBadge a={a} />
                </span>
                <span className="gcard__title">{a.title}</span>
                <span className="gcard__meta">
                  {catLabel[a.category]}
                  {counts[a.slug] ? ` · ${counts[a.slug].toLocaleString("en-US")} downloads` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {results.length > shown && (
        <div className="gal__more">
          <button type="button" className="btn btn--solid" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({results.length - shown} left)
          </button>
        </div>
      )}
    </div>
  );
}
