import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { commissionRate } from "@/lib/sideshift";
import { COMMIT, PARTNER, SOCIAL, SOURCE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How swaps work",
  description:
    "bch.now never holds your coins. Swaps are run by SideShift and paid straight to your wallet. What it costs, and how to check your order yourself.",
  alternates: { canonical: "/how-it-works" },
};

// SideShift's default affiliate commission applies when none is configured.
const pct = (r: number) => `${(r * 100).toFixed(2).replace(/\.?0+$/, "")}%`;

export default function HowItWorks() {
  const rate = pct(commissionRate() ?? 0.005);
  return (
    <main className="field field--green how">
      <SiteHeader active="swap" />

      <article className="how__body">
        <h1>How swaps work</h1>
        <p className="how__lead">
          bch.now never holds your coins. Swaps are run by <a href={PARTNER.url}>{PARTNER.name}</a>, and paid straight to your own wallet.
        </p>

        <h2>What happens when you swap</h2>
        <ol>
          <li>You pick the coins and enter the address you want to be paid to.</li>
          <li>bch.now asks {PARTNER.name} to create the swap. {PARTNER.name} gives back a deposit address that belongs to {PARTNER.name}.</li>
          <li>You send your coins to that address. They go to {PARTNER.name}, not to bch.now.</li>
          <li>{PARTNER.name} exchanges them and pays out directly to your address.</li>
        </ol>
        <p>bch.now has no wallet and no keys. We can&apos;t move, hold, freeze or reverse your coins at any point.</p>

        <h2>Check your order on {PARTNER.name}</h2>
        <p>
          You don&apos;t have to take our word for any of this. Every swap screen has a <b>Check it matches on {PARTNER.name}</b> button. It
          opens your order on {PARTNER.name}&apos;s own site, where you can see the deposit address they issued.
        </p>
        <p>
          <b>If the address on bch.now and the address on {PARTNER.name} are different, don&apos;t send.</b>
        </p>
        <p>
          Keep your swap ID to yourself. Anyone who has it can open the order, and if a refund is needed they could choose where it goes.
        </p>

        <h2>What it costs</h2>
        <p>
          bch.now earns a {rate} commission from {PARTNER.name} on each swap. It&apos;s already built into the rate you see, not added on top.
          With a locked rate, the amount you&apos;re shown is what you get; with the market rate it&apos;s set when your deposit lands. There are
          no other fees from bch.now. Network fees for sending
          your coins still apply.
        </p>

        <h2>If something goes wrong</h2>
        <p>
          Because {PARTNER.name} holds the coins during a swap, they&apos;re the ones who can help. If a deposit can&apos;t be completed, for
          example it arrives too late or is the wrong amount, {PARTNER.name} refunds it, and you can set the refund address on the order page.
          Get help at <a href={PARTNER.support}>{PARTNER.support.replace("https://", "")}</a>.
        </p>
        <p>{PARTNER.name} isn&apos;t available in every country. Where it isn&apos;t, bch.now won&apos;t let you start a swap.</p>

        <h2>What we count</h2>
        <p>We don&apos;t use accounts or cookies.</p>
        <ol>
          <li>
            <b>Visits.</b> We count page views so we know how many people use the site. If your browser is set to not be tracked, we
            skip you.
          </li>
          <li>
            <b>Swaps.</b> We count completed swaps and their total value. We hold on to the swap ID until it completes, then drop it.
            We never keep your addresses.
          </li>
          <li>
            <b>Media downloads.</b> When you download or copy something from <Link href="/media">bch.now media</Link>, we add one to
            that piece&apos;s count and to the count for the format you picked (PNG, GIF, MP4…). Just the number: nothing about who
            downloaded it.
          </li>
        </ol>
        <p>
          {PARTNER.name} runs the swap, so they get your payout address and IP address. Their privacy policy covers what they do with
          them.
        </p>

        <h2>The code</h2>
        <p>
          bch.now is open source on <a href={SOCIAL.github}>GitHub</a>
          {COMMIT && (
            <>
              . This page was built from commit <a href={SOURCE_URL}>{COMMIT.slice(0, 7)}</a>
            </>
          )}
          . A commit link can&apos;t prove what a server is really running, which is why the check on {PARTNER.name} above is the one that
          matters.
        </p>

        <p className="how__back">
          <Link href="/">← Back to bch.now</Link>
        </p>
      </article>
    </main>
  );
}
