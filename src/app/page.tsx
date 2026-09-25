"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useSpring, animate } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Layers,
  Shield,
  Settings,
  Wrench,
  Phone,
  Mail,
  Globe,
  MapPin,
  Maximize2,
  X
} from "lucide-react";
import Link from "next/link";
import { companyProfile } from "@/data";
import { ProductivityChart, OperationTrendsChart } from "@/components/ui/Charts";

export default function Home() {
  const [viewMode, setViewMode] = useState<"website" | "presentation">("website");
  const isIntroComplete = useRef(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroVideo] = useState("TRUXOEQ1_v2.mp4"); // Permanent default

  // Scroll Scrubbing Logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollVideoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress: trackProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(trackProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Scroll-Scrubbing Logic
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (isIntroComplete.current && viewMode === "website" && scrollVideoRef.current && scrollVideoRef.current.readyState >= 2) {
      const duration = scrollVideoRef.current.duration;
      if (!isNaN(duration) && duration > 0) {
        scrollVideoRef.current.currentTime = duration * latest;
      }
    }
  });

  // Prime the video for iOS/Safari scrubbing
  useEffect(() => {
    if (viewMode === "website" && scrollVideoRef.current) {
      scrollVideoRef.current.play().then(() => {
        if (scrollVideoRef.current) scrollVideoRef.current.pause();
      }).catch(() => { });
    }
  }, [viewMode, heroVideo]);

  // Intro Scrub Animation (Mid to Start)
  useEffect(() => {
    const video = scrollVideoRef.current;
    if (!video) return;

    const startIntro = () => {
      if (isIntroComplete.current) return;

      const duration = video.duration;
      if (!isNaN(duration) && duration > 0) {
        video.currentTime = duration * 0.5; // Start at 50%

        setTimeout(() => {
          animate(duration * 0.5, 0, {
            duration: 3.0,
            ease: "easeOut",
            onUpdate: (latest) => {
              if (scrollVideoRef.current) scrollVideoRef.current.currentTime = latest;
            },
            onComplete: () => {
              isIntroComplete.current = true;
            }
          });
        }, 1800);
      }
    };

    if (video.readyState >= 1) {
      startIntro();
    } else {
      video.addEventListener("loadedmetadata", startIntro);
      return () => video.removeEventListener("loadedmetadata", startIntro);
    }
  }, []);

  const heroTextOpacity = useTransform(trackProgress, [0, 0.2], [1, 0]);
  const heroTextY = useTransform(trackProgress, [0, 0.2], [0, 50]);

  const totalSlides = 12;

  // Presentation Mode Triggers & Keyboard Nav
  useEffect(() => {
    // Check if we should auto-launch presentation mode from query param
    if (typeof window !== "undefined") {
      if (window.location.search.includes("mode=presentation")) {
        setTimeout(() => {
          setViewMode("presentation");
          setCurrentSlide(0);
          window.history.replaceState({}, "", "/");
        }, 0);
      }
    }

    // Custom Event Listener
    const handleOpenPresentation = () => {
      setViewMode("presentation");
      setCurrentSlide(0);
    };
    window.addEventListener("open-presentation", handleOpenPresentation);

    // Keyboard Navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "presentation") return;
      if (e.key === " ") e.preventDefault(); // don't also scroll the page underneath
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-presentation", handleOpenPresentation);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewMode]);
  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  // Specs for Slide 5 Columns
  const columnsData = [
    {
      title: "Excavators",
      img: "/images/excavator_digging.jpg",
      desc: "Our excavators are designed for heavy-duty earthmoving and construction applications. They are ideal for excavation, trenching, foundation work, demolition, site preparation, and material handling.",
    },
    {
      title: "Forklifts",
      img: "/images/Forklift.webp",
      desc: "Our forklifts are designed for efficient material handling, loading, unloading, stacking, and transportation of goods in warehouses, factories, logistics centers, and construction sites.",
    },
    {
      title: "Wheel Shovels",
      img: "/images/Revealing The Profitability Of Used Wheel Excavators.jpeg",
      desc: "Our wheel shovels (front-end loaders) are built for efficient loading, transporting, and stockpiling of materials such as sand, gravel, soil, and aggregates.",
    },
    {
      title: "Cranes",
      img: "/images/heavy_crane.jpg",
      desc: "We provide a comprehensive fleet of cranes ranging from 5-ton to 100-ton lifting capacity, including mobile cranes for versatile lifting operations.",
    },
    {
      title: "Trucks",
      img: "/images/_.jpeg",
      desc: "Our trucks provide reliable and efficient transportation solutions for construction, industrial, and logistics operations. Built for durability and high performance.",
    }
  ];

  const slideTransitions = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.5, ease: "easeInOut" }
  };

  return (
    <main className="min-h-screen bg-[#F5F2EB] text-[#111113] pt-24">


      {viewMode === "presentation" ? (
        /* ========================================================================= */
        /* PRESENTATION MODE (Full-screen Slider)                                     */
        /* ========================================================================= */
        <div className="relative h-[82vh] max-w-7xl mx-auto px-6 flex items-center justify-center">
          {/* Main Slide Card Container */}
          <div className="w-full h-full max-h-[700px] bg-[#111113]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_0_50px_rgba(197,160,89,0.15)] overflow-hidden relative flex flex-col justify-between">

            {/* Header Area of the Slides */}
            <div className="p-6 border-b border-white/10 bg-[#1A1A1D]/80 flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Image src="/logo.jpeg" alt="TRUXO Logo" width={32} height={32} className="h-8 w-8 object-contain rounded-full border border-[#C5A059]" />
                <span className="font-orbitron font-black text-lg tracking-tighter text-white">TRUXO RENTAL</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block px-4 py-1.5 rounded-full border border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059] font-orbitron font-bold text-xs uppercase tracking-wider">
                  Slide {currentSlide + 1} of {totalSlides}
                </div>
                <button
                  onClick={() => setViewMode("website")}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-[#C5A059] hover:text-black hover:border-[#C5A059] transition-colors shadow-sm"
                  title="Exit Presentation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slide Body */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-transparent">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={slideTransitions}
                  className="w-full h-full p-8 md:p-12 flex flex-col justify-center"
                >
                  {/* SLIDE 1: Hero */}
                  {currentSlide === 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="space-y-6">
                        <div className="relative p-6 rounded-2xl bg-[#C5A059]/10 border-l-4 border-[#C5A059]">
                          <h1 className="text-3xl md:text-4xl font-black font-orbitron tracking-wide text-white uppercase leading-tight">
                            TRUXO HEAVY <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">EQUIPMENT RENTAL</span>
                          </h1>
                        </div>
                        <p className="text-base font-bold text-gray-300 lowercase leading-relaxed">
                          Reliable Heavy Equipment Solutions for Construction, Industrial and Infrastructure Projects
                        </p>
                        <button className="px-6 py-3 rounded-full bg-transparent border border-white/20 text-white hover:border-[#C5A059] hover:text-[#C5A059] transition-colors font-orbitron text-xs font-bold uppercase tracking-widest">
                          United Arab Emirates
                        </button>
                      </div>
                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <video
                          key={heroVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className="w-full h-full object-cover filter brightness-[0.95]"
                        >
                          <source src={`/${heroVideo}`} type="video/mp4" />
                        </video>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 2: Company Profile */}
                  {currentSlide === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="p-8 rounded-3xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white space-y-6 shadow-2xl">
                        <h2 className="text-3xl font-black font-orbitron uppercase text-[#C5A059]">COMPANY PROFILE</h2>
                        <p className="font-medium text-sm leading-relaxed lowercase text-gray-300">
                          {companyProfile.about}
                        </p>
                        <ul className="space-y-3 font-bold text-sm text-white">
                          {companyProfile.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-[#C5A059] shadow-[0_0_10px_#C5A059]" />
                              <span className="lowercase">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image src="/images/company_excavator.jpg" alt="Excavator stormy sky" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.7]" />
                      </div>
                    </div>
                  )}

                  {/* SLIDE 3: Mission & Vision */}
                  {currentSlide === 2 && (
                    <div className="flex flex-col gap-6 justify-between h-full">
                      <div className="h-[180px] w-full rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
                        <Image src="/images/forklift_warehouse.jpg" alt="Warehouse forklift" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.5]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                          <h2 className="text-4xl font-black font-orbitron text-white tracking-widest uppercase">MISSION & VISION</h2>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl transition-transform hover:-translate-y-2">
                          <h3 className="text-lg font-black font-orbitron text-[#C5A059] uppercase mb-3">OUR VISION</h3>
                          <p className="text-sm font-medium text-gray-300 leading-relaxed lowercase">{companyProfile.vision}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl transition-transform hover:-translate-y-2">
                          <h3 className="text-lg font-black font-orbitron text-[#C5A059] uppercase mb-3">OUR MISSION</h3>
                          <p className="text-sm font-medium text-gray-300 leading-relaxed lowercase">{companyProfile.mission}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 4: What is Heavy Equipment */}
                  {currentSlide === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl font-black font-orbitron uppercase text-[#C5A059]">WHAT IS HEAVY EQUIPMENT?</h2>
                          <p className="text-sm font-bold text-gray-400 lowercase mt-1">Machines designed to handle large and demanding tasks</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white shadow-lg flex gap-3 items-start transition-colors hover:border-[#C5A059]/50">
                            <Settings className="w-8 h-8 text-[#C5A059] shrink-0" />
                            <p className="text-xs font-bold lowercase text-gray-300">Heavy equipment is used for construction and earth-moving work</p>
                          </div>
                          <div className="p-4 rounded-xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white shadow-lg flex gap-3 items-start transition-colors hover:border-[#C5A059]/50">
                            <Wrench className="w-8 h-8 text-[#C5A059] shrink-0" />
                            <p className="text-xs font-bold lowercase text-gray-300">They are designed for strength and durability on any terrain</p>
                          </div>
                          <div className="p-4 rounded-xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white shadow-lg flex gap-3 items-start transition-colors hover:border-[#C5A059]/50">
                            <Layers className="w-8 h-8 text-[#C5A059] shrink-0" />
                            <p className="text-xs font-bold lowercase text-gray-300">These machines help move soil, rocks, and materials quickly</p>
                          </div>
                          <div className="p-4 rounded-xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 text-white shadow-lg flex gap-3 items-start transition-colors hover:border-[#C5A059]/50">
                            <Shield className="w-8 h-8 text-[#C5A059] shrink-0" />
                            <p className="text-xs font-bold lowercase text-gray-300">They are commonly used in large UAE infrastructure projects</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image src="/images/excavator_digging.jpg" alt="Excavator digging" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.8]" />
                      </div>
                    </div>
                  )}

                  {/* SLIDE 5: Common Types */}
                  {currentSlide === 4 && (
                    <div className="flex flex-col justify-between h-full gap-4">
                      <div className="text-center">
                        <h2 className="text-2xl font-black font-orbitron uppercase text-[#C5A059]">COMMON TYPES OF HEAVY EQUIPMENT</h2>
                        <p className="text-xs font-bold text-gray-400 lowercase">Different machines serve different construction tasks</p>
                      </div>
                      <div className="grid grid-cols-5 gap-3 flex-grow min-h-[280px]">
                        {columnsData.map((col, idx) => (
                          <div
                            key={idx}
                            className="group relative rounded-xl overflow-hidden border border-white/10 flex flex-col justify-between shadow-lg hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all"
                          >
                            <Image src={col.img} alt={col.title} width={1200} height={900} className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-[0.7]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111113]/90 to-transparent z-10 p-3 flex flex-col justify-end text-white transition-opacity duration-300">
                              <h3 className="text-sm font-black font-orbitron uppercase tracking-wider text-[#C5A059] border-b border-white/10 pb-1 mb-2">{col.title}</h3>
                              <p className="text-[10px] font-medium leading-relaxed lowercase text-gray-300">{col.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SLIDE 6: Why Heavy Equipment Matters */}
                  {currentSlide === 5 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl font-black font-orbitron uppercase text-[#C5A059]">WHY HEAVY EQUIPMENT MATTERS</h2>
                          <p className="text-sm font-bold text-gray-400 lowercase mt-1">Machines that increase speed and efficiency</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[#1A1A1D]/80 backdrop-blur-xl border border-white/10 shadow-2xl text-gray-300 font-medium leading-relaxed text-sm lowercase">
                          Heavy equipment plays an important role in construction projects. Without these machines, many tasks would take much longer to complete. Large equipment can move huge amounts of soil and materials in a short time. This helps construction teams work faster and complete projects more efficiently.
                        </div>
                      </div>
                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image src="/images/heavy_crane.jpg" alt="Heavy telescopic crane" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.8]" />
                      </div>
                    </div>
                  )}

                  {/* SLIDE 7: Productivity Comparison */}
                  {currentSlide === 6 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl font-black font-orbitron uppercase text-[#C5A059]">PRODUCTIVITY COMPARISON</h2>
                          <p className="text-sm font-bold text-gray-400 lowercase mt-1">Machines dramatically increase work efficiency</p>
                        </div>
                        <ProductivityChart />
                      </div>
                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image src="/images/wheel_shovel.jpg" alt="Wheel shovel working" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.8]" />
                      </div>
                    </div>
                  )}

                  {/* SLIDE 8: Heavy Equipment Usage in Projects */}
                  {currentSlide === 7 && (
                    <div className="flex flex-col justify-between h-full gap-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-black font-orbitron uppercase text-white">HEAVY EQUIPMENT USAGE IN PROJECTS</h2>
                        <p className="text-xs font-bold text-gray-400 lowercase">Different machines are used for different tasks</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow items-center">
                        <div className="p-4 rounded-xl bg-[#1A1A1D]/80 backdrop-blur-xl text-white border border-white/10 flex items-center gap-4 shadow-lg transition-transform hover:-translate-y-1">
                          <span className="w-5 h-5 rounded-full bg-[#C5A059] shrink-0 shadow-[0_0_10px_#C5A059]" />
                          <span className="font-orbitron font-black text-sm uppercase text-gray-200">Excavators are used for digging and trenching</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-xl text-white border border-white/10 flex items-center gap-4 shadow-lg transition-transform hover:-translate-y-1">
                          <span className="w-5 h-5 rounded-full border-2 border-[#C5A059] shrink-0" />
                          <span className="font-orbitron font-black text-sm uppercase text-gray-200">Wheel loaders move heavy materials</span>
                        </div>
                        <div className="p-4 rounded-xl bg-[#1A1A1D]/80 backdrop-blur-xl text-white border border-white/10 flex items-center gap-4 shadow-lg transition-transform hover:-translate-y-1">
                          <span className="w-5 h-5 rounded-full bg-[#C5A059] shrink-0 shadow-[0_0_10px_#C5A059]" />
                          <span className="font-orbitron font-black text-sm uppercase text-gray-200">Bulldozers clear and level site land</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-xl text-white border border-white/10 flex items-center gap-4 shadow-lg transition-transform hover:-translate-y-1">
                          <span className="w-5 h-5 rounded-full border-2 border-[#C5A059] shrink-0" />
                          <span className="font-orbitron font-black text-sm uppercase text-gray-200">Dumpers & Low Beds transport machinery & aggregates</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 9: Types of Work Done */}
                  {currentSlide === 8 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="space-y-4">
                        <h2 className="text-2xl font-black font-orbitron uppercase text-[#C5A059]">TYPES OF WORK DONE BY HEAVY EQUIPMENT</h2>
                        <div className="p-6 rounded-2xl bg-[#1A1A1D]/80 backdrop-blur-xl text-gray-300 border border-white/10 shadow-2xl font-medium text-xs leading-relaxed lowercase">
                          Heavy equipment is essential for construction tasks such as excavating, transporting materials, and demolishing structures. Key machines like bulldozers, excavators, cranes, loaders, and dump trucks improve efficiency and organization on sites, crucial for paving roads, building bridges, and erecting structures safely and effectively.
                        </div>
                      </div>
                      <div className="flex justify-center items-center">
                        {/* <WorkBreakdownChart /> */}
                      </div>
                    </div>
                  )}

                  {/* SLIDE 10: Operation Trends */}
                  {currentSlide === 9 && (
                    <div className="flex flex-col justify-between h-full gap-4">
                      <div className="text-center">
                        <h2 className="text-2xl font-black font-orbitron uppercase text-white">HEAVY EQUIPMENT OPERATION TRENDS</h2>
                      </div>
                      <div className="flex-grow flex items-center justify-center">
                        <OperationTrendsChart dark={true} />
                      </div>
                    </div>
                  )}

                  {/* SLIDE 11: The Future of Heavy Equipment */}
                  {currentSlide === 10 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl font-black font-orbitron uppercase text-white">THE FUTURE OF HEAVY EQUIPMENT</h2>
                          <p className="text-sm font-bold text-gray-400 lowercase mt-1">Smarter machines for better construction</p>
                        </div>
                        <p className="text-gray-300 font-medium text-sm leading-relaxed lowercase">
                          Heavy equipment will continue to evolve in the future. New technologies are making machines safer, more efficient, and easier to operate. Modern equipment can help reduce fuel usage, improve safety, and support faster project completion. As construction projects grow larger, advanced machines will become even more important.
                        </p>
                      </div>
                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image src="/images/loader_future.jpg" alt="Futuristic autonomous loader" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.7]" />
                      </div>
                    </div>
                  )}

                  {/* SLIDE 12: Thank You / Contact */}
                  {currentSlide === 11 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full relative">
                      <div className="space-y-6 z-10">
                        <h2 className="text-4xl font-black font-orbitron uppercase text-[#C5A059]">THANK YOU FOR YOUR ATTENTION</h2>

                        <div className="p-6 rounded-2xl bg-[#1A1A1D]/80 backdrop-blur-xl text-white border border-white/10 shadow-2xl space-y-4">
                          <div className="flex items-center gap-3 font-medium text-sm text-gray-300 hover:text-white transition-colors">
                            <Mail className="w-5 h-5 text-[#C5A059]" />
                            <span>admin@truxo.ae</span>
                          </div>
                          <div className="flex items-center gap-3 font-medium text-sm text-gray-300 hover:text-white transition-colors">
                            <Globe className="w-5 h-5 text-[#C5A059]" />
                            <span>www.truxo.ae</span>
                          </div>
                          <div className="flex items-center gap-3 font-medium text-sm text-gray-300 hover:text-white transition-colors">
                            <Phone className="w-5 h-5 text-[#C5A059]" />
                            <span>+971 54 305 8358</span>
                          </div>
                          <div className="flex items-center gap-3 font-medium text-sm text-gray-300 hover:text-white transition-colors">
                            <MapPin className="w-5 h-5 text-[#C5A059]" />
                            <span>Dubai, UAE</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-full min-h-[250px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image src="/images/loader_thankyou.jpg" alt="Loader at sunset" width={1200} height={900} className="w-full h-full object-cover filter brightness-[0.7]" />
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Navigation Area */}
            <div className="p-6 border-t border-white/10 bg-[#1A1A1D]/80 flex justify-between items-center shrink-0">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-6 py-2 rounded-full border border-white/10 text-white hover:bg-white/5 disabled:opacity-40 transition-colors font-orbitron text-xs flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {/* Dots Progress Indicator */}
              <div className="hidden md:flex gap-3">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === idx ? "bg-[#C5A059] scale-125 shadow-[0_0_10px_#C5A059]" : "bg-white/20 hover:bg-white/40"
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                className="px-6 py-2 rounded-full border border-white/10 bg-[#C5A059] text-black hover:bg-[#DFBA73] font-bold disabled:opacity-40 transition-colors font-orbitron text-xs flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STANDARD SCROLL VIEW                                                      */
        /* ========================================================================= */
        <div className="bg-[#050505]">

          {/* SECTION 1: Hero Track */}
          <div ref={scrollContainerRef} className="relative w-full h-screen md:h-[400vh]">
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.4 }} className="sticky top-0 w-full h-screen flex items-center overflow-hidden border-b border-white/5 z-0 bg-[#050505]">
              {/* Background Video */}
              <div className="absolute inset-0 z-0">
                <video
                  ref={scrollVideoRef}
                  key={heroVideo}
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover filter brightness-[0.85] hidden md:block"
                >
                  <source
                    src={`/${heroVideo}`}
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 md:hidden">
                  <Image
                    src="/images/hero_loader.jpg"
                    alt="TRUXO Heavy Equipment"
                    fill
                    sizes="(max-width: 767px) 100vw, 1px"
                    priority
                    className="object-cover filter brightness-[0.85]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-[#050505]/25 to-transparent" />
              </div>

              {/* Hero Content */}
              <motion.div style={{ opacity: heroTextOpacity, y: heroTextY }} className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 md:space-y-8 text-white max-w-2xl mt-12 md:mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.0, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111113]/50 border border-white/10 w-fit font-black uppercase text-xs tracking-[0.2em] text-[#FF7C00] backdrop-blur-md shadow-lg"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>United Arab Emirates</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:text-[5.5rem] font-black font-orbitron tracking-tight text-white uppercase leading-[1.05]"
                  >
                    TRUXO HEAVY <br />
                    <motion.span
                      initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 2.4 }}
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059] drop-shadow-[0_0_15px_rgba(197,160,89,0.3)] sm:whitespace-nowrap block sm:inline mt-1 sm:mt-0"
                    >
                      EQUIPMENT RENTAL
                    </motion.span>
                    {" Dubai"}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 2.6 }}
                    className="text-base sm:text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-xl"
                  >
                    Reliable heavy equipment solutions for construction, industrial, and infrastructure projects across the UAE.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.9, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-5 pt-4 w-full sm:w-auto"
                  >
                    <Link href="/fleet" className="w-full sm:w-auto">
                      <motion.div whileTap={{ scale: 0.95 }} className="btn-kampr-accent px-6 py-4 md:px-8 md:py-4 text-sm md:text-base shadow-[0_0_20px_rgba(197,160,89,0.3)] w-full flex justify-center items-center">
                        Explore Fleet <ChevronRight className="w-5 h-5 ml-1 inline" />
                      </motion.div>
                    </Link>
                    <Link href="/contact" className="w-full sm:w-auto">
                      <motion.div whileTap={{ scale: 0.95 }} className="px-6 py-4 md:px-8 md:py-4 rounded-full font-black border-2 border-white/20 text-white hover:bg-white hover:text-[#050505] transition-all duration-300 text-xs md:text-sm uppercase tracking-widest backdrop-blur-md w-full flex justify-center items-center">
                        Request Quote
                      </motion.div>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.section>
          </div>

          {/* SECTION 2 & 3: Company DNA (Sticky Parallax Editorial) */}
          <section className="relative w-full min-h-screen bg-[#050505] text-white z-[10] border-t border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Left Side: Sticky Media */}
              <div className="h-[50vh] lg:h-screen sticky top-0 lg:top-0 overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-white/10 z-10 bg-[#12131A]">
                <video
                  src="/TRUXOEQ3.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700 opacity-80 hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111113] to-transparent opacity-90" />
                <div className="absolute bottom-12 left-12">
                  <h3 className="text-2xl md:text-4xl lg:text-5xl lg:text-6xl lg:text-8xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] to-[#C5A059]">TRUXO</h3>
                  <p className="text-xl font-bold tracking-widest uppercase text-white/50">DNA & Heritage</p>
                </div>
              </div>

              {/* Right Side: Scrolling Content */}
              <div className="py-24 px-8 md:px-16 lg:py-48 flex flex-col gap-32">

                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, margin: "-100px" }}>
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059] mb-6 flex items-center gap-4">
                    <span className="w-12 h-[1px] bg-[#C5A059]" /> 01 / Who We Are
                  </h2>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl lg:text-6xl font-black uppercase leading-[1.1] mb-8 font-orbitron">
                    The Backbone of <br /> Infrastructure.
                  </h3>
                  <p className="text-lg md:text-xl font-medium text-gray-400 leading-relaxed max-w-xl">
                    {companyProfile.about}
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, margin: "-100px" }}>
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059] mb-6 flex items-center gap-4">
                    <span className="w-12 h-[1px] bg-[#C5A059]" /> 02 / Our Vision
                  </h2>
                  <h3 className="text-2xl md:text-4xl lg:text-2xl md:text-4xl lg:text-5xl font-black uppercase leading-[1.1] mb-8 font-orbitron text-white">
                    Setting The <br /> Industry Standard.
                  </h3>
                  <p className="text-lg md:text-xl font-medium text-gray-400 leading-relaxed max-w-xl">
                    {companyProfile.vision}
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, margin: "-100px" }}>
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059] mb-6 flex items-center gap-4">
                    <span className="w-12 h-[1px] bg-[#C5A059]" /> 03 / Our Mission
                  </h2>
                  <h3 className="text-2xl md:text-4xl lg:text-2xl md:text-4xl lg:text-5xl font-black uppercase leading-[1.1] mb-8 font-orbitron text-white">
                    Empowering <br /> Growth & Safety.
                  </h3>
                  <p className="text-lg md:text-xl font-medium text-gray-400 leading-relaxed max-w-xl">
                    {companyProfile.mission}
                  </p>
                </motion.div>

              </div>
            </div>
          </section>

          {/* SECTION 4: Interactive Fleet Showcase */}
          <section className="relative w-full min-h-screen bg-[#050505] py-32 overflow-hidden z-[20] border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 mb-16">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059] mb-4 text-center">Equipment Arsenal</h2>
              <h3 className="text-2xl md:text-4xl lg:text-5xl lg:text-7xl font-black font-orbitron uppercase text-white tracking-tight text-center">
                Our Fleet Segments
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row h-[80vh] w-full px-6 gap-4">
              {columnsData.map((col, idx) => (
                <Link
                  href="/fleet"
                  key={idx}
                  className="group relative flex-1 hover:flex-[3] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden rounded-3xl border border-white/10 cursor-pointer min-h-[100px] lg:min-h-full block"
                >
                  <Image
                    src={col.img}
                    alt={col.title}
                    width={1920} height={1080}
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4] group-hover:brightness-100 transition-all duration-700 scale-125 group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-700" />

                  <div className="absolute bottom-0 left-0 w-full p-8 lg:p-12 flex flex-col justify-end h-full">
                    <div className="flex items-center gap-6 mb-4">
                      <span className="text-4xl font-black font-orbitron text-[#C5A059] opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                        0{idx + 1}
                      </span>
                      <h4 className="text-2xl md:text-4xl font-black font-orbitron text-white uppercase whitespace-nowrap lg:-rotate-90 lg:origin-left lg:absolute lg:left-12 lg:bottom-12 group-hover:lg:rotate-0 group-hover:lg:relative group-hover:lg:left-auto group-hover:lg:bottom-auto transition-all duration-700">
                        {col.title}
                      </h4>
                    </div>

                    <div className="opacity-0 translate-y-10 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100 hidden lg:block">
                      <p className="text-gray-200 font-medium mb-8 max-w-md leading-relaxed line-clamp-3">
                        {col.desc}
                      </p>
                      <span className="inline-block px-8 py-4 rounded-full bg-[#C5A059] text-[#111113] font-bold text-xs uppercase tracking-widest group-hover:bg-white transition-colors">
                        View Inventory
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* SECTION 5: Trust Metrics & CTA */}
          <section className="relative w-full min-h-screen bg-[#050505] py-32 text-white overflow-hidden z-[30] border-t border-white/5">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#C5A059]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest font-orbitron">Job Tracking</span>
                </div>
                <h3 className="text-2xl md:text-4xl lg:text-5xl lg:text-6xl font-black font-orbitron uppercase leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                  Speed & Capacity Metrics
                </h3>
                <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-lg">
                  Heavy equipment plays an important role in construction projects. Without these machines, many tasks would take much longer to complete. Large equipment can move huge amounts of soil and materials in a short time, helping teams complete projects more efficiently.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                  <div>
                    <span className="block text-4xl font-black font-orbitron text-[#C5A059] mb-1">40x</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Faster Output</span>
                  </div>
                  <div>
                    <span className="block text-4xl font-black font-orbitron text-[#C5A059] mb-1">24/7</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Continuous Ops</span>
                  </div>
                </div>
              </div>

              {/* Glowing Chart Dashboard */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#C5A059] to-[#DFBA73] rounded-3xl blur opacity-20" />
                <div className="relative bg-[#111113]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Productivity Analysis</span>
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <ProductivityChart />
                </div>
              </motion.div>
            </div>
          </section>

          {/* --- NEW SECTION 7: Interactive Workflow Timeline (Merges 8 & 9) --- */}
          <section className="bg-[#111113] py-32 text-white relative border-t-4 border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">

              <div className="lg:col-span-5 space-y-12">
                <div className="sticky top-32">
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059] mb-4">Operational Flow</h2>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-black font-orbitron uppercase leading-[1.1] mb-6">
                    Operations <br /> & Integration
                  </h3>
                  <p className="text-gray-400 font-medium leading-relaxed mb-12">
                    Heavy equipment is essential for excavating, transporting, and demolishing. Key machines improve efficiency and organization on sites, crucial for paving roads, building bridges, and erecting structures safely.
                  </p>

                  {/* Floating Chart Card */}
                  <div className="bg-[#050505] p-6 rounded-3xl border border-white/10 shadow-2xl">
                    {/* <WorkBreakdownChart /> */}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 relative">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#C5A059] via-[#DFBA73] to-transparent hidden md:block" />

                <div className="space-y-16 md:pl-16">
                  {[
                    { title: "Excavators", desc: "Used for digging, trenching, and massive earth-moving tasks.", icon: <Settings className="w-6 h-6 text-[#111113]" /> },
                    { title: "Wheel Loaders", desc: "Efficiently move heavy materials and aggregates across the site.", icon: <Wrench className="w-6 h-6 text-[#111113]" /> },
                    { title: "Bulldozers", desc: "Clear and level site land, preparing the foundation.", icon: <Layers className="w-6 h-6 text-[#111113]" /> },
                    { title: "Trucks", desc: "Transport massive machinery and materials to and from the site.", icon: <Shield className="w-6 h-6 text-[#111113]" /> }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, margin: "-100px" }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative bg-[#1A1A1D] p-8 rounded-3xl border border-white/5 hover:border-[#C5A059]/50 transition-colors group"
                    >
                      <div className="absolute -left-[53px] top-8 w-14 h-14 rounded-full bg-[#C5A059] flex items-center justify-center border-4 border-[#111113] shadow-[0_0_15px_rgba(197,160,89,0.5)] group-hover:scale-110 transition-transform hidden md:flex">
                        {item.icon}
                      </div>
                      <h4 className="text-2xl font-black font-orbitron uppercase text-white mb-3">{item.title}</h4>
                      <p className="text-gray-400 font-medium">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* --- NEW SECTION 8: Next-Gen Operations (Merges 10 & 11) --- */}
          <section className="relative py-32 overflow-hidden border-t-4 border-[#C5A059]">
            <div className="absolute inset-0 z-0">
              <Image src="/images/loader_future.jpg" alt="Autonomous Loader" width={1920} height={1080} className="w-full h-full object-cover filter brightness-[0.25]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              <div className="bg-[#111113]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#FF7C00] font-orbitron mb-2">Operation Trends</h2>
                  <h3 className="text-3xl font-black font-orbitron uppercase text-white">Activity Phases</h3>
                </div>
                <OperationTrendsChart dark={true} />
              </div>

              <div className="space-y-10">
                <h2 className="text-xs font-black uppercase tracking-widest text-[#C5A059]">The Future of Heavy Equipment</h2>
                <h3 className="text-2xl md:text-4xl lg:text-5xl lg:text-6xl font-black font-orbitron uppercase text-white leading-none">
                  Smarter Machines <br /> Better Build.
                </h3>
                <p className="text-lg font-medium text-gray-300 leading-relaxed">
                  Heavy equipment will continue to evolve. New technologies are making machines safer, more efficient, and easier to operate, reducing fuel usage and supporting faster project completion.
                </p>

                <div className="flex flex-wrap gap-4">
                  {[
                    "Autonomous Navigation",
                    "Sensor Safety Systems",
                    "Hybrid Clean Power",
                    "Job Tracking",
                    "Fleet Diagnostics"
                  ].map((tech, idx) => (
                    <span key={idx} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase hover:bg-[#C5A059] hover:text-black hover:border-[#C5A059] transition-all cursor-default">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* --- NEW SECTION 9: Cinematic Finale (Replaces 12) --- */}
          <section className="relative h-screen min-h-[800px] w-full flex items-center justify-center overflow-hidden border-t-4 border-[#111113]">
            <div className="absolute inset-0 z-0">
              <Image src="/images/loader_thankyou.jpg" alt="Sunset Loader" width={1920} height={1080} className="w-full h-full object-cover filter brightness-[0.4] scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-[#111113]/50" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center"
            >
              <h2 className="text-2xl md:text-4xl lg:text-5xl lg:text-6xl lg:text-8xl font-black font-orbitron uppercase text-white tracking-tight mb-8 drop-shadow-2xl">
                Ready To <span className="text-[#C5A059]">Build?</span>
              </h2>
              <p className="text-xl md:text-2xl font-medium text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
                We look forward to partnering with you on your next UAE build. Contact our support team today for rental rates and mobilization schedules.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                  { icon: <Mail className="w-5 h-5" />, text: "admin@truxo.ae" },
                  { icon: <Globe className="w-5 h-5" />, text: "truxo.ae" },
                  { icon: <Phone className="w-5 h-5" />, text: "+971 54 305 8358" },
                  { icon: <MapPin className="w-5 h-5" />, text: "Dubai, UAE" },
                ].map((info, idx) => (
                  <div key={idx} className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="text-[#C5A059]">{info.icon}</div>
                    <span className="text-white text-xs font-bold tracking-widest uppercase text-center">{info.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/contact" className="inline-block px-12 py-5 rounded-full bg-white text-[#111113] font-black text-sm uppercase tracking-widest hover:bg-[#C5A059] hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                Contact Us Now
              </Link>
            </motion.div>
          </section>


        </div>
      )}
    </main>
  );
}
