import type { Metadata } from "next";
import { BUSINESS, BUSINESS_NAME, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { services } from "@/data";

type ImageDescriptor = { url: string; width?: number; height?: number; alt?: string };

const MAX_DESCRIPTION = 160;

/** Search results cut descriptions off at ~160 characters; trim on a word boundary so it never ends mid-word. */
export function fitDescription(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 0) || cut.length).replace(/[\s.,;:-]+$/, "")}…`;
}

/**
 * Metadata for a route. Next.js shallowly REPLACES parent metadata keys (a child's `openGraph` wipes the
 * parent's), so every route builds its complete Open Graph / Twitter / canonical set through this helper.
 *
 * The document <title> is built here too, as "<title> | TRUXO", rather than left to the root layout's
 * `title.template`: Next only chains a template into the *next* route segment down (layout -> its own
 * page), not through a second nested layout (e.g. root -> services/layout.tsx -> services/[slug]/page.tsx).
 * Past that depth the template silently stops applying and the raw title ships with no suffix — which is
 * what was happening on every /fleet/[id] and /insights/[slug] page before this was made explicit here.
 */
export function pageMetadata(opts: {
  title: string; // shown as "<title> | TRUXO" in the browser tab and search results
  description: string;
  path: string; // e.g. "/fleet"
  keywords?: string[];
  image?: ImageDescriptor;
  type?: "website" | "article";
  publishedTime?: string;
}): Metadata {
  const image = opts.image ?? DEFAULT_OG_IMAGE;
  const socialTitle = `${opts.title} | ${SITE_NAME}`;
  const description = fitDescription(opts.description);
  return {
    // `absolute` ships this exact string and skips any ancestor `title.template` (including the root
    // layout's own "%s | TRUXO"), so routes at every nesting depth get the suffix exactly once.
    title: { absolute: socialTitle },
    description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path },
    openGraph: {
      type: opts.type ?? "website",
      url: opts.path,
      siteName: SITE_NAME,
      locale: "en_AE",
      title: socialTitle,
      description,
      images: [image],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [image.url] },
  };
}

const ORG_ID = `${SITE_URL}/#organization`;
const BUSINESS_ID = `${SITE_URL}/#localbusiness`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Site-wide structured data: who the business is, where it works, and what it rents. */
export function siteJsonLd() {
  const logo = absoluteUrl("/logo.jpeg");
  const areaServed = { "@type": "Country", name: BUSINESS.countryName };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: BUSINESS_NAME,
        alternateName: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: logo, width: 1600, height: 1600 },
        email: BUSINESS.email,
        telephone: BUSINESS.telephone,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: BUSINESS.telephone,
            email: BUSINESS.email,
            areaServed: BUSINESS.country,
            availableLanguage: ["English"],
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": BUSINESS_ID,
        name: BUSINESS_NAME,
        url: SITE_URL,
        image: logo,
        telephone: BUSINESS.telephone,
        email: BUSINESS.email,
        description:
          "Heavy equipment rental in Dubai and across the UAE: excavators, forklifts, wheel shovels, cranes and trucks for construction, industrial and infrastructure projects.",
        address: { "@type": "PostalAddress", addressLocality: BUSINESS.locality, addressCountry: BUSINESS.country },
        areaServed,
        parentOrganization: { "@id": ORG_ID },
        makesOffer: services.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: `${service.title} rental`,
            description: service.desc,
            serviceType: "Heavy equipment rental",
            areaServed,
            provider: { "@id": BUSINESS_ID },
          },
        })),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "en-AE",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

/** BreadcrumbList for an inner page. `items` are ordered from the first level below Home. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** A simple ItemList (used for the fleet and services listings). */
export function itemListJsonLd(name: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

/** FAQPage structured data — also earns the expandable-question rich result in Google. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export const ORG_REF = { "@id": ORG_ID };
export const BUSINESS_REF = { "@id": BUSINESS_ID };
