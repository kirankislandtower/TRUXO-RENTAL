"use client";

import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X } from "lucide-react";

const subscribeNoop = () => () => {};

export default function VehicleViewer({ imageSrc, title }: { imageSrc: string, title: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // false during SSR/hydration, true afterwards: the portal target (document.body) only exists in the browser.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <>
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] bg-[#111113] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/5 group">
        
        <button 
          onClick={() => setIsFullscreen(true)}
          className="absolute top-6 right-6 z-20 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:text-[#C5A059] transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        <div className="w-full h-full relative">
          <Image 
            src={imageSrc} 
            alt={title} 
            width={1920}
            height={1080}
            priority
            className="object-cover w-full h-full pointer-events-none" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent opacity-80 pointer-events-none" />
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isFullscreen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-12"
            >
              <button 
                onClick={() => setIsFullscreen(false)}
                className="absolute top-8 right-8 z-[100000] p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white transition-colors cursor-pointer pointer-events-auto"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="w-full max-w-6xl h-full relative flex items-center justify-center">
                <Image 
                  src={imageSrc} 
                  alt={title} 
                  fill
                  sizes="100vw"
                  className="object-contain" 
                />
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white font-orbitron uppercase tracking-widest text-sm">
                {title}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
