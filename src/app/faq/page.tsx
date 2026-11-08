import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { WALLETS } from "@/lib/wallets";
import { COINS } from "@/lib/coins";
import { commissionRate } from "@/lib/sideshift";
import { ldJson, PARTNER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bitcoin Cash Swap FAQ",
  description:
    "Answers about swapping BTC, ETH, USDT and more for Bitcoin Cash (BCH) on bch.now: fees, speed, limits, wallets, refunds and what a BCH address looks like.",
  alternates: { canonical: "/faq" },
};

// SideShift's default affiliate commission applies when none is configured.
const pct = (r: number) => `${(r * 100).toFixed(2).replace(/\.?0+$/, "")}%`;

type Faq = { q: string; a: string[]; more?: { href: string; label: string } };

function faqs(rate: string): Faq[] {
  const coins = COINS.map((c) => `${c.name} (${c.sym})`).join(", ");
  const wallets = WALLETS.map((w) => w.n).join(", ");
  const p = PARTNER.name;
  return [
    {
      q: "What is Bitcoin Cash?",
      a: [
        "Bitcoin Cash is a peer-to-peer electronic cash system. It split from Bitcoin in 2017 to keep fees low and payments fast by allowing bigger blocks. Sending BCH typically costs a fraction of a cent, which makes it practical for everyday payments.",
      ],
    },
    {
      q: "What is bch.now?",
      a: [
        `bch.now is one of the simplest ways to get Bitcoin Cash (BCH). You pick a coin you already have, enter your own BCH address, and send. The swap is run by ${p} and the BCH is paid straight to your wallet.`,
        "It works the other way too: you can swap BCH back to Bitcoin, Ethereum, stablecoins and more.",
      ],
    },
    {
      q: "Do I need an account to swap?",
      a: [
        "No. There is no sign-up, no email and no login on bch.now, and we don't use cookies. All you need is the address you want to be paid to.",
      ],
    },
    {
      q: "Which coins can I swap for Bitcoin Cash?",
      a: [
        `You can swap ${coins} for BCH, and BCH back to any of them.`,
        "USDT can be sent on Ethereum, Tron, Solana or BNB Chain, and USDC on Ethereum, Solana, Base or Polygon. Pick the network your coins are actually on before you send.",
      ],
    },
    {
      q: "How much does it cost?",
      a: [
        `bch.now earns a ${rate} commission from ${p} on each swap. It is already built into the rate you see, not added on top. There are no other fees from bch.now.`,
        "The normal network fee for sending your coins still applies, and is paid to that network, not to us.",
      ],
    },
    {
      q: "What is the difference between a locked rate and the market rate?",
      a: [
        "With a locked rate, the amount you are shown is the amount you get, as long as your deposit arrives before the countdown on the swap screen runs out.",
        "With the market rate, the price is set when your deposit lands. It can be slightly better or worse than the quote, and there is no countdown to beat.",
      ],
    },
    {
      q: "How long does a swap take?",
      a: [
        `It depends mostly on the coin you send. ${p} waits for your deposit to confirm on its own network, then pays out the BCH, usually within a few minutes of that.`,
        "Fast networks like Solana, Tron or Litecoin confirm in minutes. Bitcoin is slower because its blocks come about every 10 minutes. The swap screen shows each step live, so you can see exactly where your order is.",
      ],
    },
    {
      q: "Is there a minimum or maximum amount?",
      a: [
        `Yes. ${p} sets a minimum and maximum for each pair, and they move with the market. The swap screen shows the current limits for the coin and amount you choose before you start.`,
      ],
    },
    {
      q: "Does bch.now hold my coins?",
      a: [
        `No. bch.now has no wallet and no keys. Your deposit goes to an address issued by ${p}, and ${p} pays out directly to your address. We can't move, freeze or reverse your coins at any point.`,
        `Every swap screen has a button to open your order on ${p}'s own site, so you can check the deposit address matches before you send.`,
      ],
      more: { href: "/how-it-works", label: "How to check your order" },
    },
    {
      q: "Which wallet should I use for Bitcoin Cash?",
      a: [
        `Any wallet where you hold your own keys. Possible choices include ${wallets}, but always do your own research before you pick one.`,
      ],
    },
    {
      q: "What if I send the wrong amount, or send too late?",
      a: [
        `${p} holds the coins during a swap, so they handle it. If a deposit can't be completed, for example it is below the minimum or arrives after a locked rate expires, ${p} refunds it. You can set the refund address on the order page.`,
        "Keep your swap ID private. Anyone who has it can open the order.",
      ],
    },
    {
      q: "Why can't I swap from my country?",
      a: [
        `${p} isn't available everywhere. Where it isn't, bch.now won't let you start a swap, so your coins are never sent somewhere they can't be processed.`,
      ],
    },
    {
      q: "Where can I find the latest on how swaps work?",
      a: [
        `${p} runs the swaps, so changes to supported networks, limits, refunds and availability come from them first. For the most up-to-date details on the swap itself, check ${p}'s help centre.`,
      ],
      more: { href: PARTNER.support, label: `${p} help centre` },
    },
  ];
}

export default function Faq() {
  const items = faqs(pct(commissionRate() ?? 0.005));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://bch.now/faq#faq",
    url: "https://bch.now/faq",
    inLanguage: "en",
    isPartOf: { "@id": "https://bch.now/#website" },
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
    })),
  };

  return (
    <main className="field field--green how">
      <SiteHeader active="swap" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />

      <article className="how__body">
        <h1>Bitcoin Cash swap FAQ</h1>
        <p className="how__lead">Quick answers about getting Bitcoin Cash on bch.now: costs, timing, limits and wallets.</p>

        {items.map((f) => (
          <section key={f.q}>
            <h2>{f.q}</h2>
            {f.a.map((t) => (
              <p key={t}>{t}</p>
            ))}
            {f.more && (
              <p>
                {f.more.href.startsWith("/") ? (
                  <Link href={f.more.href}>{f.more.label} →</Link>
                ) : (
                  <a href={f.more.href} target="_blank" rel="noopener">
                    {f.more.label} ↗
                  </a>
                )}
              </p>
            )}
          </section>
        ))}

        <p className="how__back">
          <Link href="/">← Swap to BCH now</Link>
        </p>
      </article>
    </main>
  );
}
