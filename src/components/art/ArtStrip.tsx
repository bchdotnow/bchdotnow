import Link from "next/link";
import { artFile, getCatalog, type Art } from "@/lib/art";
import MediaBadge from "./MediaBadge";

const MAX = 8;

/**
 * Homepage teaser: up to the 8 newest pieces.
 * With a full 8 they drift slowly sideways in an endless loop (pauses on hover or keyboard focus;
 * a plain swipeable row on phones and with reduced motion). With fewer, they sit in a still row:
 * nothing is repeated to pad it out. Hidden when the catalog is empty.
 */
export default async function ArtStrip() {
  const { base, items } = await getCatalog();
  if (!items.length) return null;
  const latest = items.slice(0, MAX);
  const drift = latest.length >= MAX;

  const card = (a: Art, key: string, copy: boolean) => (
    <li key={key} aria-hidden={copy || undefined}>
      <Link href={`/media/${a.slug}`} className="artstrip__card" tabIndex={copy ? -1 : undefined}>
        <span className="artstrip__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artFile(base, a, "thumb")} alt={a.alt} width={480} height={480} loading="lazy" decoding="async" />
          <MediaBadge a={a} />
        </span>
        <span className="artstrip__title">{a.title}</span>
      </Link>
    </li>
  );

  return (
    <section className={`artstrip ${drift ? "" : "artstrip--static"}`} aria-labelledby="artstrip-h">
      <div className="artstrip__head">
        <h2 id="artstrip-h">Latest media</h2>
        <Link href="/media" className="artstrip__all" prefetch={true}>
          See all {items.length}
          <span aria-hidden="true">&nbsp;→</span>
        </Link>
        <p>Free to download and use. Just credit @bchdotnow.</p>
      </div>
      <div className="artstrip__rail">
        <ul className="artstrip__track" style={drift ? { ["--dur" as string]: `${latest.length * 5}s` } : undefined}>
          {latest.map((a, i) => card(a, `a${i}`, false))}
          {/* the loop needs the set three times to wrap seamlessly on wide screens; copies are aria-hidden, so their alt text is never read twice */}
          {drift && latest.map((a, i) => card(a, `b${i}`, true))}
          {drift && latest.map((a, i) => card(a, `c${i}`, true))}
        </ul>
      </div>
    </section>
  );
}
