"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

export type FleetBandItem = { title: string; img: string; desc: string };

/**
 * Full-bleed photo band with one accordion card per equipment category.
 * The active card opens to show its description and a link to the fleet; the
 * background photo cross-fades to match. Cards are real <button>s (keyboard and
 * screen-reader friendly) and stack into a single column on phones.
 */
export default function FleetBand({ items }: { items: FleetBandItem[] }) {
  const [active, setActive] = useState(0);

  return (
    <section
      aria-labelledby="fleet-band-title"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden border-t border-white/5 bg-[#050505] z-[20]"
    >
      {/* Only the active photo is mounted (so the others aren't downloaded up front); it cross-fades on change. */}
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <Image src={items[active].img} alt="" fill sizes="100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-[#050505]/70" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-10 pt-32 md:gap-14 md:pb-14">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#C5A059]">Equipment Arsenal</p>
          <h2
            id="fleet-band-title"
            className="font-orbitron font-[650] font-stretch-expanded uppercase leading-[1.04] tracking-[0.005em] text-white text-[clamp(1.75rem,4.6vw,4rem)]"
          >
            The right machine for every job.
          </h2>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
            Excavators, forklifts, wheel shovels, cranes and trucks, regularly inspected and serviced, ready to deploy across the UAE.
          </p>
        </div>

        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-5">
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <div
                key={item.title}
                className={`overflow-hidden rounded-2xl bg-[#F5F2EB] text-[#111113] shadow-xl transition-shadow duration-300 ${
                  isActive ? "shadow-[0_0_0_2px_#C5A059,0_20px_40px_rgba(0,0,0,0.4)]" : ""
                } ${i === items.length - 1 && items.length % 2 === 1 ? "md:col-span-2 xl:col-span-1" : ""}`}
              >
                <button
                  type="button"
                  id={`fleet-tab-${i}`}
                  aria-expanded={isActive}
                  aria-controls={`fleet-panel-${i}`}
                  onClick={() => setActive(i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-[10px] font-black tracking-widest text-[#A8813A]">0{i + 1}</span>
                    <span className="font-orbitron text-sm font-extrabold uppercase leading-tight md:text-base">{item.title}</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isActive ? "rotate-180 text-[#A8813A]" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      id={`fleet-panel-${i}`}
                      role="region"
                      aria-labelledby={`fleet-tab-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <p className="text-sm leading-relaxed text-[#111113]/80">{item.desc}</p>
                        <Link
                          href="/fleet"
                          className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#111113] transition-colors hover:text-[#A8813A]"
                        >
                          View inventory <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
