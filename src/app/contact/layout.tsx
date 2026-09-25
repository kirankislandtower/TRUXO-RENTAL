import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, ORG_REF, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Request a Heavy Equipment Rental Quote in Dubai",
  description:
    "Rent excavators, forklifts, cranes and more in Dubai and across the UAE. Call +971 54 305 8358 or send a dispatch request for rates and mobilization.",
  path: "/contact",
  keywords: ["contact TRUXO Dubai", "heavy equipment rental quote", "rent machinery Dubai", "TRUXO phone number UAE"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Contact", path: "/contact" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: absoluteUrl("/contact"),
          name: "Contact TRUXO",
          about: ORG_REF,
        }}
      />
      {children}
    </>
  );
}
