import Link from "next/link";
import { BUILD_YEAR, COMMIT, SOCIAL, SOURCE_URL } from "@/lib/site";

/** The one site footer. Rendered once in the root layout, so every page gets the same one. */
export default function SiteFooter() {
  return (
    <footer className="sitefoot">
      <nav className="sitefoot__nav" aria-label="Footer">
        <Link href="/">Swap</Link>
        <Link href="/media">Media</Link>
        <Link href="/today">Today</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/faq">FAQ</Link>
        <a className="sitefoot__ext" href={SOCIAL.x} target="_blank" rel="noopener">
          X
        </a>
        <a className="sitefoot__ext" href={SOCIAL.github} target="_blank" rel="noopener">
          GitHub
        </a>
      </nav>
      <p>
        © {BUILD_YEAR} bch.now ·{" "}
        {COMMIT ? (
          <>
            Website source:{" "}
            <a href={SOURCE_URL} target="_blank" rel="noopener">
              commit {COMMIT.slice(0, 7)}
            </a>
          </>
        ) : (
          <a href={SOURCE_URL} target="_blank" rel="noopener">
            Website source
          </a>
        )}
      </p>
    </footer>
  );
}
