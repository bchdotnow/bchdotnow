"use client";
import { useState } from "react";
import { sponsor, SPONSOR_CONTACT } from "@/lib/sponsor";

/**
 * The one annual sponsorship. While it's unsold this offers the slot ("Put your project at the
 * front of bch.now"); once sold, flip `active` in lib/sponsor.ts and it credits the sponsor instead.
 * `card` draws it as a rounded block inside the page column (Media, Today); without it, it's the
 * full-width strip across the bottom of the homepage hero.
 */
export default function Sponsor({ card = false }: { card?: boolean }) {
  return (
    <div className={card ? "sponsorstrip sponsorstrip--card" : "hero__sponsor"} id="sponsor">
      {sponsor.active ? (
        <a href={sponsor.url} target="_blank" rel="sponsored noopener" className="hero__sponsor-live">
          bch.now is supported by <strong>{sponsor.name}</strong>
        </a>
      ) : (
        <SponsorForm />
      )}
    </div>
  );
}

function SponsorForm() {
  const [name, setName] = useState("");
  return (
    <form
      autoComplete="off"
      className="blank"
      onSubmit={(e) => {
        e.preventDefault();
        const subject = encodeURIComponent(`bch.now sponsorship: ${name || "my project"}`);
        window.location.href = `mailto:sponsor@bch.now?subject=${subject}`;
      }}
    >
      <p className="blank__tag">Sponsorship</p>
      <h2 id="cta-h" className="blank__sentence">
        Put{" "}
        <label htmlFor="sponsor-name" className="sr-only">
          Your project
        </label>
        <input autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} data-1p-ignore="true" data-lpignore="true" data-form-type="other" id="sponsor-name" placeholder="your project" value={name} onChange={(e) => setName(e.target.value)} /> at the
        front of bch.now. <button type="submit">Enquire</button>
      </h2>
      <p className="blank__after">
        <span>
          Enquiries: <a href={SPONSOR_CONTACT}>sponsor@bch.now</a>
        </span>
      </p>
    </form>
  );
}
