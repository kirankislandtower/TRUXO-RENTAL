"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Play, ArrowUpRight, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Pages that open on a dark full-bleed hero: the nav sits transparent over it (white text) until you scroll.
// Anything else (e.g. the 404 page) keeps the solid white pill so it never becomes unreadable.
const DARK_HERO_ROUTES = ["/", "/fleet", "/services", "/industries", "/insights", "/contact"];

export default function Navbar() {
  const pathname = usePathname();
  const overDarkHero = DARK_HERO_ROUTES.some((route) => (route === "/" ? pathname === "/" : pathname.startsWith(route)));
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const transparentTop = !scrolled && overDarkHero;
  // true whenever the nav content sits on something dark (scrolled glass pill or the hero photo)
  const onDark = scrolled || transparentTop;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/fleet", label: "Our Fleet" },
    { href: "/services", label: "Services" },
    { href: "/industries", label: "Industries" },
    { href: "/insights", label: "News & Insights" },
    { href: "/contact", label: "Contact Us" },
  ];

  const triggerPresentation = () => {
    setIsOpen(false);
    if (pathname !== "/") {
      window.location.href = "/?mode=presentation";
    } else {
      window.dispatchEvent(new CustomEvent("open-presentation"));
    }
  };

  return (
    <>
      <nav className={`fixed inset-x-0 top-0 z-[110] transition-all duration-300 ${scrolled ? "py-2 lg:py-4" : "py-4 lg:py-6"}`}>
        {/* soft top scrim so white nav text stays readable over bright parts of the hero photo */}
        <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${transparentTop ? "opacity-100" : "opacity-0"}`} />
        <div className="relative mx-auto px-4 lg:px-6 max-w-7xl">
          <div className={`flex items-center justify-between transition-all duration-300 rounded-full px-4 lg:px-6 py-2.5 lg:py-3.5 ${scrolled ? "bg-[#111113]/90 backdrop-blur-md shadow-2xl border border-white/10" : transparentTop ? "bg-transparent border border-transparent" : "bg-white/90 backdrop-blur-md border border-black/5 shadow-sm"}`}>

            {/* Logo */}
            <Link href="/" className="mr-6 flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white p-0.5 lg:p-1 overflow-hidden">
                <Image
                  src="/logo.jpeg"
                  alt="TRUXO Logo"
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const textFallback = document.getElementById('navbar-logo-text');
                    if (textFallback) {
                      textFallback.classList.remove('hidden');
                      textFallback.classList.add('block');
                    }
                  }}
                />
              </div>
              <span id="navbar-logo-text" className={`font-orbitron font-black text-lg lg:text-xl tracking-tight ${onDark ? "text-white" : "text-[#111113]"}`}>TRUXO</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden xl:flex items-center gap-6 2xl:gap-8 text-xs font-black uppercase tracking-widest">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${isActive ? "text-[#C5A059]" : (onDark ? "text-white/85 hover:text-white" : "text-[#111113] hover:text-[#C5A059]")} transition-colors relative group`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#C5A059] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="hidden xl:flex items-center gap-3">
              <button
                type="button"
                onClick={triggerPresentation}
                aria-label="Watch the company presentation"
                title="Presentation"
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${onDark ? "border-white/30 text-white hover:bg-white/10" : "border-black/10 text-[#111113] hover:bg-black/5"}`}
              >
                <Play className="h-3.5 w-3.5" />
              </button>
              <Link
                href="/contact"
                className="px-6 py-2.5 rounded-full btn-premium-gold text-xs tracking-wider"
              >
                Get a Quote
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              className={`xl:hidden rounded-full p-2 outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] ${onDark || isOpen ? "text-white hover:bg-white/10" : "text-[#111113] hover:bg-black/5"}`}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent="true"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[105] overflow-y-auto overscroll-contain bg-[#0A0A0C] text-white xl:hidden"
          >
            {/* soft gold glow, top right */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_100%_0%,rgba(197,160,89,0.18),transparent)]" />

            <div className="relative flex min-h-full flex-col px-6 pb-8 pt-28">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-white/35">Menu</p>

              <nav aria-label="Mobile">
                <ul>
                  {links.map((link, i) => {
                    const isActive = pathname === link.href;
                    return (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.06 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className="border-b border-white/10"
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className="group flex items-center gap-4 py-[1.05rem]"
                        >
                          <span className={`w-6 text-[11px] font-black tracking-widest ${isActive ? "text-[#C5A059]" : "text-white/30"}`}>0{i + 1}</span>
                          <span className={`font-orbitron text-[1.2rem] font-[650] font-stretch-expanded uppercase leading-none tracking-[0.01em] transition-colors ${isActive ? "text-[#C5A059]" : "text-white group-active:text-[#C5A059]"}`}>
                            {link.label}
                          </span>
                          <ArrowUpRight className={`ml-auto h-5 w-5 transition-colors ${isActive ? "text-[#C5A059]" : "text-white/25 group-active:text-[#C5A059]"}`} />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-auto pt-10"
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={triggerPresentation}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-colors active:bg-white/10"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Presentation
                  </button>
                  <Link
                    href="/contact"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center rounded-full bg-gradient-to-br from-[#DFBA73] to-[#C5A059] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#12131A] shadow-[0_4px_18px_rgba(197,160,89,0.3)]"
                  >
                    Get a Quote
                  </Link>
                </div>

                <div className="mt-6 flex flex-col gap-3 text-[13px] text-white/60">
                  <a href="tel:+971543058358" className="flex items-center gap-3 transition-colors active:text-white">
                    <Phone className="h-4 w-4 text-[#C5A059]" /> +971 54 305 8358
                  </a>
                  <a href="mailto:admin@truxo.ae" className="flex items-center gap-3 transition-colors active:text-white">
                    <Mail className="h-4 w-4 text-[#C5A059]" /> admin@truxo.ae
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
