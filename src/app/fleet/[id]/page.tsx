import React, { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { parseAssetData } from "@/lib/fleetAsset";
import JsonLd from "@/components/seo/JsonLd";
import { BUSINESS_REF, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl, BUSINESS } from "@/lib/site";
import VehicleViewer from "@/components/ui/VehicleViewer";
import { MapPin, ActivitySquare, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Factory } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

import type { Metadata } from "next";

// This page uses the service-role client, so only select the columns it
// actually renders (never `*`, which would pull internal fields like client_id).
const VEHICLE_COLUMNS = "asset_id, type, model, image, location, status";

// React cache(): generateMetadata and the page below both call this, but it only hits the database once per request.
const loadVehicle = cache(async (id: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { status: "no-db" as const };
  const { data: vehicle, error } = await supabase.from("fleet").select(VEHICLE_COLUMNS).eq("asset_id", id).single();
  if (error || !vehicle) return { status: "not-found" as const };
  return { status: "ok" as const, vehicle, ...parseAssetData(vehicle) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await loadVehicle(id);
  if (result.status !== "ok") {
    return { title: "Equipment Not Found", robots: { index: false, follow: true } };
  }

  const { vehicle, brand, name, image } = result;
  const fullName = `${brand} ${name}`.trim();
  const location = vehicle.location || BUSINESS.locality;

  return pageMetadata({
    title: `${fullName} for Rent in ${BUSINESS.locality}`,
    description: `Rent the ${fullName} from TRUXO in ${location}. Inspected, serviced heavy equipment for construction and industrial projects across the UAE. Request a quote.`,
    path: `/fleet/${encodeURIComponent(id)}`,
    keywords: [`${fullName} rental`, `${brand} rental Dubai`, "heavy equipment rental Dubai", "TRUXO fleet"],
    image: { url: image, alt: `${fullName} available for rent in ${location}` },
  });
}

export default async function FleetSpecPage({ params }: Props) {
  const { id } = await params;
  const result = await loadVehicle(id);

  if (result.status === "no-db") {
    return <div>Database connection error</div>;
  }
  if (result.status === "not-found") {
    notFound();
  }

  const { vehicle, brand: parsedBrand, name: parsedName, image: imageSrc } = result;
  const fullName = `${parsedBrand} ${parsedName}`.trim();
  const location = vehicle.location || BUSINESS.locality;
  const supabase = getSupabaseAdmin();

  // Fetch 3 other random vehicles for recommendations
  const { data: recommendations } = supabase ? await supabase.from('fleet').select('asset_id, type, model, image').neq('asset_id', id).limit(3) : { data: null };

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F2EB] font-sans pb-24 md:pb-0 selection:bg-[#C5A059] selection:text-[#12131A]">
      
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${fullName} rental in ${location}`,
          serviceType: "Heavy equipment rental",
          description: `${fullName} available to rent from TRUXO in ${location} for construction, industrial and infrastructure projects across the UAE.`,
          image: imageSrc.startsWith("http") ? imageSrc : absoluteUrl(imageSrc),
          url: absoluteUrl(`/fleet/${encodeURIComponent(id)}`),
          brand: { "@type": "Brand", name: parsedBrand },
          areaServed: { "@type": "Country", name: BUSINESS.countryName },
          provider: BUSINESS_REF,
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Our Fleet", path: "/fleet" },
          { name: fullName, path: `/fleet/${encodeURIComponent(id)}` },
        ])}
      />

      {/* Immersive Hero Header */}
      <div className="relative w-full h-[40vh] md:h-[50vh] min-h-[400px]">
        <div className="absolute inset-0 z-0">
          <Image 
            src={imageSrc} 
            alt={`${fullName} heavy equipment for rent in ${location}`} 
            fill 
            sizes="100vw"
            priority
            className="object-cover filter brightness-[0.25]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-16">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase mb-8">
            <Link href="/fleet" className="text-gray-400 hover:text-[#C5A059] flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Fleet
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-[#C5A059]">{parsedBrand}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-1.5 rounded-full bg-[#111113]/80 backdrop-blur-md border border-[#C5A059]/30 text-[#C5A059] text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(197,160,89,0.2)]">
                  {parsedBrand}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white text-[10px] font-black tracking-widest uppercase">
                  ID: {vehicle.asset_id}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-orbitron font-black uppercase text-white tracking-tight drop-shadow-2xl">
                {fullName}
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 font-bold mt-2 uppercase tracking-wide">Heavy equipment rental in {location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        
        {/* 360 / Interactive Viewer */}
        <div className="mb-24 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl border border-white/5 bg-[#111113]">
          <VehicleViewer imageSrc={imageSrc} title={fullName} />
        </div>

        {/* Specifications & Sticky Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-32">

          {/* Main Specs Column */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-16">
            
            <section className="bg-[#111113]/40 backdrop-blur-xl border border-white/5 p-8 md:p-10 rounded-[2rem] shadow-xl">
              <h2 className="text-xl font-black text-white uppercase font-orbitron mb-4">Equipment Overview</h2>
              <p className="text-gray-300 font-medium leading-relaxed text-sm md:text-base">
                A versatile and robust piece of heavy machinery, engineered to deliver consistent performance, durability, and efficiency across a wide range of demanding construction and industrial applications. Designed for safety and precision, this equipment meets all modern site requirements.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-black text-[#C5A059] uppercase tracking-[0.3em] font-orbitron mb-8 flex items-center gap-4">
                Technical Data
                <div className="h-[1px] flex-grow bg-gradient-to-r from-[#C5A059]/30 to-transparent" />
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111113]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl flex flex-col gap-3 hover:bg-[#111113] transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#C5A059] mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Location</span>
                  <span className="text-3xl font-black text-white font-orbitron tracking-tight">{vehicle.location || 'Dubai'}</span>
                </div>

                <div className="bg-[#111113]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl flex flex-col gap-3 hover:bg-[#111113] transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#C5A059] mb-4 group-hover:scale-110 transition-transform">
                    <ActivitySquare className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</span>
                  <span className="text-3xl font-black text-white font-orbitron tracking-tight">{vehicle.status}</span>
                </div>

              </div>
            </section>

            <section className="bg-gradient-to-br from-[#111113] to-[#0A0A0C] p-10 md:p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h3 className="text-xl font-orbitron font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#C5A059]" />
                Equipment Certification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 relative z-10">
                {[
                  "Municipality Approved",
                  "Third-Party Inspected",
                  "Emissions Compliant",
                  "Safety Certified",
                  "Fully Insured",
                  "GPS Tracked"
                ].map((cert) => (
                  <div key={cert} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#C5A059]/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{cert}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Inquiry Form Column */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="sticky top-8 bg-[#111113]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
              
              <div>
                <h3 className="text-2xl font-orbitron font-black uppercase text-white mb-2">Request Quote</h3>
                <p className="text-xs text-gray-400">Our dispatch team will review your request and respond shortly.</p>
              </div>

              <Link 
                href="/contact"
                className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#12131A] font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Enquire Now
              </Link>
              
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Factory className="w-4 h-4 text-[#C5A059]" />
                  <span>Maintained by OEM standards</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <ActivitySquare className="w-4 h-4 text-[#C5A059]" />
                  <span>24/7 Support Available</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Similar Equipment Strip */}
        {recommendations && recommendations.length > 0 && (
          <section className="border-t border-white/5 pt-20 mb-12">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl font-orbitron font-black text-white uppercase tracking-wider">
                Explore More
              </h2>
              <Link href="/fleet" className="text-sm font-black text-[#C5A059] uppercase tracking-widest hover:text-white flex items-center gap-2 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map(rec => {
                const { brand: recBrand, name: recName, image: recImage } = parseAssetData(rec);
                
                return (
                  <Link 
                    key={rec.asset_id}
                    href={`/fleet/${rec.asset_id}`}
                    className="group relative h-[300px] rounded-3xl overflow-hidden border border-white/5 bg-[#111113] block"
                  >
                    <Image 
                      src={recImage} 
                      alt={`${recBrand} ${recName} heavy equipment for rent`} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.5] group-hover:brightness-[0.7]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-start gap-2">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
                        {recBrand}
                      </span>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">{recName}</h4>
                      <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all absolute right-8 bottom-8">
                        <ArrowRight className="w-4 h-4 text-[#12131A]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
