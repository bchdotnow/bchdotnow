import type { Metadata } from "next";
import Gallery from "@/components/art/Gallery";
import { absolute, artFile, getCatalog, LICENSE } from "@/lib/art";
import { ldJson } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { items } = await getCatalog();
  const description = `${items.length} free Bitcoin Cash images: street art, posters, memes and BCH price tags. Download in full size and use them anywhere, free under ${LICENSE.name}.`;
  // share cards show ~125 characters; the card image comes from ./opengraph-image.tsx
  const share = "Free Bitcoin Cash images, GIFs and videos. Download, post and remix them, free under CC BY 4.0.";
  return {
    title: { absolute: "BCH.now media: free Bitcoin Cash images, GIFs and videos" },
    description,
    alternates: { canonical: "/media" },
    openGraph: { type: "website", siteName: "bch.now", locale: "en_US", title: "BCH.now media", description: share, url: "https://bch.now/media" },
    twitter: { card: "summary_large_image", site: "@bchdotnow", creator: "@bchdotnow", title: "BCH.now media", description: share },
  };
}

export default async function ArtIndex() {
  const { base, items, categories, styles } = await getCatalog();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "BCH.now media",
    url: "https://bch.now/media",
    license: LICENSE.url,
    publisher: { "@id": "https://bch.now/#org" },
    hasPart: items.slice(0, 50).map((a) => ({
      "@type": "ImageObject",
      name: a.title,
      url: `https://bch.now/media/${a.slug}`,
      thumbnailUrl: absolute(artFile(base, a, "thumb")),
    })),
  };

  return (
    <main className="art__main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      <div className="art__intro">
        <h1>BCH.now media</h1>
        <p className="art__lead">
          All of our media library is completely free to use, download and share.
        </p>
      </div>
      {items.length ? (
        <Gallery base={base} items={items} categories={categories} styles={styles} />
      ) : (
        <p className="art__lead">The gallery is being restocked. Check back in a minute.</p>
      )}
    </main>
  );
}
