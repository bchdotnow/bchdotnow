import type { MetadataRoute } from "next";
import { absolute, artFile, getCatalog } from "@/lib/art";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { base, items } = await getCatalog();
  return [
    { url: "https://bch.now", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://bch.now/how-it-works", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://bch.now/faq", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://bch.now/media", lastModified: items[0] ? new Date(items[0].added) : new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...items.map((a) => ({
      url: `https://bch.now/media/${a.slug}`,
      lastModified: new Date(a.added),
      changeFrequency: "yearly" as const,
      priority: 0.5,
      images: [absolute(artFile(base, a, "web"))],
    })),
  ];
}
