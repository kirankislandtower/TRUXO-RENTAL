import type { Metadata } from "next";
import { Inter, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import JsonLd from "@/components/seo/JsonLd";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { siteJsonLd } from "@/lib/seo";

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

const DEFAULT_DESCRIPTION =
  "Rent excavators, forklifts, wheel shovels, cranes and trucks across Dubai and the UAE. Inspected, serviced equipment on flexible terms. Get a quote today.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Heavy Equipment Rental Dubai & UAE | TRUXO",
    template: "%s | TRUXO",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "heavy equipment rental Dubai",
    "excavator rental Dubai",
    "forklift rental UAE",
    "crane rental Dubai",
    "wheel loader rental UAE",
    "construction equipment rental UAE",
    "TRUXO",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Each route sets its own canonical; this one is the home page's.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_AE",
    title: "Heavy Equipment Rental Dubai & UAE | TRUXO",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Heavy Equipment Rental Dubai & UAE | TRUXO",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
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
        {/* Site-wide structured data: Organization + LocalBusiness (with what it rents) + WebSite */}
        <JsonLd data={siteJsonLd()} />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
