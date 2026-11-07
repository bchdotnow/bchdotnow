import Link from "next/link";
import { LICENSE } from "@/lib/art-shared";
import { SOCIAL } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import "./art.css";

export default function ArtLayout({ children }: LayoutProps<"/media">) {
  return (
    <div className="field field--green art">
      <SiteHeader active="art" />

      {children}

      {/* the licence: page content, not a footer (the site footer comes from the root layout) */}
      <section className="art__foot" id="license" aria-labelledby="license-h">
        <h2 id="license-h">Use it for anything</h2>
        <p>
          Every piece here is free under <a href={LICENSE.url}>{LICENSE.name}</a>. Post it, print it, put it on a sticker, a slide or a
          T-shirt, remix it, even sell it. The one ask: credit <b>{LICENSE.credit}</b>, and keep the bch.now badge on.
        </p>
        <p>
          Made something with it? Tag <a href={SOCIAL.x}>{SOCIAL.xHandle}</a> on X and we&apos;ll share it.
        </p>
        <p className="art__legal">
          Parodies of other brands are commentary; those companies don&apos;t necessarily endorse Bitcoin Cash. <Link href="/">Get BCH now</Link>
        </p>
      </section>
    </div>
  );
}
