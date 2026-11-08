import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { artFile, getCatalog } from "@/lib/art";

// The share card for bch.now/media: the headline plus the newest pieces.
export const alt = "bch.now media: free Bitcoin Cash images, GIFs and videos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#0ac18e";
const INK = "#04140e";

export default async function Image() {
  const [x800, x600, catalog] = await Promise.all([
    readFile(join(process.cwd(), "assets/PlusJakartaSans-800.ttf")),
    readFile(join(process.cwd(), "assets/PlusJakartaSans-600.ttf")),
    getCatalog(),
  ]);
  // up to 4 newest pieces (share cards need absolute image URLs; R2's are)
  const tiles = catalog.items.slice(0, 4).map((a) => artFile(catalog.base, a, "web")).filter((u) => u.startsWith("http"));
  const tilts = [-4, 3, 2.5, -3];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: GREEN, color: INK, fontFamily: "Jakarta", padding: "56px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 32 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>bch.now</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.92 }}>BCH.now</div>
            <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.92 }}>media</div>
            <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.25, marginTop: 24, maxWidth: 560 }}>
              Free Bitcoin Cash images, GIFs and videos. Download, post, remix.
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", background: INK, color: GREEN, fontSize: 28, fontWeight: 800, padding: "14px 24px", borderRadius: 20 }}>
              bch.now/media
            </div>
          </div>
        </div>
        {tiles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", width: 500, alignContent: "center", justifyContent: "center", gap: 20 }}>
            {tiles.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                width={230}
                height={230}
                alt=""
                style={{ width: 230, height: 230, objectFit: "cover", borderRadius: 22, border: `6px solid ${INK}`, transform: `rotate(${tilts[i]}deg)` }}
              />
            ))}
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: x800, weight: 800, style: "normal" },
        { name: "Jakarta", data: x600, weight: 600, style: "normal" },
      ],
    },
  );
}
