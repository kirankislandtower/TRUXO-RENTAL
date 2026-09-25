"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { MapPin, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { parseAssetData, type AssetSource } from "@/lib/fleetAsset";

// A row from /api/fleet (public columns only).
type FleetRow = AssetSource & { asset_id: string; location?: string | null };

type ParsedAsset = {
  id: string;
  brand: string;
  name: string;
  image: string;
  location: string;
};

export default function FleetPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [fleetData, setFleetData] = useState<ParsedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { scrollY } = useScroll();
  const heroVideoY = useTransform(scrollY, [0, 800], ["0%", "30%"]);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await fetch('/api/fleet');
        const data = await res.json();
        if (res.ok && data.fleet) {
          const parsed: ParsedAsset[] = (data.fleet as FleetRow[]).map((item) => {
            const { brand, name, image } = parseAssetData(item);
            return {
              id: item.asset_id,
              brand,
              name,
              image,
              location: item.location || "Dubai"
            };
          });
          setFleetData(parsed);
        }
      } catch (err) {
        console.error("Failed to fetch fleet data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFleet();
  }, []);

  const categories = useMemo(() => {
    const brands = new Set(fleetData.map(f => f.brand.toUpperCase()));
    return ["ALL", ...Array.from(brands)];
  }, [fleetData]);

  const filteredInventory = selectedCategory === "ALL"
    ? fleetData
    : fleetData.filter(item => item.brand.toUpperCase() === selectedCategory);

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F2EB] relative pb-24 md:pb-0">
      
      {/* Cinematic Dark-Mode Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <motion.div className="absolute inset-0 z-0" style={{ y: heroVideoY }}>
          <Image src="/images/hero_loader.jpg" alt="Fleet Inventory" width={1920} height={1080} priority className="w-full h-full object-cover filter brightness-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 mt-16"
        >
          <h1 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-[#C5A059] font-orbitron mb-4">
            Our Equipment
          </h1>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-white uppercase tracking-tight font-orbitron drop-shadow-2xl">
            The Truxo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">Fleet.</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Explore our ready-to-deploy, certified fleet of heavy machinery and material handling equipment.
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="w-full flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#C5A059]" />
          </div>
        ) : (
          <>
            {/* Filter Categories Tabs */}
            <div className="flex overflow-x-auto snap-x snap-mandatory lg:flex-wrap gap-3 pb-4 mb-12 scrollbar-hide w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 snap-start px-6 py-2.5 rounded-full text-sm font-bold border transition-all duration-200 uppercase tracking-wider cursor-pointer active:scale-95 ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#12131A] border-transparent shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                      : "bg-[#111113]/80 backdrop-blur-md text-gray-400 border-white/5 hover:text-white hover:border-white/20 hover:bg-[#1A1C23]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Fleet Grid */}
            <motion.div 
              layout 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredInventory.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={item.id}
                    className="group rounded-[2rem] bg-[#111113]/80 backdrop-blur-xl border border-white/5 shadow-xl hover:shadow-[0_0_30px_rgba(197,160,89,0.15)] hover:border-[#C5A059]/30 hover:-translate-y-1 active:scale-95 transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    {/* Visual Header with Edge-to-Edge Image */}
                    <div className="relative h-56 w-full overflow-hidden">
                      {/* Plain <img> on purpose: admins can paste any URL or path, and next/image throws (and would break this whole page) for hosts it isn't configured for. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 filter brightness-[0.7] group-hover:brightness-100" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/20 to-transparent" />
                      
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#111113]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#C5A059]">
                        <Info className="w-4 h-4" />
                      </div>
                      
                      <div className="absolute bottom-4 left-6 pr-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1 font-orbitron">{item.brand}</span>
                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase font-orbitron drop-shadow-md leading-none">{item.name}</h3>
                      </div>
                    </div>

                    {/* Specs Section - Cleaned up to just Location */}
                    <div className="p-6 space-y-4 font-semibold text-gray-300">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-[#C5A059]" />
                        <span className="capitalize">{item.location}</span>
                      </div>
                    </div>
                    
                    {/* Card CTA */}
                    <div className="p-6 pt-0 mt-auto">
                      <Link href={`/fleet/${item.id}`} className="block text-center w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-[#12131A] hover:border-[#C5A059] transition-all duration-300">
                        view specifications
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </main>
  );
}
