import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { services } from "@/data";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Heavy Equipment Rental Services in Dubai",
  description:
    "Excavators, forklifts, wheel shovels, cranes and trucks on flexible rental terms, regularly inspected and serviced, and deployed quickly across Dubai and the UAE.",
  path: "/services",
  keywords: ["heavy equipment rental services Dubai", "excavator rental", "forklift rental UAE", "crane rental Dubai", "construction equipment leasing UAE"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Services", path: "/services" }])} />
      <JsonLd data={itemListJsonLd("TRUXO equipment rental services", services.map((service) => ({ name: `${service.title} rental`, path: `/services/${service.slug}` })))} />
      {children}
    </>
  );
}
