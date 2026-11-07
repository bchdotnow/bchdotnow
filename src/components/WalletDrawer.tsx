"use client";
import { useEffect } from "react";

// Same picker as BCH Bull Lite: non-custodial wallets only.
export const WALLETS = [
  { n: "Selene Wallet", k: "selene", p: "iOS · Android · Web", d: "Built for first-timers. No seed phrase to write down on day one, and it handles CashTokens.", u: "https://selene.cash" },
  { n: "Paytaca", k: "paytaca", p: "iOS · Android · Browser", d: "Full-featured mobile wallet with point-of-sale tools and CashTokens support.", u: "https://www.paytaca.com" },
  { n: "Electron Cash", k: "electron", p: "Windows · macOS · Linux · Android", d: "The long-standing desktop wallet. Auditable, and the usual choice for larger amounts.", u: "https://electroncash.org" },
  { n: "Cashonize", k: "cashonize", p: "Browser", d: "Runs entirely in your browser with no install. Handy for trying things quickly.", u: "https://cashonize.com" },
  { n: "Bitcoin.com Wallet", k: "bitcoincom", p: "iOS · Android · Desktop", d: "Widely used multi-coin wallet. Non-custodial, though it bundles services you can ignore.", u: "https://wallet.bitcoin.com" },
  { n: "Edge", k: "edge", p: "iOS · Android", d: "Multi-currency wallet with login-style recovery instead of raw seed handling.", u: "https://edge.app" },
];

export const WalletIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="3.5" />
    <path d="M2 10h20" />
    <circle cx="17.5" cy="14.5" r="1.4" />
  </svg>
);

/** Side drawer with a "Get BCH wallet" tab on the screen edge; a bottom sheet on phones. */
export default function WalletDrawer({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <div className={`wbg ${open ? "on" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`wdrawer ${open ? "on" : ""}`} role="dialog" aria-modal={open} aria-labelledby="walTitle" aria-hidden={!open}>
        <button className="wdrawer__tab" onClick={() => setOpen(!open)} aria-label={open ? "Close wallet picker" : "Open wallet picker"} aria-hidden={false}>
          <span className="wdrawer__ico">
            <WalletIcon size={22} />
          </span>
          <span className="wdrawer__vlbl">Get BCH wallet</span>
          <span className="wdrawer__chev" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </span>
        </button>
        <div className="wdrawer__hd">
          <div>
            <h3 id="walTitle">Get a Bitcoin Cash wallet</h3>
            <p>
              These wallets are non-custodial, so you own your keys and your coins. bch.now has no wallet and never holds your keys. Always do
              your own research.
            </p>
          </div>
          <button className="wdrawer__x" onClick={() => setOpen(false)} aria-label="Close" tabIndex={open ? 0 : -1}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="wdrawer__bd">
          {WALLETS.map((w, i) => (
            <a
              key={w.k}
              className="wal"
              href={w.u}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              style={{ ["--d" as string]: `${i * 50}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="wal__ic" src={`/wallets/${w.k}.png`} alt="" loading="lazy" width={46} height={46} />
              <span className="wal__txt">
                <b>{w.n}</b>
                <span className="wal__d">{w.d}</span>
                <span className="wal__plat">{w.p}</span>
              </span>
              <span className="wal__go" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </span>
            </a>
          ))}
        </div>
        <div className="wdrawer__ft">
          There is no wallet connection here. Nothing on this page can see or spend your coins. It only needs an address to send to.
        </div>
      </aside>
    </>
  );
}

export function WalletLink({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="wlink" onClick={onOpen} type="button">
      <span className="wlink__ic">
        <WalletIcon size={18} />
      </span>
      <span className="wlink__txt">
        <b>No BCH wallet?</b>
        <span>{WALLETS.length} non-custodial wallets to check out</span>
      </span>
      <span className="wlink__go" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}
