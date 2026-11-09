import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import ArtActions from "@/components/art/ArtActions";
import MediaBadge from "@/components/art/MediaBadge";
import { absolute, artFile, downloadsFor, fmtBytes, fmtDuration, getCatalog, LICENSE, linkLabel, related, TYPES } from "@/lib/art";
import { SOCIAL, ldJson } from "@/lib/site";

// Pieces in the catalog at build time are prerendered. Ones published later are rendered on
// their first visit and cached from then on, so new art never needs a redeploy.
export async function generateStaticParams() {
  const { items } = await getCatalog();
  return items.length ? items.map((a) => ({ slug: a.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/media/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { base, items, redirects } = await getCatalog();
  const a = items.find((x) => x.slug === slug);
  if (!a) {
    // a piece renamed after it went live: its old address moves to the new one
    if (redirects[slug]) permanentRedirect(`/media/${redirects[slug]}`);
    return { title: "Not found", robots: { index: false } };
  }
  // share cards show ~125 characters; the 1200x630 card image comes from ./opengraph-image.tsx
  const share = a.description.length <= 125 ? a.description : `${a.description.slice(0, 122).replace(/s+S*$/, "")}…`;
  return {
    title: `${a.title}: bch.now media`,
    description: `${a.description} Free to download and use under ${LICENSE.name}.`,
    keywords: a.tags,
    alternates: { canonical: `/media/${a.slug}` },
    openGraph: {
      type: a.type === "image" ? "article" : "video.other",
      siteName: "bch.now",
      locale: "en_US",
      title: a.title,
      description: share,
      url: `https://bch.now/media/${a.slug}`,
      ...(a.files.mp4 && { videos: [{ url: absolute(artFile(base, a, "mp4")), width: a.width, height: a.height, type: "video/mp4" }] }),
    },
    twitter: { card: "summary_large_image", site: "@bchdotnow", creator: "@bchdotnow", title: a.title, description: share },
  };
}

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function ArtPage({ params }: PageProps<"/media/[slug]">) {
  return (
    <main className="art__main">
      <Suspense fallback={<div className="piece piece--loading" aria-busy="true" />}>
        <Piece params={params} />
      </Suspense>
    </main>
  );
}

async function Piece({ params }: Pick<PageProps<"/media/[slug]">, "params">) {
  const { slug } = await params;
  const { base, items, categories, styles, redirects } = await getCatalog();
  const a = items.find((x) => x.slug === slug);
  if (!a) {
    if (redirects[slug]) permanentRedirect(`/media/${redirects[slug]}`);
    notFound();
  }
  const cat = categories.find((c) => c.id === a.category);
  const style = styles.find((s) => s.id === a.style);
  const more = related(items, a);
  const pageUrl = `https://bch.now/media/${a.slug}`;

  const motion = a.type !== "image";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": motion ? "VideoObject" : "ImageObject",
    name: a.title,
    description: a.description,
    caption: a.alt,
    contentUrl: absolute(artFile(base, a, motion ? "mp4" : "png")),
    thumbnailUrl: absolute(artFile(base, a, motion ? "web" : "thumb")),
    url: pageUrl,
    width: a.width,
    height: a.height,
    encodingFormat: motion ? "video/mp4" : "image/png",
    datePublished: a.added,
    ...(motion && { uploadDate: a.added, duration: `PT${Math.max(1, Math.round(a.duration ?? 1))}S` }),
    keywords: a.tags.join(", "),
    license: LICENSE.url,
    acquireLicensePage: "https://bch.now/media#license",
    creditText: LICENSE.credit,
    copyrightNotice: "bch.now",
    creator: { "@id": "https://bch.now/#org" },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/media">bch.now media</Link>
        {cat && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/media?c=${cat.id}`}>{cat.label}</Link>
          </>
        )}
      </nav>

      <article className="piece">
        <figure className="piece__fig">
          {a.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artFile(base, a, "web")} alt={a.alt} width={a.width} height={a.height} fetchPriority="high" />
          ) : (
            // GIFs play as a silent loop (the MP4 is far lighter than the GIF); videos get controls
            <video
              src={artFile(base, a, "mp4")}
              poster={artFile(base, a, "web")}
              width={a.width}
              height={a.height}
              aria-label={a.alt}
              playsInline
              muted={a.type === "animation" || !a.audio}
              autoPlay={a.type === "animation"}
              loop={a.type === "animation"}
              controls={a.type === "video"}
              preload={a.type === "animation" ? "auto" : "metadata"}
            />
          )}
        </figure>

        <div className="piece__side">
          <h1>{a.title}</h1>
          <p className="piece__desc">{a.description}</p>

          <ArtActions
            slug={a.slug}
            title={a.title}
            webUrl={artFile(base, a, "web")}
            pageUrl={pageUrl}
            xHandle={SOCIAL.xHandle}
            downloads={downloadsFor(a)}
            canCopy={a.type === "image"}
            shareFile={
              a.type === "image"
                ? { url: artFile(base, a, "web"), name: `bchnow-${a.slug}.jpg`, type: "image/jpeg" }
                : { url: artFile(base, a, "mp4"), name: `bchnow-${a.slug}.mp4`, type: "video/mp4" }
            }
          />

          {a.links && a.links.length > 0 && (
            <section className="wild" aria-labelledby="wild-h">
              <h2 id="wild-h">Seen in the wild</h2>
              <ul>
                {a.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener nofollow ugc">
                      {linkLabel(l)}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="piece__lic">
            Free under <a href={LICENSE.url}>{LICENSE.name}</a>. Credit <b>{LICENSE.credit}</b>.
          </p>

          <Link href="/" className="getbch">
            <span>
              <b>Want some BCH?</b> Swap BTC, ETH, USDT and more, paid straight to your own wallet.
            </span>
            <span className="getbch__go">
              Get BCH now<span aria-hidden="true"> →</span>
            </span>
          </Link>

          <dl className="piece__facts">
            {cat && (
              <div>
                <dt>Category</dt>
                <dd>
                  <Link href={`/media?c=${cat.id}`}>{cat.label}</Link>
                </dd>
              </div>
            )}
            {style && (
              <div>
                <dt>Style</dt>
                <dd>
                  <Link href={`/media?style=${style.id}`}>{style.label}</Link>
                </dd>
              </div>
            )}
            <div>
              <dt>Type</dt>
              <dd>
                {TYPES.find((t) => t.id === a.type)?.one}
                {a.duration ? `, ${fmtDuration(a.duration)}` : ""}
                {a.type === "video" ? (a.audio ? ", with sound" : ", no sound") : ""}
              </dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>
                {a.width} × {a.height} px
                {downloadsFor(a)[0]?.bytes ? `, ${fmtBytes(downloadsFor(a)[0].bytes)}` : ""}
              </dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{fmtDate(a.added)}</dd>
            </div>
          </dl>

          <ul className="piece__tags" aria-label="Tags">
            {a.tags.map((t) => (
              <li key={t}>
                <Link className="gtag" href={`/media?tag=${encodeURIComponent(t)}`}>
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {more.length > 0 && (
        <section className="more" aria-labelledby="more-h">
          <h2 id="more-h">More like this</h2>
          <ul className="gal__grid">
            {more.map((b) => (
              <li key={b.slug}>
                <Link href={`/media/${b.slug}`} className="gcard" prefetch={true}>
                  <span className="gcard__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={artFile(base, b, "thumb")} alt={b.alt} width={480} height={480} loading="lazy" decoding="async" />
                    <MediaBadge a={b} />
                  </span>
                  <span className="gcard__title">{b.title}</span>
                  <span className="gcard__meta">{categories.find((c) => c.id === b.category)?.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
