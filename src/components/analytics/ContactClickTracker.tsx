"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/** Maps a link's href to the GA4 event it should report, or null to ignore it. */
function eventForHref(href: string): string | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:")) return "click_call";
  if (h.startsWith("mailto:")) return "click_email";
  if (h.startsWith("https://wa.me/") || h.startsWith("https://api.whatsapp.com/") || h.startsWith("whatsapp:")) {
    return "click_whatsapp";
  }
  return null;
}

/**
 * One document-level click listener that reports every phone, WhatsApp and
 * email link to Google Analytics. Doing it here (instead of an onClick on each
 * link) means new links are counted automatically and server components like
 * the footer don't have to become client components.
 *
 * Mounted only in the public layout, so admin-side helper links (WhatsApp /
 * Gmail shortcuts for staff) are never counted as customer contact.
 *
 * Where on the page a link lives is read from the nearest ancestor with a
 * `data-track-location` attribute (navbar menu, footer, floating buttons…).
 */
export default function ContactClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      const event = eventForHref(href);
      if (!event) return;

      const location = anchor.closest("[data-track-location]")?.getAttribute("data-track-location") ?? "other";
      trackEvent(event, { link_location: location, link_url: href });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
