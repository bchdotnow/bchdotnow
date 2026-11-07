"use client";
import { useEffect, useState } from "react";
import type { Market } from "@/lib/types";
import { fmtAgo, fmtBch, fmtInt, fmtPct, fmtUsdCompact } from "@/lib/format";

type Pulse = {
  blockHeight: number;
  blockTime: number;
  mempool: number;
  lastTx: { txid: string; valueSats: number; time: number } | null;
};

function usePulse() {
  const [p, setP] = useState<Pulse | null>(null);
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/pulse")
        .then((r) => r.json())
        .then((j) => live && j.data && setP(j.data))
        .catch(() => {});
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 15_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return p;
}

/** One chip, several live facts, rotating every few seconds. Hover or focus pauses it. */
export default function StatTicker({ m }: { m: Market | null }) {
  const p = usePulse();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    {
      label: "24 hours",
      value: m ? fmtPct(m.change24hPct) : "—",
      sub: m ? `${fmtUsdCompact(m.volume24hUsd)} traded` : "",
    },
    {
      label: "Latest block",
      value: p ? `#${fmtInt(p.blockHeight)}` : "—",
      sub: p && now ? `found ${fmtAgo(p.blockTime, now)}` : "",
    },
    {
      label: "Latest payment",
      value: p?.lastTx ? fmtBch(p.lastTx.valueSats, 4) : "—",
      sub: p?.lastTx && now ? `sent ${fmtAgo(p.lastTx.time, now)}` : "",
    },
    {
      label: "Waiting for a block",
      value: p ? `${fmtInt(p.mempool)} payments` : "—",
      sub: "fees under a cent",
    },
    {
      label: "Market cap",
      value: m ? fmtUsdCompact(m.marketCapUsd) : "—",
      sub: "Bitcoin Cash",
    },
  ];

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % stats.length), 3800);
    return () => clearInterval(t);
  }, [paused, stats.length]);

  const s = stats[i];
  return (
    <div
      className="chip chip--stats"
      data-ui
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
      aria-live="off"
    >
      <div className="stat" key={i}>
        <span className="chip__label">{s.label}</span>
        <span className="chip__value">{s.value}</span>
        <span className="chip__sub">{s.sub}</span>
      </div>
      <div className="stat__dots" aria-hidden="true">
        {stats.map((_, n) => (
          <button key={n} tabIndex={-1} className={n === i ? "is-on" : ""} onClick={() => setI(n)} />
        ))}
      </div>
    </div>
  );
}
