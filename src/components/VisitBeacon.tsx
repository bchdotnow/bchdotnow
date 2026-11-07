"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Counts a page view. Sends the page path, whether this is the first page in this tab,
 * and on that first page the referring site's name. Nothing else.
 */
export default function VisitBeacon() {
  const path = usePathname();
  useEffect(() => {
    try {
      const n = navigator as Navigator & { globalPrivacyControl?: boolean };
      if (n.globalPrivacyControl || n.doNotTrack === "1") return;
      let isNew = false;
      try {
        isNew = !sessionStorage.getItem("bchnow:v");
        sessionStorage.setItem("bchnow:v", "1");
      } catch {
        /* storage blocked: count the view, not a visit */
      }
      let r = "";
      if (isNew && document.referrer) {
        const host = new URL(document.referrer).hostname;
        if (host !== location.hostname) r = host;
      }
      const body = JSON.stringify({ p: path, r, n: isNew ? 1 : 0 });
      if (!navigator.sendBeacon?.("/api/hit", new Blob([body], { type: "application/json" }))) {
        fetch("/api/hit", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
      }
    } catch {
      /* counting is best effort */
    }
  }, [path]);
  return null;
}
