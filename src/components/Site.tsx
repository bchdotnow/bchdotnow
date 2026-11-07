"use client";
import { useEffect, useState } from "react";
import type { Market, Sourced } from "@/lib/types";
import { sponsor, SPONSOR_CONTACT } from "@/lib/sponsor";
import { ExchangeCard, useRates } from "./Exchange";
import StatTicker from "./StatTicker";
import WalletDrawer from "./WalletDrawer";
import { fmtPct } from "@/lib/format";
import SiteHeader from "./SiteHeader";
import type { ReactNode } from "react";

// Each one reads as "<phrase> BCH.now". One is picked at random per visit and stays.
const WANTS = ["I need", "I want", "Get me", "Gimme", "Send me", "Hook me up with"];
const TILTS = [-3, -4.5, -2, -5, -2.5, -3.5];

/** The black sticker: a random phrase per page load, no rotation. */
function WantSticker() {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setI(Math.floor(Math.random() * WANTS.length)), 0);
    return () => clearTimeout(t);
  }, []);
  const n = i ?? 1;
  return (
    <span
      className={`sticker ${i === null ? "sticker--pending" : ""}`}
      aria-hidden="true"
      style={{ rotate: `${TILTS[n]}deg` }}
    >
      {WANTS[n]}
    </span>
  );
}

type Cur = "usd" | "eur" | "gbp" | "btc" | "eth";
const CURS: Cur[] = ["usd", "eur", "gbp", "btc", "eth"];
function fmtQuote(v: number, c: Cur) {
  if (!Number.isFinite(v)) return "…";
  if (c === "btc") return `${v.toFixed(5)} BTC`;
  if (c === "eth") return `${v.toPrecision(4)} ETH`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c.toUpperCase() }).format(v);
}

/** BCH price in several currencies, refreshed every 30 seconds. */
function useMarket() {
  const [m, setM] = useState<Market | null>(null);
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/market")
        .then((r) => r.json())
        .then((j: Sourced<Market>) => live && j.data && setM(j.data))
        .catch(() => {});
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return m;
}

// White starburst with "NEW" cut out of it; only the burst turns.
// The NEW badge retires itself on 1 January 2027 (checked in the browser,
// since the page is prerendered).
const NEW_BADGE_UNTIL = Date.UTC(2027, 0, 1); // 1 Jan 2027 00:00 UTC

function NewBadge() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (Date.now() >= NEW_BADGE_UNTIL) setShow(false);
  }, []);
  if (!show) return null;
  return (
    <svg className="newbadge" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <title>bch.now is new. Swaps are processed by SideShift.</title>
      <mask id="newbadge-cut">
        <polygon fill="#fff" points="50.0,0.0 59.1,10.0 71.7,5.0 75.6,17.9 89.1,18.8 86.9,32.2 98.7,38.9 91.0,50.0 98.7,61.1 86.9,67.8 89.1,81.2 75.6,82.1 71.7,95.0 59.1,90.0 50.0,100.0 40.9,90.0 28.3,95.0 24.4,82.1 10.9,81.2 13.1,67.8 1.3,61.1 9.0,50.0 1.3,38.9 13.1,32.2 10.9,18.8 24.4,17.9 28.3,5.0 40.9,10.0">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="24s"
            repeatCount="indefinite"
          />
        </polygon>
        <text
          x="50"
          y="50"
          fill="#000"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="27"
          fontWeight="900"
          letterSpacing="0.5"
          transform="rotate(-12 50 50)"
        >
          NEW
        </text>
      </mask>
      <rect width="100" height="100" fill="#fff" mask="url(#newbadge-cut)" />
    </svg>
  );
}

/** `below` is server-rendered content shown after the hero (the newest art strip). */
export default function Site({ below }: { below?: ReactNode }) {
  const m = useMarket();
  const rx = useRates();
  const [cur, setCur] = useState<Cur>("usd");
  const [from, setFrom] = useState("BTC");
  const [walletOpen, setWalletOpen] = useState(false);
  const priceLine = m ? fmtQuote(m.quotes?.[cur] ?? (cur === "usd" ? m.priceUsd : NaN), cur) : "…";
  const chg = m ? (m.changes?.[cur] ?? (cur === "usd" ? m.change24hPct : NaN)) : NaN;

  return (
    <main>
      <section id="top" className="field field--green hero" aria-labelledby="hero-h">
        <SiteHeader active="swap" className="hero__top" onWallet={() => setWalletOpen(true)}>
          <p className="tagline">
            The easiest way to get Bitcoin Cash, a peer-to-peer <em>electronic cash</em> system for the whole world.
          </p>
        </SiteHeader>

        <div className="hero__grid">
          <div className="hero__left">
            <h1 id="hero-h" className="lines hero__h" aria-label="I want BCH.now">
              <span className="line">
                <span data-line style={{ ["--i" as string]: 0 }}>
                  <WantSticker />
                </span>
              </span>
              <span className="line">
                <span data-line style={{ ["--i" as string]: 1 }} className="nowrap">
                  BCH.now
                  <NewBadge />
                </span>
              </span>
            </h1>
            <div className="pricebox" aria-live="polite">
              <span className="pricebox__head">
                <span className="pricebox__label">Bitcoin Cash is now</span>
                <span className="curs" role="radiogroup" aria-label="Price currency">
                  {CURS.map((c) => (
                    <button key={c} role="radio" aria-checked={cur === c} className={cur === c ? "is-on" : ""} onClick={() => setCur(c)}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </span>
              </span>
              <span className="pricebox__row">
                <strong className="pricebox__num">{priceLine}</strong>
                {Number.isFinite(chg) && (
                  <span className={`pricebox__chg ${chg >= 0 ? "is-up" : "is-down"}`}>
                    {fmtPct(chg)} today
                  </span>
                )}
              </span>
            </div>
            <p className="hero__sub">Trade BTC, ETH, USDT and more for Bitcoin Cash, or back again. Paid straight to your wallet.</p>

            <div className="chips">
            <StatTicker m={m} />
            </div>
          </div>

          <div className="hero__swap">
            <ExchangeCard rx={rx} from={from} setFrom={setFrom} onWallet={() => setWalletOpen(true)} />
          </div>
        </div>

        <p className="hero__legal">Not financial advice. We never hold your coins or keys. Prices from CoinGecko.</p>

        <div className="hero__sponsor" id="sponsor">
          {sponsor.active ? (
            <a href={sponsor.url} target="_blank" rel="sponsored noopener" className="hero__sponsor-live">
              bch.now is supported by <strong>{sponsor.name}</strong>
            </a>
          ) : (
            <SponsorForm />
          )}
        </div>
      </section>

      {below}

      <WalletDrawer open={walletOpen} setOpen={setWalletOpen} />
    </main>
  );
}

function SponsorForm() {
  const [name, setName] = useState("");
  return (
    <form
      autoComplete="off"
      className="blank"
      onSubmit={(e) => {
        e.preventDefault();
        const subject = encodeURIComponent(`bch.now sponsorship: ${name || "my project"}`);
        window.location.href = `mailto:sponsor@bch.now?subject=${subject}`;
      }}
    >
      <p className="blank__tag">Sponsorship</p>
      <h2 id="cta-h" className="blank__sentence">
        Put{" "}
        <label htmlFor="sponsor-name" className="sr-only">
          Your project
        </label>
        <input autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-form-type="other" id="sponsor-name" placeholder="your project" value={name} onChange={(e) => setName(e.target.value)} /> at the
        front of bch.now. <button type="submit">Enquire</button>
      </h2>
      <p className="blank__after">
        <span>
          Enquiries: <a href={SPONSOR_CONTACT}>sponsor@bch.now</a>
        </span>
      </p>
    </form>
  );
}
