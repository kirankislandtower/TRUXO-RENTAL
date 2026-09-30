import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { services } from "@/data";
import JsonLd from "@/components/seo/JsonLd";
import { BUSINESS_REF, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { BUSINESS } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

const HIGHLIGHTS = [
  "Compliant with UAE Federal safety regulations",
  "Operator and rigging support available",
  "Mobilized directly to your site",
  "Flexible daily, weekly and monthly rental terms",
];

// One static page per equipment type — each gets its own URL, title and
// content so it can rank for its own search ("excavator rental dubai") rather
// than all five competing for a single /services page.
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

function findService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) return { title: "Service Not Found", robots: { index: false, follow: true } };

  return pageMetadata({
    title: `${service.title} Rental in Dubai`,
    description: `Rent ${service.title.toLowerCase()} from TRUXO in Dubai and across the UAE. ${service.tagline} Inspected, well-maintained equipment, deployed quickly. Request a quote today.`,
    path: `/services/${service.slug}`,
    keywords: [
      `${service.title.toLowerCase()} rental dubai`,
      `hire ${service.title.toLowerCase().replace(/s$/, "")} dubai`,
      `${service.title.toLowerCase()} rental uae`,
      "heavy equipment rental dubai",
      "TRUXO",
    ],
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = findService(slug);
  if (!service) notFound();

  const faqs = [
    {
      question: `How quickly can you deliver a ${service.title.toLowerCase()} rental in Dubai?`,
      answer:
        "We aim to mobilize equipment to your site quickly once a rental is confirmed. Share your location and timeline when you request a quote and we'll confirm an exact delivery window.",
    },
    {
      question: `Do you provide an operator with the ${service.title.toLowerCase()}?`,
      answer: "Operator support is available on request. Let us know your project requirements when you request a quote and we'll arrange it.",
    },
    {
      question: "What rental terms do you offer?",
      answer: "We offer flexible daily, weekly and monthly rental terms across Dubai and the UAE, tailored to your project timeline and budget.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F2EB] font-sans pb-24 md:pb-0">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${service.title} rental in Dubai`,
          serviceType: "Heavy equipment rental",
          description: service.desc,
          areaServed: { "@type": "Country", name: BUSINESS.countryName },
          provider: BUSINESS_REF,
        }}
      />
      <JsonLd data={breadcrumbJsonLd([{ name: "Services", path: "/services" }, { name: service.title, path: `/services/${service.slug}` }])} />
      <JsonLd data={faqJsonLd(faqs)} />

      {/* Hero */}
      <section className="relative w-full border-b border-white/5 px-6 pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            <Link href="/services" className="hover:text-[#C5A059] transition-colors">Services</Link>
            <span>/</span>
            <span className="text-[#C5A059]">{service.title}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight font-orbitron text-white drop-shadow-2xl text-balance">
            {service.title} Rental in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">Dubai</span>
          </h1>
          <p className="mt-6 text-gray-300 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            {service.tagline} Available across Dubai and the UAE on flexible rental terms.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#DFBA73] to-[#C5A059] px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-[#12131A] shadow-[0_4px_18px_rgba(197,160,89,0.35)] transition-all hover:-translate-y-0.5">
              Request a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/fleet" className="w-full sm:w-auto flex items-center justify-center rounded-full border-2 border-white/25 px-8 py-[0.9375rem] text-sm font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white hover:text-[#050505]">
              Browse Our Fleet
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-20 space-y-16">
        {/* Overview */}
        <section className="bg-[#111113]/40 backdrop-blur-xl border border-white/5 p-8 md:p-10 rounded-[2rem] shadow-xl">
          <h2 className="text-xl font-black text-white uppercase font-orbitron mb-4">Overview</h2>
          <p className="text-gray-300 font-medium leading-relaxed text-sm md:text-base">{service.desc}</p>
        </section>

        {/* Use cases */}
        <section>
          <h2 className="text-sm font-black text-[#C5A059] uppercase tracking-[0.3em] font-orbitron mb-8 flex items-center gap-4">
            Common Uses
            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#C5A059]/30 to-transparent" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.useCases.map((useCase) => (
              <div key={useCase} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#C5A059] stroke-[3]" />
                </div>
                <span className="text-sm text-gray-300 font-semibold leading-snug">{useCase}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why TRUXO */}
        <section className="bg-gradient-to-br from-[#111113] to-[#0A0A0C] p-8 md:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-xl font-orbitron font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
            <ShieldCheck className="w-7 h-7 text-[#C5A059]" />
            Why Rent From TRUXO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 relative z-10">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#C5A059]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#C5A059] stroke-[3]" />
                </div>
                <span className="text-sm font-medium text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-sm font-black text-[#C5A059] uppercase tracking-[0.3em] font-orbitron mb-8 flex items-center gap-4">
            Frequently Asked Questions
            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#C5A059]/30 to-transparent" />
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-6 rounded-2xl bg-[#111113]/60 border border-white/5">
                <h3 className="text-base font-bold text-white mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Other services */}
        <section className="border-t border-white/5 pt-16">
          <h2 className="text-sm font-black text-[#C5A059] uppercase tracking-[0.3em] font-orbitron mb-8">Other Equipment We Rent</h2>
          <div className="flex flex-wrap gap-3">
            {services
              .filter((other) => other.slug !== service.slug)
              .map((other) => (
                <Link
                  key={other.slug}
                  href={`/services/${other.slug}`}
                  className="px-5 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-300 hover:border-[#C5A059]/40 hover:text-white transition-colors"
                >
                  {other.title} Rental
                </Link>
              ))}
          </div>
        </section>

        <Link href="/contact" className="group flex items-center justify-between w-full p-6 rounded-2xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#12131A] font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(197,160,89,0.2)] hover:shadow-[0_0_40px_rgba(197,160,89,0.4)] active:scale-[0.98] transition-all">
          Request {service.title} Quote
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </main>
  );
}
