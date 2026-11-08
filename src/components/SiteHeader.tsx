"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import SiteSwitch from "./SiteSwitch";
import SiteIcons from "./SiteIcons";
import WalletDrawer from "./WalletDrawer";

/**
 * The one site header: logo, Swap / Media switch and the round icons. Use it on every page.
 * Pass `onWallet` if the page already has its own wallet drawer (the homepage does); otherwise
 * the header brings its own. `children` goes inside the header (the homepage tagline).
 */
export default function SiteHeader({
  active,
  onWallet,
  className = "sitetop",
  children,
}: {
  active: "swap" | "art" | "today";
  onWallet?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className={className}>
        <Link href="/" className="wordmark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="wordmark__logo" src="/logo.svg" alt="bch.now home" width={59} height={36} />
        </Link>
        <SiteSwitch active={active} />
        <SiteIcons onWallet={onWallet ?? (() => setOpen(true))} />
        {children}
      </header>
      {!onWallet && <WalletDrawer open={open} setOpen={setOpen} />}
    </>
  );
}
