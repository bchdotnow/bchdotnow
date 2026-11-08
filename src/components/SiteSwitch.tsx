import Link from "next/link";

type Section = "swap" | "art" | "today";
const LINKS: { id: Section; href: string; label: string }[] = [
  { id: "swap", href: "/", label: "Swap" },
  { id: "art", href: "/media", label: "Media" },
  { id: "today", href: "/today", label: "Today" },
];

/** The Swap / Media / Today switch, in the same spot on every page. */
export default function SiteSwitch({ active }: { active: Section }) {
  return (
    <nav className="sswitch" aria-label="Site sections">
      {LINKS.map((l) => (
        <Link key={l.id} href={l.href} className={active === l.id ? "is-on" : ""} aria-current={active === l.id ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
