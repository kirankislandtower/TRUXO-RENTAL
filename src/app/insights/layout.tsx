import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Heavy Equipment News & Insights",
  description:
    "Case studies, industry trends and best practices for heavy equipment operations across the UAE construction and industrial sectors, from the TRUXO team.",
  path: "/insights",
  keywords: ["heavy equipment news UAE", "construction industry insights Dubai", "equipment fleet management", "TRUXO news"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "News & Insights", path: "/insights" }])} />
      {children}
    </>
  );
}
