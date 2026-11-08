import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Sponsor from "@/components/Sponsor";
import { fmtInt, fmtPct, fmtUsd, fmtUsdCompact } from "@/lib/format";
import { SOCIAL } from "@/lib/site";
import { fmtFee, getToday, SOURCES, type Today } from "@/lib/today";
import "./today.css";

export const metadata: Metadata = {
  title: "Bitcoin Cash today: price, fees and payments in the last 24 hours",
  description:
    "The last 24 hours of Bitcoin Cash: price, how many transactions went through, what a typical payment cost, and one big transfer. Every number links to its source.",
  alternates: { canonical: "/today" },
  openGraph: {
    type: "website",
    url: "https://bch.now/today",
    siteName: "bch.now",
    title: "Bitcoin Cash today",
    description: "Price, transactions and fees from the last 24 hours, each linked to its source.",
  },
  twitter: { card: "summary_large_image", site: "@bchdotnow", title: "Bitcoin Cash today", description: "The last 24 hours of Bitcoin Cash: price, transactions and fees." },
};

const utc = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-GB", { ...o, timeZone: "UTC" });

function Spark({ values }: { values: number[] }) {
  const W = 600, H = 180, lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, 8 + (H - 16) * (1 - (v - lo) / span)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg className="tday__spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Price over the last 24 hours, from ${fmtUsd(values[0])} to ${fmtUsd(values[values.length - 1])}`}>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} className="tday__area" />
      <path d={line} className="tday__line" vectorEffect="non-scaling-stroke" />
      <circle cx={ex} cy={ey} r="5" className="tday__dot" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Src({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="tday__src" href={href} target="_blank" rel="noopener">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}

function Numbers({ t }: { t: Today }) {
  const up = (t.change24h ?? 0) >= 0;
  const perDollar = t.medianFeeUsd > 0 ? Math.floor(1 / t.medianFeeUsd) : null;
  return (
    <>
      <p className="tday__when">
        {utc(t.at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · numbers from {utc(t.at, { hour: "2-digit", minute: "2-digit" })} UTC
      </p>

      <section className="tday__price" aria-labelledby="tday-price">
        <div className="tday__pricehead">
          <h2 id="tday-price">Price</h2>
          <p className="tday__big">{fmtUsd(t.priceUsd)}</p>
          {t.change24h != null && (
            <p className={`tday__chg ${up ? "is-up" : "is-down"}`}>
              <span aria-hidden="true">{up ? "▲" : "▼"}</span> {fmtPct(t.change24h, 1)} in 24 hours
            </p>
          )}
        </div>
        {t.spark.length > 0 && <Spark values={t.spark} />}
        <p className="tday__pricefoot">
          {t.marketCapUsd != null && <span>Market cap {fmtUsdCompact(t.marketCapUsd)}</span>}
          {t.volume24hUsd != null && <span>24h trading volume {fmtUsdCompact(t.volume24hUsd)}</span>}
          <Src href={t.priceSource === "CoinGecko" ? SOURCES.price : SOURCES.stats}>{t.priceSource}</Src>
        </p>
      </section>

      <section className="tday__grid" aria-label="The network in the last 24 hours">
        <div className="tday__card">
          <h2>Transactions</h2>
          <p className="tday__num">{fmtInt(t.tx24h)}</p>
          <p>went through in the last 24 hours.</p>
          <Src href={SOURCES.stats}>Blockchair</Src>
        </div>
        <div className="tday__card">
          <h2>Typical fee</h2>
          <p className="tday__num">{fmtFee(t.medianFeeUsd)}</p>
          <p>
            per transaction (the median).
            {perDollar && perDollar > 1 && <> At that rate, $1 covers the fees on {fmtInt(perDollar)} transactions.</>}
          </p>
          <Src href={SOURCES.stats}>Blockchair</Src>
        </div>
      </section>

      {t.big && (
        <section className="tday__feature" aria-labelledby="tday-big">
          <p className="tday__kicker">One transaction today</p>
          <h2 id="tday-big">
            <span>{fmtUsdCompact(t.big.sentUsd)} moved.</span>
            {t.big.feeUsd != null && <span className="tday__fee"> Fee: {fmtFee(t.big.feeUsd)}.</span>}
          </h2>
          <p>{fmtInt(Math.round(t.big.sentBch))} BCH to one address.</p>
          <Src href={SOURCES.tx(t.big.hash)}>See the transaction on Blockchair</Src>
        </section>
      )}
    </>
  );
}

export default async function TodayPage() {
  const t = await getToday();
  return (
    <main className="field field--green tday">
      <SiteHeader active="today" />

      <article className="tday__body">
        <header className="tday__hero">
          <h1>
            Bitcoin Cash <span className="tday__sticker">today</span>
          </h1>
          <p className="tday__lead">What happened on the network in the last 24 hours.</p>
        </header>

        {t ? (
          <Numbers t={t} />
        ) : (
          <p className="tday__down">The numbers are on their way. Our data sources didn&apos;t answer just now; refresh in a minute.</p>
        )}

        <section className="tday__how" aria-labelledby="tday-how">
          <h2 id="tday-how">Where these numbers come from</h2>
          <ul>
            <li>
              <b>Price, market cap and trading volume:</b> <a href={SOURCES.price}>CoinGecko</a>, with Blockchair as a backup.
            </li>
            <li>
              <b>Transactions and fees:</b> <a href={SOURCES.stats}>Blockchair</a>, counted over the last 24 hours, not since midnight.
            </li>
            <li>
              <b>Fees are shown in US dollars,</b> as Blockchair reports them.
            </li>
            <li>
              <b>Numbers update every couple of minutes.</b> Nothing here is financial advice.
            </li>
          </ul>
        </section>

        <section className="tday__cta">
          <p>Get these numbers on X every day.</p>
          <div>
            <a className="btn btn--solid" href={SOCIAL.x} target="_blank" rel="noopener">
              Follow {SOCIAL.xHandle}
            </a>
            <Link className="btn tday__ghost" href="/">
              Get BCH now
            </Link>
          </div>
        </section>

        <Sponsor card />
      </article>
    </main>
  );
}
