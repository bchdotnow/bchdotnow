import { fmtDuration, type Art } from "@/lib/art-shared";

/** GIF / play badge on a thumbnail. */
export default function MediaBadge({ a }: { a: Pick<Art, "type" | "duration"> }) {
  if (a.type === "image") return null;
  return (
    <span className="mbadge" aria-hidden="true">
      {a.type === "animation" ? (
        "GIF"
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="12" height="12">
            <path fill="currentColor" d="M7 4.5v15l13-7.5z" />
          </svg>
          {fmtDuration(a.duration)}
        </>
      )}
    </span>
  );
}
