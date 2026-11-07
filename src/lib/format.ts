const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US");

export const SATS = 100_000_000;

export function fmtUsd(n: number | undefined, digits?: number) {
  if (n == null || !Number.isFinite(n)) return "n/a";
  if (digits === 0) return usd0.format(n);
  if (Math.abs(n) >= 1) return usd2.format(n);
  if (n === 0) return "$0";
  if (Math.abs(n) < 0.00000001) return "<$0.00000001";
  const d = Math.min(8, Math.max(2, -Math.floor(Math.log10(Math.abs(n))) + 2));
  return "$" + n.toFixed(d);
}

export function fmtUsdCompact(n: number | undefined) {
  if (n == null || !Number.isFinite(n)) return "n/a";
  return "$" + compact.format(n);
}

export const fmtInt = (n: number | undefined) => (n == null || !Number.isFinite(n) ? "n/a" : int.format(n));
export const fmtCompact = (n: number | undefined) => (n == null || !Number.isFinite(n) ? "n/a" : compact.format(n));

export function fmtPct(n: number | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "n/a";
  const s = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${s}${Math.abs(n).toFixed(digits)}%`;
}

export function fmtBch(sats: number | undefined, digits = 4) {
  if (sats == null || !Number.isFinite(sats)) return "n/a";
  const v = sats / SATS;
  if (v >= 1000) return compact.format(v) + " BCH";
  return v.toFixed(v < 0.001 ? 8 : digits) + " BCH";
}

export function fmtBytes(b: number | undefined) {
  if (b == null || !Number.isFinite(b)) return "n/a";
  if (b < 1000) return `${b} B`;
  if (b < 1_000_000) return `${(b / 1000).toFixed(1)} kB`;
  return `${(b / 1_000_000).toFixed(2)} MB`;
}

export function fmtAgo(secondsEpoch: number, now = Date.now()) {
  const s = Math.max(0, Math.round(now / 1000 - secondsEpoch));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

export function fmtClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const shortHash = (h: string, n = 6) => `${h.slice(0, n)}…${h.slice(-n)}`;

export function fmtHashrate(hs: number) {
  if (!Number.isFinite(hs)) return "n/a";
  const units = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s"];
  let i = 0;
  while (hs >= 1000 && i < units.length - 1) {
    hs /= 1000;
    i++;
  }
  return `${hs.toFixed(2)} ${units[i]}`;
}

export function fromBaseUnits(v: bigint, decimals: number) {
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = decimals ? "." + frac.toString().padStart(decimals, "0").replace(/0+$/, "") : "";
  return (neg ? "-" : "") + int.format(whole) + (fracStr === "." ? "" : fracStr);
}

export function toBaseUnits(s: string, decimals: number): bigint | null {
  const clean = s.replace(/,/g, "").trim();
  if (!/^\d*\.?\d*$/.test(clean) || clean === "" || clean === ".") return null;
  const [w, f = ""] = clean.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
}

export const explorer = {
  tx: (id: string) => `https://blockchair.com/bitcoin-cash/transaction/${id}`,
  block: (h: number | string) => `https://blockchair.com/bitcoin-cash/block/${h}`,
  token: (id: string) => `https://tokenexplorer.cash/?tokenId=${id}`,
  cauldronSwap: (id: string) => `https://app.cauldron.quest/swap/${id}`,
};
