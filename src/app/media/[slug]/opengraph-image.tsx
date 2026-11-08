import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { artFile, getCatalog } from "@/lib/art";

// The share card for one piece: the whole artwork (never cropped) with its title, at the
// 1200x630 size X, Discord, Telegram and others expect.
export const alt = "A free piece from bch.now media";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#0ac18e";
const INK = "#04140e";
const ART = 518; // the art box (square); the piece is fitted inside it

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, x800, x600, catalog] = await Promise.all([
    params,
    readFile(join(process.cwd(), "assets/PlusJakartaSans-800.ttf")),
    readFile(join(process.cwd(), "assets/PlusJakartaSans-600.ttf")),
    getCatalog(),
  ]);
  const a = catalog.items.find((x) => x.slug === slug);
  const src = a ? artFile(catalog.base, a, "web") : "";
  const title = a?.title ?? "bch.now media";
  const kind = a?.type === "animation" ? "GIF" : a?.type === "video" ? "VIDEO" : "";
  // fit the piece inside the square box, keeping its shape
  const scale = a ? Math.min(ART / a.width, ART / a.height) : 1;
  const w = a ? Math.round(a.width * scale) : ART;
  const h = a ? Math.round(a.height * scale) : ART;
  const titleSize = title.length <= 16 ? 84 : title.length <= 28 ? 66 : 52;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: GREEN, color: INK, fontFamily: "Jakarta", padding: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: ART, height: ART, flexShrink: 0 }}>
          {src.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} width={w} height={h} alt="" style={{ width: w, height: h, borderRadius: 26, objectFit: "contain" }} />
          ) : (
            <div style={{ display: "flex", width: ART, height: ART, borderRadius: 26, background: INK }} />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: ART, marginLeft: 56, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}>bch.now media</div>
            {kind && (
              <div style={{ display: "flex", background: INK, color: GREEN, fontSize: 20, fontWeight: 800, letterSpacing: "0.06em", padding: "4px 12px", borderRadius: 999 }}>
                {kind}
              </div>
            )}
          </div>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}>{title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 600 }}>Free to download and share</div>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", background: INK, color: GREEN, fontSize: 26, fontWeight: 800, padding: "12px 22px", borderRadius: 18 }}>
                bch.now/media
              </div>
            </div>
          </div>
        </div>
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
