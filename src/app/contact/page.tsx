"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Clock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    equipmentRequired: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");
    
    try {
      const { error } = await supabase
        .from('contact_requests')
        .insert([
          { 
            first_name: formData.firstName, 
            last_name: formData.lastName, 
            email: formData.email, 
            equipment_required: `[Phone: ${formData.phone}] [Address: ${formData.address}]\n\n${formData.equipmentRequired}` 
          }
        ]);
        
      if (error) throw error;
      setFormStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        equipmentRequired: ""
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F2EB] font-sans pb-24 md:pb-0">
      
      {/* 1. Cinematic Dark-Mode Hero */}
      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b-4 border-[#C5A059]">
        <div className="absolute inset-0 z-0">
          <Image src="/images/company_excavator.jpg" alt="TRUXO excavator working on a construction site at dusk" width={1920} height={1080} priority className="w-full h-full object-cover filter brightness-[0.25]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 mt-16"
        >
          <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-[#C5A059] font-orbitron mb-4">
            Get In Touch
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white uppercase tracking-tight font-orbitron drop-shadow-2xl max-w-5xl mx-auto text-balance">
            Request a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">Heavy Equipment</span> Quote
          </h1>
          <p className="text-gray-300 text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Rent excavators, forklifts, cranes and more across Dubai and the UAE. Call, message or send a dispatch request for mobilization schedules and rates.
          </p>
        </motion.div>
      </section>

      {/* Main Content Layout */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 xl:gap-8">
          
          {/* 3. Interactive Contact Nodes (Mobile Optimized: First on small screens) */}
          <div className="xl:col-span-5 order-1 xl:order-none space-y-6">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase font-orbitron mb-8 flex items-center gap-4">
              <span className="w-8 h-[2px] bg-[#C5A059]" /> Direct Lines
            </h3>

            {/* Phone Node */}
            <motion.a 
              href="tel:+971543058358"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 md:p-8 rounded-3xl bg-[#111113]/80 backdrop-blur-md border border-white/5 hover:border-[#C5A059]/40 shadow-xl transition-colors group cursor-pointer"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#A51A1A] to-[#800020] flex items-center justify-center text-white shrink-0 group-hover:shadow-[0_0_20px_rgba(165,26,26,0.5)] transition-shadow">
                  <Phone className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Call Us (24/7)</p>
                  <p className="text-xl md:text-2xl font-black text-white font-orbitron mb-2">+971 54 305 8358</p>
                  <p className="text-gray-400 text-xs font-bold"></p>
                </div>
              </div>
            </motion.a>

            {/* Email Node */}
            <motion.a 
              href="mailto:admin@truxo.ae"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 md:p-8 rounded-3xl bg-[#111113]/80 backdrop-blur-md border border-white/5 hover:border-[#C5A059]/40 shadow-xl transition-colors group cursor-pointer"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1A1C23] flex items-center justify-center text-[#C5A059] shrink-0 border border-white/10 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-shadow">
                  <Mail className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Email Us</p>
                  <p className="text-lg md:text-xl font-black text-white font-orbitron truncate block">admin@truxo.ae</p>
                  <p className="text-gray-400 text-xs font-bold mt-2 flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" /> Quick response guaranteed
                  </p>
                </div>
              </div>
            </motion.a>

            {/* Location Node */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="block p-6 md:p-8 rounded-3xl bg-[#111113]/80 backdrop-blur-md border border-white/5 hover:border-[#C5A059]/40 shadow-xl transition-colors group"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1A1C23] flex items-center justify-center text-[#C5A059] shrink-0 border border-white/10 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-shadow">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Headquarters</p>
                  <p className="text-sm md:text-lg font-black text-white font-orbitron leading-snug mb-2">Dubai</p>
                  <p className="text-gray-400 text-xs font-bold">United Arab Emirates</p>
                </div>
              </div>
            </motion.div>
            
          </div>

          {/* 2. Glassmorphism Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="xl:col-span-7 order-2 xl:order-none relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-[#C5A059]/20 to-[#A51A1A]/20 rounded-[2.5rem] blur-xl opacity-50" />
            <div className="relative bg-[#111113]/90 backdrop-blur-2xl p-6 md:p-12 rounded-[2rem] border border-white/10 shadow-2xl">
              
              <div className="mb-10 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide font-orbitron mb-2">Send Dispatch Request</h3>
                  <p className="text-xs md:text-sm text-gray-400 font-medium">Fill out the form below and our logistics team will contact you shortly.</p>
                </div>
                <Clock className="w-10 h-10 text-gray-700 hidden md:block" />
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">First Name</label>
                    <input required disabled={formStatus === "loading" || formStatus === "success"} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} type="text" placeholder="John" className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-5 py-4 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] focus:bg-[#050505] transition-all placeholder:text-gray-700 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Last Name</label>
                    <input required disabled={formStatus === "loading" || formStatus === "success"} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} type="text" placeholder="Doe" className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-5 py-4 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] focus:bg-[#050505] transition-all placeholder:text-gray-700 disabled:opacity-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                  <input required disabled={formStatus === "loading" || formStatus === "success"} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="john@construction.com" className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-5 py-4 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] focus:bg-[#050505] transition-all placeholder:text-gray-700 disabled:opacity-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Phone (WhatsApp)</label>
                    <input required disabled={formStatus === "loading" || formStatus === "success"} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="tel" placeholder="+971 50 123 4567" className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-5 py-4 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] focus:bg-[#050505] transition-all placeholder:text-gray-700 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Address / Site Location</label>
                    <input required disabled={formStatus === "loading" || formStatus === "success"} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" placeholder="Dubai Industrial City..." className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-5 py-4 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] focus:bg-[#050505] transition-all placeholder:text-gray-700 disabled:opacity-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Equipment Required & Timeline</label>
                  <textarea required disabled={formStatus === "loading" || formStatus === "success"} value={formData.equipmentRequired} onChange={e => setFormData({...formData, equipmentRequired: e.target.value})} rows={5} placeholder="e.g. Need 2x 20-ton Excavators for 3 months starting next week..." className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-5 py-4 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:border-[#C5A059] focus:bg-[#050505] transition-all placeholder:text-gray-700 resize-none disabled:opacity-50" />
                </div>
                
                <AnimatePresence mode="wait">
                  {formStatus === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full py-5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Request Has Been Sent
                    </motion.div>
                  ) : formStatus === "error" ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full flex flex-col gap-3"
                    >
                      <div className="w-full py-5 rounded-xl bg-[#A51A1A]/20 border border-[#A51A1A]/50 text-[#A51A1A] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                        <AlertCircle className="w-5 h-5" /> Submission Failed
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormStatus("idle")}
                        className="text-xs text-gray-400 hover:text-white uppercase tracking-widest font-bold underline"
                      >
                        Try Again
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      disabled={formStatus === "loading"}
                      type="submit" 
                      className="w-full mt-4 py-5 rounded-xl bg-gradient-to-r from-[#DFBA73] to-[#C5A059] text-[#12131A] font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:shadow-[0_0_40px_rgba(197,160,89,0.5)] transition-all flex items-center justify-center disabled:opacity-70"
                    >
                      {formStatus === "loading" ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending Request...</> : "Submit Request"}
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 4. Interactive Google Map Embed */}
      <section className="w-full h-[500px] border-t-4 border-white/5 relative bg-[#111113]">
        <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(5,5,5,1)]" />
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115160.70295171732!2d55.8576449106095!3d25.328328153075514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ef5e1f0e4b7b3b3%3A0x6b6c0e8623b3b42!2sAl%20Ghail%20-%20Ras%20al%20Khaimah%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sus!4v1704123456789!5m2!1sen!2sus" 
          className="w-full h-full filter invert-[90%] hue-rotate-[180deg] contrast-[85%] grayscale-[20%]" 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-[#111113]/90 backdrop-blur-md border border-white/10 px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <MapPin className="w-4 h-4 text-[#C5A059]" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">Al Ghail Industrial Area</span>
        </div>
      </section>

    </main>
  );
}
