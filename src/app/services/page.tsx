"use client";

import React, { useState } from "react";
import { services } from "@/data";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Truck, HardHat, Settings, Shield, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const icons = [Truck, HardHat, Settings, Shield];

const steps = [
  { step: "01", title: "choose machinery", desc: "Select the equipment you need from our extensive catalog of forklifts, cranes, and excavators." },
  { step: "02", title: "inspection & prep", desc: "We perform a comprehensive multi-point safety check before any machinery leaves our depot." },
  { step: "03", title: "rapid delivery", desc: "Our transport team delivers the machinery directly to your project site anywhere in the UAE." }
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState(0);

  const { scrollY } = useScroll();
  const heroVideoY = useTransform(scrollY, [0, 800], ["0%", "30%"]);

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F2EB] font-sans pb-24 md:pb-0">
      
      {/* 1. Cinematic Dark-Mode Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <motion.div className="absolute inset-0 z-0" style={{ y: heroVideoY }}>
          <Image src="/images/Reliable Industrial Transportation Services in Saudi Arabia _ 3M International.jpeg" alt="Heavy equipment rental services in Dubai, UAE" width={1920} height={1080} priority className="w-full h-full object-cover filter brightness-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 mt-16"
        >
          <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-[#C5A059] font-orbitron mb-4">
            Our Offerings
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white uppercase tracking-tight font-orbitron drop-shadow-2xl max-w-5xl mx-auto text-balance">
            Heavy Equipment Rental <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">Services</span> in Dubai
          </h1>
          <p className="text-gray-300 text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Inspected, well-maintained excavators, forklifts, wheel shovels, cranes and trucks on flexible rental terms, deployed quickly across the UAE.
          </p>
        </motion.div>
      </section>

      {/* Dynamic Tab Switcher - Premium layout */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Tabs Menu */}
          <div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-4">
            {services.map((service, idx) => {
              const Icon = icons[idx % icons.length];
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`p-6 md:p-8 rounded-[2rem] border text-left transition-all duration-300 flex items-center gap-6 cursor-pointer group ${
                    activeTab === idx
                      ? "bg-[#111113]/90 backdrop-blur-xl border-[#C5A059]/40 shadow-[0_0_30px_rgba(197,160,89,0.15)] md:translate-x-4"
                      : "bg-[#111113]/40 backdrop-blur-md border-white/5 hover:bg-[#111113]/60 hover:border-white/10"
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    activeTab === idx ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-white/5 text-gray-500 group-hover:text-white"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={`block text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${
                      activeTab === idx ? "text-[#C5A059]" : "text-gray-600 group-hover:text-gray-400"
                    }`}>Service 0{idx + 1}</span>
                    <span className={`font-black text-lg md:text-xl uppercase tracking-wider font-orbitron transition-colors ${
                      activeTab === idx ? "text-white" : "text-gray-400 group-hover:text-white"
                    }`}>{service.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="lg:col-span-7 xl:col-span-8 relative">
            {/* Glowing background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-[#C5A059]/10 to-[#A51A1A]/10 rounded-full blur-3xl pointer-events-none opacity-50" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="relative p-8 md:p-14 rounded-[2.5rem] bg-[#111113]/80 backdrop-blur-2xl border border-white/10 shadow-2xl h-full flex flex-col justify-center"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest block mb-4 font-orbitron">service highlights</span>
                  <h3 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase font-orbitron drop-shadow-md">{services[activeTab].title}</h3>
                  <p className="text-gray-400 text-base md:text-lg font-medium leading-relaxed mb-10">{services[activeTab].desc}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-[#C5A059] stroke-[3]" />
                      </div>
                      <span className="text-sm text-gray-300 font-semibold leading-snug">Compliant with UAE Federal safety regulations</span>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-[#C5A059] stroke-[3]" />
                      </div>
                      <span className="text-sm text-gray-300 font-semibold leading-snug">Operator and rigging support available</span>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 md:col-span-2">
                      <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-[#C5A059] stroke-[3]" />
                      </div>
                      <span className="text-sm text-gray-300 font-semibold leading-snug">Mobilized directly to your site</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col sm:flex-row gap-4">
                  <Link href={`/services/${services[activeTab].slug}`} className="group flex-1 flex items-center justify-between p-6 rounded-2xl border border-white/15 text-white font-black text-sm uppercase tracking-[0.2em] hover:border-[#C5A059]/40 active:scale-[0.98] transition-all">
                    Full Details
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <Link href="/contact" className="group flex-1 flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#12131A] font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(197,160,89,0.2)] hover:shadow-[0_0_40px_rgba(197,160,89,0.4)] active:scale-[0.98] transition-all">
                    Request Quote
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Rent Process Section */}
      <section className="relative py-32 px-6 border-t border-white/5 overflow-hidden">
        {/* Background dark texture */}
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059] font-orbitron mb-3">how it works</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight font-orbitron drop-shadow-2xl">Our Deployment Process</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-8 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden lg:block absolute top-12 left-[16.66%] right-[16.66%] h-[2px] bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent" />
            
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative p-10 md:p-12 rounded-[2.5rem] bg-[#111113]/80 backdrop-blur-xl border border-white/5 hover:border-[#C5A059]/30 shadow-2xl hover:shadow-[0_0_40px_rgba(197,160,89,0.1)] transition-all duration-500 group mt-8 lg:mt-0"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#050505] border-2 border-[#C5A059] flex items-center justify-center z-10 shadow-[0_0_20px_rgba(197,160,89,0.4)] group-hover:scale-110 transition-transform">
                  <span className="text-xs font-black text-[#C5A059] font-orbitron">{step.step}</span>
                </div>
                
                <div className="text-6xl md:text-8xl font-black text-white/5 font-orbitron absolute right-6 bottom-6 pointer-events-none group-hover:text-white/10 transition-colors">{step.step}</div>
                
                <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-wider font-orbitron mt-2">{step.title}</h4>
                <p className="text-gray-400 font-medium text-base leading-relaxed relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
