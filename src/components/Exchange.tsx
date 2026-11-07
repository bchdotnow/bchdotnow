"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { ADDRESS, COINS, MEMO_NETWORKS, NETWORKS } from "@/lib/coins";
import { fmtUsd } from "@/lib/format";
import { PARTNER } from "@/lib/site";
import { WalletLink } from "./WalletDrawer";
import { track } from "@vercel/analytics";

type Rate = { id: string; sym: string; name: string; usd: number; change24h: number };
type Rates = { bch: number; coins: Rate[] };
type Pair = { rate: string; min: string; max: string };
type Shift = {
  id: string;
  type: "fixed" | "variable";
  status: string;
  depositCoin: string;
  depositNetwork: string;
  settleCoin: string;
  settleNetwork: string;
  depositAddress: string;
  depositMemo?: string;
  depositAmount?: string;
  depositMin?: string;
  depositMax?: string;
  settleAmount?: string;
  settleAddress: string;
  expiresAt: string;
  createdAt?: string;
  requestedAmount?: string; // what the user typed (market rate)
  expectedOut?: string; // what we showed them they'd get
};

const fmtCoin = (n: number) =>
  !Number.isFinite(n) ? "—" : n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toPrecision(6).replace(/\.?0+$/, "");
// For display only: BTC amounts are shown to 5 decimal places.
const showCoin = (n: number, sym: string) =>
  sym === "BTC" && Number.isFinite(n) && n < 1000 ? n.toFixed(5) : fmtCoin(n);

const STATUS: Record<string, { label: string; step: number }> = {
  waiting: { label: "Waiting for your deposit", step: 1 },
  pending: { label: "Deposit seen, waiting for confirmations", step: 2 },
  processing: { label: "Exchanging", step: 2 },
  review: { label: "Under review by SideShift", step: 2 },
  settling: { label: "Sending your coins", step: 3 },
  settled: { label: "Done. Your coins are on the way to your wallet.", step: 4 },
  refund: { label: "Needs a refund address", step: 2 },
  refunding: { label: "Refunding your deposit", step: 2 },
  refunded: { label: "Refunded", step: 4 },
  expired: { label: "Expired. Nothing was received.", step: 4 },
  multiple: { label: "Several deposits received, see SideShift", step: 2 },
};

const LS_KEY = "bchnow.shift";

// A sensible starting amount for each coin (roughly $100 to $800).
const DEFAULT_AMOUNT: Record<string, string> = {
  BTC: "0.01",
  ETH: "0.05",
  USDT: "100",
  USDC: "100",
  SOL: "1",
  LTC: "2",
  DOGE: "500",
  XRP: "100",
  BCH: "0.5",
};

/** Live market rates (CoinGecko) used for dollar values next to amounts. */
export function useRates() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/rates")
        .then((r) => r.json())
        .then((j) => {
          if (!live) return;
          if (j.data) {
            setRates(j.data);
            setErr(false);
          } else setErr(true);
        })
        .catch(() => live && setErr(true));
    load();
    const t = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return { rates, err };
}
export type RatesState = ReturnType<typeof useRates>;

function CoinPicker({ rates, value, onChange }: { rates: Rates | null; value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);
  const list = useMemo(
    () =>
      (rates?.coins ?? COINS.map((c) => ({ ...c, usd: NaN, change24h: NaN }))).filter((c) =>
        (c.sym + c.name).toLowerCase().includes(q.toLowerCase()),
      ),
    [rates, q],
  );
  return (
    <div className="xpick" ref={ref}>
      <button className="xpick__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="listbox" aria-label={`Coin: ${value}`}>
        <span className="xbadge">{value}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="xpick__menu" role="listbox">
          <input autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-form-type="other" className="xpick__search" placeholder="Search coin" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          {list.map((c) => (
            <button
              key={c.sym}
              role="option"
              aria-selected={c.sym === value}
              onClick={() => {
                onChange(c.sym);
                setOpen(false);
                setQ("");
              }}
            >
              <span className="xbadge">{c.sym}</span>
              <span>{c.name}</span>
              <span className="xpick__usd">{fmtUsd(c.usd)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NetworkSelect({ sym, value, onChange }: { sym: string; value: string; onChange: (n: string) => void }) {
  const nets = NETWORKS[sym] ?? [];
  if (nets.length < 2) return null;
  return (
    <label className="xnet">
      <span>on</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${sym} network`}>
        {nets.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="xcopy"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * The swap, into or out of BCH, powered by SideShift. bch.now never holds funds:
 * SideShift issues the deposit address and pays out to the user's own address.
 */
export function ExchangeCard({
  rx,
  from,
  setFrom,
  onWallet,
}: {
  rx: RatesState;
  from: string;
  setFrom: (s: string) => void;
  onWallet?: () => void;
}) {
  const { rates } = rx;
  const [dir, setDir] = useState<"in" | "out">("in"); // in: coin -> BCH, out: BCH -> coin
  const [net, setNet] = useState<string>(NETWORKS[from]?.[0]?.id ?? "");
  const [amount, setAmount] = useState("0.01");
  const [unit, setUnit] = useState<"coin" | "usd">("coin"); // type the amount in coins or in dollars
  const [mode, setMode] = useState<"floating" | "fixed">("fixed");
  const [addr, setAddr] = useState("");
  const [memo, setMemo] = useState("");
  const [touched, setTouched] = useState(false);
  const [cfg, setCfg] = useState<{ live: boolean; allowed: boolean } | null>(null);
  const [pairRaw, setPair] = useState<(Pair & { key: string }) | null>(null);
  const [pairErr, setPairErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [shift, setShift] = useState<Shift | null>(null);
  const [preview, setPreview] = useState(false);

  // keep the network valid for the chosen coin
  useEffect(() => {
    const nets = NETWORKS[from] ?? [];
    if (!nets.some((n) => n.id === net)) setNet(nets[0]?.id ?? "");
  }, [from, net]);

  useEffect(() => {
    fetch("/api/swap/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ live: false, allowed: true }));
    // resume a swap after a refresh
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setShift(JSON.parse(saved));
    } catch {}
  }, []);

  const sendSym = dir === "in" ? from : "BCH";
  const getSym = dir === "in" ? "BCH" : from;
  const sendNet = dir === "in" ? net : "bitcoincash";
  const getNet = dir === "in" ? "bitcoincash" : net;
  const usdOf = (sym: string) => (sym === "BCH" ? rates?.bch : rates?.coins.find((c) => c.sym === sym)?.usd) ?? NaN;
  const typed = Number(amount.replace(/[,$\s]/g, ""));
  const px = usdOf(sendSym);
  const amt = unit === "usd" ? (px > 0 ? Number((typed / px).toFixed(8)) : NaN) : typed;
  const amtStr = Number.isFinite(amt) ? String(Number(amt.toFixed(8))) : "";
  // only trust a rate/min/max fetched for the pair currently shown (avoids a stale flash after flipping)
  const pairKey = `${sendSym}:${sendNet}>${getSym}:${getNet}`;
  const pair = pairRaw?.key === pairKey ? pairRaw : null;

  // switching the sending coin resets the amount to something sensible for that coin
  const prevSend = useRef(sendSym);
  useEffect(() => {
    if (prevSend.current !== sendSym && dir === "in" && unit === "coin") setAmount(DEFAULT_AMOUNT[sendSym] ?? "1");
    prevSend.current = sendSym;
  }, [sendSym, dir, unit]);

  // live SideShift rate, min and max for this pair and amount
  useEffect(() => {
    if (!sendNet || !getNet) return;
    let live = true;
    const load = () => {
      const p = new URLSearchParams({ from: sendSym, fromNet: sendNet, to: getSym, toNet: getNet });
      if (amt > 0) p.set("amount", amtStr);
      fetch(`/api/swap/pair?${p}`)
        .then(async (r) => ({ ok: r.ok, j: await r.json() }))
        .then(({ ok, j }) => {
          if (!live) return;
          if (ok) {
            setPair({ ...j, key: `${sendSym}:${sendNet}>${getSym}:${getNet}` });
            setPairErr("");
          } else setPairErr(j.error || "Rate unavailable");
        })
        .catch(() => live && setPairErr("Rate unavailable"));
    };
    const t0 = setTimeout(load, 300);
    const t = setInterval(load, 20_000);
    return () => {
      live = false;
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [sendSym, getSym, sendNet, getNet, amt]);

  // poll status of an active swap
  useEffect(() => {
    if (!shift) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(shift));
    } catch {}
    if (["settled", "refunded", "expired"].includes(shift.status)) return;
    const t = setInterval(() => {
      fetch(`/api/swap/shift/${shift.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s && setShift((prev) => (prev ? { ...prev, ...s } : prev)))
        .catch(() => {});
    }, 6000);
    return () => clearInterval(t);
  }, [shift]);

  const rate = pair ? Number(pair.rate) : NaN;
  const out = Number.isFinite(rate) && amt > 0 ? amt * rate : NaN;
  const min = pair ? Number(pair.min) : NaN;
  const max = pair ? Number(pair.max) : NaN;
  const tooSmall = amt > 0 && Number.isFinite(min) && amt < min;
  const tooBig = amt > 0 && Number.isFinite(max) && amt > max;
  const addrOk = (ADDRESS[getNet] ?? /.+/).test(addr.trim());
  const needsMemo = MEMO_NETWORKS.has(getNet);
  const blocked = cfg?.allowed === false;
  const canGo = !blocked && amt > 0 && !tooSmall && !tooBig && addrOk && !busy;
  const netLabel = (sym: string, id: string) => (NETWORKS[sym]?.length ?? 0) > 1 ? ` on ${NETWORKS[sym].find((n) => n.id === id)?.label}` : "";

  const flip = () => {
    setDir((d) => (d === "in" ? "out" : "in"));
    setUnit("coin");
    if (Number.isFinite(out) && out > 0) setAmount(fmtCoin(out).replace(/,/g, ""));
    setAddr("");
    setMemo("");
    setTouched(false);
  };

  const start = async () => {
    setTouched(true);
    if (!canGo) return;
    if (!cfg?.live) {
      setPreview(true);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const base = { depositCoin: sendSym, depositNetwork: sendNet, settleCoin: getSym, settleNetwork: getNet };
      let quoteId: string | undefined;
      if (mode === "fixed") {
        const qr = await fetch("/api/swap/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...base, depositAmount: amtStr }),
        });
        const q = await qr.json();
        if (!qr.ok) throw new Error(q.error || "Could not lock a rate");
        quoteId = q.id;
      }
      const sr = await fetch("/api/swap/shift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...base,
          type: mode === "fixed" ? "fixed" : "variable",
          quoteId,
          settleAddress: addr.trim(),
          settleMemo: needsMemo && memo ? memo : undefined,
        }),
      });
      const s = await sr.json();
      if (!sr.ok) throw new Error(s.error || "Could not start the swap");
      setShift({ ...s, requestedAmount: amtStr, expectedOut: fmtCoin(out) });
      track("Swap started", { pair: `${sendSym} to ${getSym}`, rate: mode === "fixed" ? "locked" : "market" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setShift(null);
    setPreview(false);
    setErr("");
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  if (shift) return <DepositView shift={shift} onNew={reset} />;

  return (
    <div className="xch__card" id="swap">
      <div className="xch__head">
        <h2>{dir === "in" ? "Get BCH" : "Sell BCH"}</h2>
        <div className="xseg" role="radiogroup" aria-label="Rate type">
          {(["fixed", "floating"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>
              {m === "floating" ? "Market rate" : "Locked rate"}
            </button>
          ))}
        </div>
      </div>

      {preview ? (
        <div className="xstep2">
          <p className="xstep2__big">
            {amount} {sendSym} → {showCoin(out, getSym)} {getSym}
          </p>
          <p className="xstep2__note">Swaps are not switched on yet. Nothing has been created and nothing can be sent.</p>
          <button className="xback" onClick={() => setPreview(false)}>
            Back
          </button>
        </div>
      ) : (
        <>
          <div className="xfield">
            <div className="xfield__top">
              <span className="xsendlbl">
                <label htmlFor="xin">You send</label>
                {dir === "in" && <NetworkSelect sym={from} value={net} onChange={setNet} />}
              </span>
              <div className="xunitsw" role="radiogroup" aria-label="Value in">
                <span className="xunitsw__lbl" aria-hidden="true">Value in:</span>
                {(["coin", "usd"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={unit === u}
                    className={unit === u ? "is-on" : ""}
                    onClick={() => {
                      if (u === unit) return;
                      if (u === "usd") {
                        setUnit("usd");
                        if (amt > 0 && px > 0) setAmount((amt * px).toFixed(2));
                      } else {
                        setUnit("coin");
                        if (amt > 0) setAmount(fmtCoin(amt).replace(/,/g, ""));
                      }
                    }}
                  >
                    {u === "usd" ? "USD" : sendSym}
                  </button>
                ))}
              </div>
            </div>
            <div className="xfield__row">
              {unit === "usd" && <span className="xdollar">$</span>}
              <input autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-form-type="other" id="xin" inputMode="decimal" className="xin--fit" size={Math.max(1, amount.length)} value={amount} onChange={(e) => setAmount(e.target.value)} />
              {unit === "coin" && <span className="xsuffix">{sendSym}</span>}
              <span className="xgrow" aria-hidden="true" />
              {dir === "in" ? <CoinPicker rates={rates} value={from} onChange={setFrom} /> : <span className="xbadge xbadge--bch">BCH</span>}
            </div>
            <div className={`xfield__foot ${tooSmall || tooBig ? "is-err" : ""}`}>
              <span>
                {tooSmall
                  ? `Minimum is ${fmtCoin(min)} ${sendSym}.`
                  : tooBig
                    ? `Maximum is ${fmtCoin(max)} ${sendSym}.`
                    : amt > 0
                      ? unit === "usd"
                        ? `${fmtCoin(amt)} ${sendSym}`
                        : fmtUsd(amt * px)
                      : "Enter an amount"}
              </span>
              <div className="xquick" role="group" aria-label="Quick amounts in US dollars">
                {[50, 100, 250, 500, 1000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={unit === "usd" && typed === v ? "is-on" : ""}
                    onClick={() => {
                      setUnit("usd");
                      setAmount(String(v));
                    }}
                  >
                    ${v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="xflip" onClick={flip} aria-label={dir === "in" ? "Switch to selling BCH" : "Switch to getting BCH"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
            </svg>
          </button>

          <div className="xfield xfield--out">
            <span className="xfield__label">You get{mode === "floating" ? " about" : ""}</span>
            <div className="xfield__row">
              <output>{showCoin(out, getSym)}</output>
              {dir === "out" ? <CoinPicker rates={rates} value={from} onChange={setFrom} /> : <span className="xbadge xbadge--bch">BCH</span>}
            </div>
            <p className="xfield__foot">
              {pairErr ? pairErr : `1 ${sendSym} = ${showCoin(rate, getSym)} ${getSym} · ${mode === "fixed" ? "locked when you start" : "set when your deposit lands"}`}
              {dir === "out" && <NetworkSelect sym={from} value={net} onChange={setNet} />}
            </p>
          </div>

          <div className="xfield xfield--addr">
            <div className="xfield__top">
              <label htmlFor="xaddr">
                Your {getSym} address{netLabel(getSym, getNet)}
              </label>
            </div>
            <input autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-form-type="other"
              id="xaddr"
              className="xaddr"
              placeholder={getSym === "BCH" ? "bitcoincash:q…" : `Paste your ${getSym} address`}
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              onBlur={() => addr && setTouched(true)}
            />
            {touched && addr && !addrOk && <p className="xfield__foot is-err">That does not look like a {getSym} address{netLabel(getSym, getNet)}.</p>}
            {getSym === "BCH" && onWallet && !addr && <WalletLink onOpen={onWallet} />}
            {needsMemo && (
              <input autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-form-type="other" className="xaddr xaddr--memo" placeholder="Destination tag (if your wallet needs one)" value={memo} onChange={(e) => setMemo(e.target.value)} />
            )}
          </div>



          {blocked && <p className="xfield__foot is-err">SideShift is not available where you are, so swaps are off for you.</p>}
          {err && <p className="xfield__foot is-err">{err}</p>}

          <button className="xgo" disabled={blocked || busy} onClick={start}>
            {busy ? "Starting…" : dir === "in" ? `Swap ${sendSym} for BCH` : `Swap BCH for ${getSym}`}
          </button>
          {touched && !canGo && !busy && !blocked && (
            <p className="xfield__foot is-err xhint">
              {!(amt > 0) || tooSmall || tooBig ? "Check the amount above." : "Add a valid address to receive your coins."}
            </p>
          )}
        </>
      )}
      <p className="xpowered">
        Exchange powered by <b>{PARTNER.name}</b> ·{" "}
        <a href={PARTNER.url} target="_blank" rel="noopener">
          Read more about {PARTNER.name}
        </a>
      </p>
    </div>
  );
}

function useNowTick() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const mmss = (sec: number) => {
  if (sec >= 86400) return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
  if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, "0")}`;
};

// Payment URIs let wallets pre-fill the amount when the QR is scanned.
const URI_SCHEME: Record<string, string> = { BTC: "bitcoin", BCH: "bitcoincash", LTC: "litecoin", DOGE: "dogecoin" };

const STAGES = ["Send", "Confirm", "Exchange", "Done"];

function DepositView({ shift, onNew }: { shift: Shift; onNew: () => void }) {
  const [qr, setQr] = useState("");
  const now = useNowTick();
  const st = STATUS[shift.status] ?? { label: shift.status, step: 1 };
  const waiting = shift.status === "waiting";
  const done = shift.status === "settled";
  const stopped = ["refunded", "expired"].includes(shift.status);
  const nets = (sym: string, id: string) => NETWORKS[sym]?.find((n) => n.id === id)?.label ?? id;

  // what to tell the user to send: exact for locked rate, their chosen amount for market rate
  const sendAmount = shift.depositAmount ?? shift.requestedAmount ?? "";
  const getAmount = shift.settleAmount ?? shift.expectedOut ?? "";

  const left = now ? (Date.parse(shift.expiresAt) - now) / 1000 : NaN;
  const elapsed = now && shift.createdAt ? (now - Date.parse(shift.createdAt)) / 1000 : NaN;

  useEffect(() => {
    const scheme = URI_SCHEME[shift.depositCoin];
    const bare = shift.depositAddress.replace(/^[a-z]+:/i, "");
    const text = scheme && sendAmount ? `${scheme}:${bare}?amount=${sendAmount}` : shift.depositAddress;
    QRCode.toDataURL(text, { margin: 1, width: 360, color: { dark: "#04140e", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [shift.depositAddress, shift.depositCoin, sendAmount]);

  const progress = done ? 100 : stopped ? 100 : ((st.step - 1) / (STAGES.length - 1)) * 100;

  return (
    <div className="xch__card xlive" id="swap">
      <div className="xch__head">
        <h2>
          {shift.depositCoin} <span className="xlive__arrow">→</span> {shift.settleCoin}
        </h2>
        <span className={`xlive__chip ${done ? "is-done" : stopped ? "is-stop" : "is-run"}`}>
          {!done && !stopped && <i aria-hidden="true" />}
          {done ? "Complete" : stopped ? "Closed" : "Live"}
        </span>
      </div>

      <div className="xprog" aria-hidden="true">
        <div className="xprog__bar">
          <span style={{ width: `${progress}%` }} className={!done && !stopped ? "is-run" : ""} />
        </div>
        <ol className="xprog__steps">
          {STAGES.map((s, i) => (
            <li key={s} className={done || i + 1 < st.step ? "is-done" : i + 1 === st.step ? "is-on" : ""}>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <p className="xstatus" key={shift.status}>
        {st.label}
        {!done && !stopped && <span className="xdots" aria-hidden="true" />}
      </p>

      {waiting ? (
        <>
          <div className="xdep">
            <div className="xdep__qr">
              <span className="xscan" aria-hidden="true" />
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR code to pay ${sendAmount} ${shift.depositCoin}`} width={150} height={150} />
              )}
            </div>
            <div className="xdep__info">
              <p className="xdep__label">Send exactly</p>
              <p className="xdep__amt">
                {sendAmount} <span>{shift.depositCoin}</span>
              </p>
              <p className="xdep__net">
                on {nets(shift.depositCoin, shift.depositNetwork)} · you get {shift.settleAmount ? "" : "about "}
                {getAmount} {shift.settleCoin}
              </p>
              {Number.isFinite(left) && left > 0 && <p className="xdep__exp">{shift.depositAmount ? "Rate held for" : "Address open for"} {mmss(left)}</p>}
            </div>
          </div>
          <div className="xfield">
            <span className="xfield__label">
              To this {shift.depositCoin} address
              {/* coins on several networks (USDT, USDC): name the network right at the address, the costliest mistake */}
              {(NETWORKS[shift.depositCoin]?.length ?? 0) > 1 && <b> on {nets(shift.depositCoin, shift.depositNetwork)} only</b>}
            </span>
            <div className="xfield__row">
              <code className="xdep__addr">{shift.depositAddress}</code>
              <Copy text={shift.depositAddress} />
            </div>
          </div>
          {shift.depositMemo && (
            <div className="xfield">
              <span className="xfield__label">Memo / destination tag (required)</span>
              <div className="xfield__row">
                <code className="xdep__addr">{shift.depositMemo}</code>
                <Copy text={shift.depositMemo} />
              </div>
            </div>
          )}
          <div className="xverify">
            <p>This address comes from SideShift, not bch.now.</p>
            <a href={`https://sideshift.ai/orders/${shift.id}`} target="_blank" rel="noopener">
              Check it matches on SideShift ↗
            </a>
          </div>
          {!shift.depositAmount && shift.depositMin && (
            <p className="xmeta">
              Market rate: any amount from {shift.depositMin} to {shift.depositMax} {shift.depositCoin} works, and the final rate is set when it
              lands.
            </p>
          )}
        </>
      ) : (
        <div className={`xstage ${done ? "is-done" : stopped ? "is-stop" : "is-run"}`} key={`stage-${shift.status}`}>
          <div className="xstage__icon" aria-hidden="true">
            {done ? (
              <svg viewBox="0 0 52 52" width="64" height="64">
                <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="xcheck__ring" />
                <path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="xcheck__tick" />
              </svg>
            ) : stopped ? (
              <svg viewBox="0 0 52 52" width="64" height="64">
                <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M18 26h16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="xspin" />
            )}
          </div>
          <div>
            <p className="xstage__big">
              {shift.settleAmount ?? getAmount} {shift.settleCoin}
            </p>
            <p className="xmeta">
              {done
                ? `Sent to ${shift.settleAddress.slice(0, 10)}…${shift.settleAddress.slice(-6)}`
                : `On its way to ${shift.settleAddress.slice(0, 10)}…${shift.settleAddress.slice(-6)} on ${nets(shift.settleCoin, shift.settleNetwork)}`}
            </p>
          </div>
        </div>
      )}

      <p className="xmeta xlive__foot">
        {Number.isFinite(elapsed) && !done && !stopped ? `Started ${mmss(elapsed)} ago · ` : ""}Swap ID {shift.id}
      </p>

      <div className="xlive__actions">
        <a className="xbtn xbtn--help" href={PARTNER.support} target="_blank" rel="noopener">
          Get help from SideShift
        </a>
        <a className="xbtn" href={`https://sideshift.ai/orders/${shift.id}`} target="_blank" rel="noopener">
          Track on SideShift
        </a>
        <button className="xbtn xbtn--ghost" onClick={onNew}>
          New swap
        </button>
      </div>
      <p className="xpowered">
        Exchange powered by <b>{PARTNER.name}</b> ·{" "}
        <a href={PARTNER.url} target="_blank" rel="noopener">
          Read more about {PARTNER.name}
        </a>
      </p>
    </div>
  );
}
