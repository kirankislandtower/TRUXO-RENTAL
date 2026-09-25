"use client";

import React from "react";
import { industries } from "@/data";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Building, Construction, Factory, Landmark, ArrowDown } from "lucide-react";
import Image from "next/image";

const icons = [Construction, Factory, Shield, Landmark, Building];

// Hardcoding some images for the industries based on the array length
const industryImages = [
  "/images/Civil Construction Services By AVID Energy Canada.jpeg",
  "/images/Trucks.jpeg",
  "/images/heavy_crane.jpg",
  "/images/Forklift.webp",
  "/images/Revealing The Profitability Of Used Wheel Excavators.jpeg"
];

export default function IndustriesPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 800], ["0%", "30%"]);
  const arrowOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F2EB] font-sans pb-24 md:pb-0">
      
      {/* 1. Cinematic Dark-Mode Hero */}
      <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b-4 border-[#C5A059]">
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <Image src="/images/heavy_crane.jpg" alt="Heavy crane lifting on a UAE infrastructure project" width={1920} height={1080} priority className="w-full h-full object-cover filter brightness-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 mt-16"
        >
          <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-[#C5A059] font-orbitron mb-4">
            Sectors We Support
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white uppercase tracking-tight font-orbitron drop-shadow-2xl max-w-4xl mx-auto text-balance">
            Industries We <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">Serve</span> in the UAE
          </h1>
          <p className="text-gray-300 text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed mb-12">
            Heavy equipment rental for construction and infrastructure, manufacturing and warehousing, oil and gas, logistics and government projects of every scale across the UAE.
          </p>

          <motion.div 
            style={{ opacity: arrowOpacity }}
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto text-white/50"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Immersive Parallax Gallery Layout */}
      <section className="relative">
        {industries.map((ind, i) => {
          const Icon = icons[i % icons.length];
          const img = industryImages[i % industryImages.length];
          
          return (
            <div key={ind.title} className="relative w-full h-screen min-h-[600px] flex items-center sticky top-0 overflow-hidden">
              
              {/* Background Parallax Image */}
              <div className="absolute inset-0 z-0">
                <Image src={img} alt={ind.title} fill className="object-cover filter brightness-[0.3] contrast-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />
              </div>

              {/* Content Card */}
              <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-20%" }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl bg-[#111113]/80 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group"
                >
                  {/* Subtle hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/0 to-[#C5A059]/0 group-hover:from-[#C5A059]/5 transition-colors duration-500 pointer-events-none" />
                  
                  <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#DFBA73] to-[#C5A059] flex items-center justify-center text-[#12131A] shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest font-orbitron block mb-1">Sector 0{i + 1}</span>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight font-orbitron">{ind.title}</h2>
                    </div>
                  </div>

                  <p className="text-gray-300 leading-relaxed text-base md:text-lg font-medium mb-10 relative z-10">{ind.desc}</p>

                  {/* Bullet points */}
                  <div className="border-t border-white/10 pt-8 relative z-10">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-4 font-orbitron">Supported Deployments</span>
                    <div className="space-y-4">
                      <motion.div whileHover={{ scale: 1.02, x: 10 }} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-2xl border border-white/5 cursor-default">
                        <span className="w-2 h-2 rounded-full bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.8)]" />
                        <span className="text-sm font-bold text-white">Heavy Earthmoving Machinery</span>
                      </motion.div>
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.8)]" />
                        <span className="text-sm font-bold text-white">Lifting & Rigging Equipment</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Footer spacer since the last sticky item needs room to be scrolled past */}
      <div className="h-[20vh] bg-[#050505] relative z-10 flex items-center justify-center border-t-2 border-[#C5A059]/20">
        <h3 className="text-sm md:text-base font-black uppercase tracking-[0.4em] text-gray-500 font-orbitron">
          End of Sectors
        </h3>
      </div>
    </main>
  );
}
