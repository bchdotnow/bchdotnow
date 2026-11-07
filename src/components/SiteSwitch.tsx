import Link from "next/link";

/** The Swap / Media toggle, in the same spot on both halves of the site. */
export default function SiteSwitch({ active }: { active: "swap" | "art" }) {
  return (
    <nav className="sswitch" aria-label="Site sections">
      <Link href="/" className={active === "swap" ? "is-on" : ""} aria-current={active === "swap" ? "page" : undefined}>
        Swap
      </Link>
      <Link href="/media" className={active === "art" ? "is-on" : ""} aria-current={active === "art" ? "page" : undefined}>
        Media
      </Link>
    </nav>
  );
}
