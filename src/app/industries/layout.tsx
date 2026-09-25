import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Industries We Serve in Dubai & the UAE",
  description:
    "TRUXO supplies heavy equipment for construction and infrastructure, manufacturing and warehousing, oil and gas, logistics and government projects across the UAE.",
  path: "/industries",
  keywords: ["construction equipment rental UAE", "warehouse forklift rental Dubai", "oil and gas equipment rental UAE", "infrastructure project machinery"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Industries", path: "/industries" }])} />
      {children}
    </>
  );
}
