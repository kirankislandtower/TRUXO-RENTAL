import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Heavy Equipment Fleet for Rent in Dubai",
  description:
    "Browse TRUXO's rental fleet of excavators, wheel shovels, forklifts, cranes and trucks in Dubai and across the UAE. View each machine and request a quote.",
  path: "/fleet",
  keywords: ["heavy equipment fleet Dubai", "excavator rental Dubai", "forklift rental UAE", "wheel shovel rental", "crane rental Dubai", "truck rental UAE"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Our Fleet", path: "/fleet" }])} />
      {children}
    </>
  );
}
