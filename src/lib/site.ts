// Single source of truth for anything SEO-related that names the site or the business.
// The live site is served from the www host (the bare domain redirects to it), so canonical URLs,
// the sitemap and social tags must all use it. Override with NEXT_PUBLIC_SITE_URL if that changes.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.truxo.ae").replace(/\/+$/, "");
export const SITE_NAME = "TRUXO";
export const BUSINESS_NAME = "TRUXO Heavy Equipment Rental";

export const BUSINESS = {
  telephone: "+971543058358",
  telephoneDisplay: "+971 54 305 8358",
  email: "admin@truxo.ae",
  locality: "Dubai",
  country: "AE",
  countryName: "United Arab Emirates",
} as const;

// 1200x630 share image used for Open Graph / Twitter cards (public/og-default.jpg).
export const DEFAULT_OG_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "TRUXO heavy equipment rental in Dubai, UAE: excavators, forklifts, wheel shovels, cranes and trucks",
};

export function absoluteUrl(path = "/"): string {
  if (path === "/" || path === "") return SITE_URL; // matches the canonical Next emits for the home page
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
