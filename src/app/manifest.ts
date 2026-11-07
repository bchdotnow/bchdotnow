import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bch.now: get Bitcoin Cash now",
    short_name: "bch.now",
    description: "Swap Bitcoin, Ethereum, stablecoins and more for Bitcoin Cash, straight to your own wallet.",
    start_url: "/",
    display: "standalone",
    background_color: "#0ac18e",
    theme_color: "#0ac18e",
    categories: ["finance"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
