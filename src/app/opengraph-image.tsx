import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The share card for links to bch.now on X, Telegram, WhatsApp, Discord, iMessage and search.
export const alt = "I want BCH.now: swap Bitcoin, Ethereum and stablecoins for Bitcoin Cash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#0ac18e";
const INK = "#04140e";

export default async function Image() {
  const [x800, x600] = await Promise.all([
    readFile(join(process.cwd(), "assets/PlusJakartaSans-800.ttf")),
    readFile(join(process.cwd(), "assets/PlusJakartaSans-600.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: GREEN,
          color: INK,
          padding: "56px 64px",
          fontFamily: "Jakarta",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>bch.now</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.08em",
              border: `3px solid ${INK}`,
              borderRadius: 999,
              padding: "4px 14px",
              transform: "rotate(-4deg)",
            }}
          >
            NEW
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: INK,
              color: GREEN,
              fontSize: 74,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              padding: "2px 30px 12px",
              borderRadius: 26,
              transform: "rotate(-3deg)",
              marginLeft: 6,
            }}
          >
            I want
          </div>
          <div style={{ fontSize: 176, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 1, marginTop: 4 }}>BCH.now</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 32, fontWeight: 600, lineHeight: 1.25, maxWidth: 780 }}>
            <span>Swap BTC, ETH, USDT and more for BCH.</span>
            <span>Straight to your own wallet.</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: INK,
              color: GREEN,
              fontSize: 30,
              fontWeight: 800,
              padding: "18px 28px",
              borderRadius: 22,
            }}
          >
            Get BCH now
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
