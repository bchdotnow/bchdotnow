"use client";
import Link from "next/link";
import { SOCIAL } from "@/lib/site";
import { WalletIcon } from "./WalletDrawer";

/** The round header icons, shared by the homepage and the art pages. */
export default function SiteIcons({ onWallet }: { onWallet: () => void }) {
  return (
    <div className="socials">
      <a className="xlink" href={SOCIAL.x} target="_blank" rel="noopener" aria-label="bch.now on X">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </a>
      <a className="xlink" href={SOCIAL.github} target="_blank" rel="noopener" aria-label="bch.now source code on GitHub">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
      </a>
      <button className="xlink" type="button" onClick={onWallet} aria-label="Get a BCH wallet" title="Get a BCH wallet">
        <WalletIcon size={20} />
      </button>
      <Link className="xlink" href="/how-it-works" aria-label="How swaps work" title="How swaps work">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm10-3c-.299 0-.566.13-.75.339a1 1 0 0 1-1.5-1.324A2.99 2.99 0 0 1 12 7a3 3 0 0 1 1 5.829V13a1 1 0 1 1-2 0v-.5c0-.872.687-1.388 1.248-1.531A1 1 0 0 0 12 9zm0 6a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H12z"
          />
        </svg>
      </Link>
    </div>
  );
}
