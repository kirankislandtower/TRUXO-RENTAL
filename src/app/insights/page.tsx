"use client";

import { motion, useScroll, useTransform, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowRight, Calendar, User, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { insightsData } from "@/data/insights";

// Custom spring configuration for fluid UI/UX Pro Max feel
const springConfig = { type: "spring" as const, stiffness: 300, damping: 25 };

export default function InsightsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [activePost, setActivePost] = useState(insightsData.find(p => p.featured) || insightsData[0]);
  const regularPosts = insightsData.filter(p => p.id !== activePost.id);

  const handlePostClick = (post: typeof insightsData[0]) => {
    setActivePost(post);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <LayoutGroup>
      <main ref={containerRef} className="min-h-screen bg-[#050505] text-[#F5F2EB] overflow-hidden pb-32 font-sans selection:bg-[#C5A059] selection:text-black">
        
        {/* Parallax Hero */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#C5A059]/10 blur-[120px] rounded-full pointer-events-none"
          />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, ...springConfig }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[#C5A059] mb-8 shadow-[0_0_20px_rgba(197,160,89,0.1)]"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest font-orbitron">Company Updates</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase font-orbitron tracking-tighter mb-8 leading-none">
                News & <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] to-[#DFBA73]">Insights</span>
              </h1>
              
              <p className="text-white/60 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                Stay updated with the latest industry trends, company news, and best practices for heavy equipment operations.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Featured Article (Active Post) */}
        <section className="max-w-7xl mx-auto px-6 mb-24 relative z-20">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activePost.id}
              layoutId={`container-${activePost.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springConfig}
              className="group relative bg-[#111113]/80 backdrop-blur-2xl border-t border-l border-white/10 border-b border-r border-black/50 rounded-[2.5rem] overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0 shadow-2xl"
            >
              <div className="relative h-80 lg:h-full w-full overflow-hidden bg-black">
                <motion.div
                  layoutId={`image-container-${activePost.id}`}
                  className="relative w-full h-full"
                >
                  <Image 
                    src={activePost.image} 
                    alt={activePost.title} 
                    fill 
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                
                <motion.div layoutId={`category-${activePost.id}`} className="absolute top-8 left-8">
                  <span className="px-5 py-2.5 bg-black/80 backdrop-blur-md border border-white/10 text-[#C5A059] text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {activePost.category}
                  </span>
                </motion.div>
              </div>

              <div className="p-10 lg:p-16 flex flex-col justify-center relative bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 blur-[80px] rounded-full pointer-events-none" />
                
                <motion.div layoutId={`meta-${activePost.id}`} className="flex items-center gap-6 text-xs font-bold text-white/40 uppercase tracking-widest mb-6">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#C5A059]" /> {activePost.date}</span>
                  <span className="flex items-center gap-2"><User className="w-4 h-4 text-[#C5A059]" /> {activePost.author}</span>
                </motion.div>
                
                <motion.h3 layoutId={`title-${activePost.id}`} className="text-3xl lg:text-5xl font-black font-orbitron uppercase leading-[1.1] mb-8 text-white group-hover:text-[#DFBA73] transition-colors">
                  {activePost.title}
                </motion.h3>
                
                <motion.p layoutId={`excerpt-${activePost.id}`} className="text-white/60 text-lg leading-relaxed mb-10 font-medium">
                  {activePost.excerpt}
                </motion.p>
                
                <Link href={`/insights/${activePost.slug}`}>
                  <motion.div 
                    whileHover={{ x: 10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springConfig}
                    className="self-start flex items-center gap-4 text-white text-sm font-black uppercase tracking-widest group-hover:text-[#C5A059] transition-colors cursor-pointer"
                  >
                    Read Full Story 
                    <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#C5A059]/20 transition-all shadow-lg">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Bento Grid: More Articles */}
        <section className="max-w-7xl mx-auto px-6 relative z-20">
          <div className="flex items-center gap-6 mb-12">
            <h2 className="text-2xl font-black uppercase font-orbitron text-white tracking-widest">More Insights</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <AnimatePresence>
              {regularPosts.map((post) => (
                <motion.article
                  key={post.id}
                  layoutId={`container-${post.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={springConfig}
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePostClick(post)}
                  className="relative h-full bg-[#111113]/40 backdrop-blur-xl border-t border-l border-white/5 border-b border-r border-black/40 rounded-[2rem] overflow-hidden hover:border-[#C5A059]/30 hover:bg-[#111113]/80 transition-colors shadow-lg group cursor-pointer flex flex-col"
                >
                  <div className="relative h-64 w-full overflow-hidden bg-black">
                    <motion.div
                      layoutId={`image-container-${post.id}`}
                      className="relative w-full h-full"
                    >
                      <Image 
                        src={post.image} 
                        alt={post.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-all duration-[1s] ease-out filter brightness-[0.7] group-hover:brightness-100 group-hover:scale-105"
                      />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent opacity-80" />
                    
                    <motion.div layoutId={`category-${post.id}`} className="absolute top-6 left-6">
                      <span className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-[#DFBA73] shadow-md">
                        {post.category}
                      </span>
                    </motion.div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col relative z-10 -mt-10">
                    <motion.div layoutId={`meta-${post.id}`} className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4 bg-[#111113] w-fit px-4 py-2 rounded-full border border-white/5">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C5A059]" /> {post.date}</span>
                    </motion.div>
                    
                    <motion.h3 layoutId={`title-${post.id}`} className="text-xl lg:text-2xl font-black font-orbitron uppercase leading-[1.2] mb-4 text-white group-hover:text-[#C5A059] transition-colors line-clamp-2">
                      {post.title}
                    </motion.h3>
                    
                    <motion.p layoutId={`excerpt-${post.id}`} className="text-white/50 text-sm leading-relaxed mb-8 line-clamp-2 font-medium flex-1">
                      {post.excerpt}
                    </motion.p>
                    
                    <div className="flex items-center justify-between text-white/40 group-hover:text-[#C5A059] transition-colors mt-auto border-t border-white/5 pt-6">
                      <span className="text-[10px] font-black uppercase tracking-widest">View Article</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </LayoutGroup>
  );
}
