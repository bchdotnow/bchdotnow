"use client";
import { useEffect, useRef, useState } from "react";
import { fmtBytes, type ArtFormat } from "@/lib/art-shared";

type Props = {
  slug: string;
  title: string;
  webUrl: string;
  pageUrl: string;
  xHandle: string;
  /** main format first */
  downloads: { f: ArtFormat; label: string; bytes?: number }[];
  /** clipboards only take still images */
  canCopy: boolean;
  /** the file handed to the phone's share sheet, so it arrives in X as a real attachment */
  shareFile: { url: string; name: string; type: string };
};

/** Turn any image into a PNG blob: clipboards only accept PNG. */
async function toPng(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(String(res.status));
  const bmp = await createImageBitmap(await res.blob());
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("toBlob"))), "image/png"));
}

export default function ArtActions({ slug, title, webUrl, pageUrl, xHandle, downloads, canCopy, shareFile }: Props) {
  const [note, setNote] = useState("");
  // Phones (and some desktops) can share the actual file. It's fetched up front because iOS only
  // opens the share sheet straight from the tap; usually a cache hit, as the page already shows it.
  const [canShareFile, setCanShareFile] = useState(false);
  const fileRef = useRef<File | null>(null);
  useEffect(() => {
    // touch devices only: desktop share panels (e.g. Windows) often don't list X, so desktops copy + paste instead
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const probe = new File([new Blob()], shareFile.name, { type: shareFile.type });
    if (!touch || !navigator.canShare?.({ files: [probe] })) return;
    let live = true;
    fetch(shareFile.url, { mode: "cors" })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        if (!live) return;
        fileRef.current = new File([b], shareFile.name, { type: shareFile.type });
        setCanShareFile(true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [shareFile.url, shareFile.name, shareFile.type]);
  const flash = (s: string) => {
    setNote(s);
    setTimeout(() => setNote(""), 2400);
  };

  const copyImage = async () => {
    try {
      // Safari wants the promise handed over inside the click, so build the item first.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": toPng(webUrl) })]);
      flash("Image copied. Paste it into your post.");
      fetch(`/api/art/dl/${slug}`, { method: "POST" }).catch(() => {});
    } catch {
      flash("Your browser blocked copying. Use Download instead.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      flash("Link copied.");
    } catch {
      flash(pageUrl);
    }
  };

  // The link goes inside the text (not X's url= field, which tacks it onto the same line):
  //   Let the Kid Play by @bchdotnow
  //
  //   https://bch.now/media/let-the-kid-play
  const tweet = `${title} by ${xHandle}\n\n${pageUrl}`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}`;

  // X links can't carry an image, so: phones share the real file (pick X in the share sheet);
  // desktops copy the image as the post window opens, ready for Ctrl+V; failing both, the link
  // still shows a large picture card of the piece.
  const postOnX = (e: React.MouseEvent) => {
    const file = fileRef.current;
    if (canShareFile && file) {
      e.preventDefault();
      navigator
        .share({ files: [file], text: tweet })
        .then(() => fetch(`/api/art/dl/${slug}`, { method: "POST" }).catch(() => {}))
        .catch((err: Error) => {
          if (err.name !== "AbortError") window.open(xUrl, "_blank", "noopener");
        });
      return;
    }
    if (canCopy && typeof ClipboardItem !== "undefined") {
      navigator.clipboard.write([new ClipboardItem({ "image/png": toPng(webUrl) })]).catch(() => {});
    }
    // the link itself opens the post window
  };
  const [main, ...rest] = downloads;

  return (
    <div className="artx">
      <div className="artx__main">
        {main && (
          <a className="btn btn--solid artx__dl" href={`/api/art/dl/${slug}?f=${main.f}`} rel="nofollow">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M11 3h2v9.17l3.59-3.58L18 10l-6 6-6-6 1.41-1.41L11 12.17V3zM4 18h16v2H4z" />
            </svg>
            Download {main.label}
            {main.bytes ? <span className="artx__size">{fmtBytes(main.bytes)}</span> : null}
          </a>
        )}
        {rest.map((d) => (
          <a key={d.f} className="btn artx__ghost" href={`/api/art/dl/${slug}?f=${d.f}`} rel="nofollow" title={d.bytes ? fmtBytes(d.bytes) : undefined}>
            {d.label}
          </a>
        ))}
      </div>
      <div className="artx__row">
        <button type="button" className="artx__link" onClick={copyLink}>
          Copy link
        </button>
        {canCopy && (
          <button type="button" className="artx__link" onClick={copyImage}>
            Copy image
          </button>
        )}
        <a className="artx__link" href={xUrl} target="_blank" rel="noopener" onClick={postOnX}>
          {canShareFile ? "Share to X" : "Post on X"}
        </a>
      </div>
      <p className="artx__note" role="status" aria-live="polite">
        {note}
      </p>
      {!canShareFile && canCopy && <p className="artx__hint">Post on X copies the image too: press Ctrl+V (⌘V on a Mac) in your post to attach it.</p>}
    </div>
  );
}
