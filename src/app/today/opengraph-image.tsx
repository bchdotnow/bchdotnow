import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fmtFee, getToday } from "@/lib/today";

// The share card for bch.now/today: the same live numbers as the page (same cache), drawn as a card.
export const alt = "Bitcoin Cash today: price, transactions and fees from the last 24 hours, on bch.now";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#0ac18e";
const INK = "#04140e";

const int = (n: number) => Math.round(n).toLocaleString("en-US");
function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "n/a";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e4) return `$${Math.round(n / 1e3)}K`;
  if (n >= 100) return `$${Math.round(n)}`;
  return `$${n.toFixed(2)}`;
}

function spark(values: number[], w: number, h: number) {
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 12), 6 + (h - 12) * (1 - (v - lo) / span)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${w} ${h} L0 ${h} Z`, end: pts[pts.length - 1] };
}

export default async function Image() {
  const [x800, x600, t] = await Promise.all([
    readFile(join(process.cwd(), "assets/PlusJakartaSans-800.ttf")),
    readFile(join(process.cwd(), "assets/PlusJakartaSans-600.ttf")),
    getToday(),
  ]);

  const tiles: [string, string][] = t
    ? [
        [int(t.tx24h), "transactions, 24h"],
        [fmtFee(t.medianFeeUsd), "typical fee"],
        ...(t.movedUsd != null && t.feesUsd != null ? [[money(t.movedUsd), `moved · ${money(t.feesUsd)} in fees`] as [string, string]] : []),
        ...(t.big ? [[money(t.big.sentUsd), `largest · ${fmtFee(t.big.feeUsd)} fee`] as [string, string]] : []),
      ]
    : [];
  const up = (t?.change24h ?? 0) >= 0;
  const chart = t && t.spark.length > 2 ? spark(t.spark, 400, 170) : null;
  const date = t ? new Date(t.at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: GREEN, color: INK, fontFamily: "Jakarta", padding: "48px 60px" }}>
        {/* top: wordmark and date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>bch.now</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{date}</div>
        </div>

        {/* middle: title, price, chart */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>
              <span>Bitcoin Cash</span>
              <span style={{ background: INK, color: GREEN, padding: "0 16px 6px", borderRadius: 14, transform: "rotate(-3deg)" }}>today</span>
            </div>
            {t ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 124, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, marginTop: 14 }}>
                  {`$${t.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
                {t.change24h != null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "flex-start", marginTop: 14, background: INK, color: GREEN, borderRadius: 999, padding: "8px 20px", fontSize: 26, fontWeight: 800 }}>
                    <svg width="18" height="16" viewBox="0 0 18 16">
                      <path d={up ? "M9 0 L18 16 L0 16 Z" : "M0 0 L18 0 L9 16 Z"} fill={GREEN} />
                    </svg>
                    <span>{`${Math.abs(t.change24h).toFixed(1)}% in 24h`}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginTop: 18, maxWidth: 760 }}>
                Price, transactions and fees from the last 24 hours.
              </div>
            )}
          </div>
          {chart && (
            <svg width="400" height="170" viewBox="0 0 400 170" style={{ marginBottom: 8 }}>
              <path d={chart.area} fill={INK} fillOpacity="0.08" />
              <path d={chart.line} fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={chart.end[0]} cy={chart.end[1]} r="9" fill={INK} />
            </svg>
          )}
        </div>

        {/* bottom: the day in four numbers */}
        {tiles.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginTop: 34 }}>
            {tiles.map(([v, l]) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", flex: 1, background: "rgba(4,20,14,0.09)", borderRadius: 20, padding: "18px 22px" }}>
                <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em" }}>{v}</div>
                <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.75, marginTop: 4 }}>{l}</div>
              </div>
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
