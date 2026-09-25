"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "py-2 lg:py-4" : "py-4 lg:py-6"}`}>
        <div className="mx-auto px-4 lg:px-6 max-w-7xl">
          <div className={`flex items-center justify-between transition-all duration-300 rounded-full px-4 lg:px-6 py-2.5 lg:py-3.5 ${scrolled ? "bg-[#111113]/90 backdrop-blur-md shadow-2xl border border-white/10" : "bg-white/90 backdrop-blur-md border border-black/5 shadow-sm"}`}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 lg:gap-3">
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
              <span id="navbar-logo-text" className={`font-orbitron font-black text-lg lg:text-xl tracking-tight ${scrolled ? "text-white" : "text-[#111113]"}`}>TRUXO</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-widest">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${isActive ? "text-[#C5A059]" : (scrolled ? "text-gray-300 hover:text-white" : "text-[#111113] hover:text-[#C5A059]")} transition-colors relative group`}
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
            <div className="hidden lg:flex items-center gap-4">
              <button onClick={triggerPresentation} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border ${scrolled ? "border-white/20 text-white hover:bg-white/10" : "border-black/10 text-[#111113] hover:bg-black/5"}`}>
                <Play className="w-3.5 h-3.5" /> Presentation
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
              className={`lg:hidden p-2 rounded-full ${scrolled ? "text-white hover:bg-white/10" : "text-[#111113] hover:bg-black/5"}`}
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#111113] text-white pt-32 px-8 pb-8 overflow-y-auto lg:hidden"
          >
            <div className="flex flex-col gap-8 font-orbitron text-2xl font-black uppercase tracking-wide">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`${pathname === link.href ? "text-[#C5A059]" : "text-white"} hover:text-[#C5A059] transition-colors`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="w-full h-[1px] bg-white/10 my-2" />

              <button
                onClick={triggerPresentation}
                className="flex items-center gap-3 text-xl text-gray-300 hover:text-white transition-colors"
              >
                <Play className="w-5 h-5 fill-current" /> Presentation Mode
              </button>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-6 px-6 py-4 rounded-full btn-premium-gold text-center text-sm tracking-widest shadow-lg"
              >
                Request a Quote
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
