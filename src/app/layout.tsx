import type { Metadata } from "next";
import { Inter, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-outfit",
  preload: false
});

// Display font for every heading and label. Archivo is a variable font with a width axis, so
// headings can run "expanded" (wide, like heavy-machinery signage) while small labels stay tighter.
// The CSS variable / Tailwind utility keep their old name, `font-orbitron`, so existing classes keep working.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-orbitron",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false
});

export const metadata: Metadata = {
  metadataBase: new URL("https://truxo.ae"),
  title: {
    template: "%s | TRUXO Heavy Equipment Rental Dubai",
    default: "TRUXO Dubai | Heavy Equipment Rental UAE"
  },
  description: "TRUXO provides reliable heavy equipment rental solutions in Dubai and across the UAE. Excavators, forklifts, loaders, and construction machinery.",
  keywords: [
    "TRUXO", 
    "TRUXO Dubai", 
    "heavy equipment rental Dubai", 
    "construction machinery UAE", 
    "excavator rental Dubai", 
    "forklift rental UAE", 
    "TRUXO equipment rental", 
    "industrial equipment rental"
  ],
  openGraph: {
    title: "TRUXO Dubai | Heavy Equipment Rental",
    description: "TRUXO provides reliable heavy equipment rental solutions in Dubai and across the UAE. Excavators, forklifts, loaders, and construction machinery.",
    url: "https://truxo.ae",
    siteName: "TRUXO",
    images: [{ url: "/logo.jpeg", width: 800, height: 600, alt: "TRUXO Logo" }],
    locale: "en_AE",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} font-sans bg-[#F5F2EB] text-[#111113] antialiased pb-24 md:pb-0`}>
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-6GF5KLJ8B1" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6GF5KLJ8B1');
          `}
        </Script>
        {/* Google Structured Data for Zero-Click & Rich Snnippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "TRUXO Heavy Equipment Rental",
              "image": "https://truxo.ae/logo.jpeg",
              "@id": "https://truxo.ae",
              "url": "https://truxo.ae",
              "telephone": "+971 54 305 8358",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dubai",
                "addressCountry": "AE"
              },
              "description": "Reliable Heavy Equipment Solutions for Construction, Industrial and Infrastructure Projects across the UAE."
            })
          }}
        />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
