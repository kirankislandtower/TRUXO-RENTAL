import { insightsData } from "@/data/insights";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InsightPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = insightsData.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-32 pb-32">
      <article className="max-w-4xl mx-auto px-6">
        
        {/* Back Button */}
        <Link 
          href="/insights"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#C5A059] transition-colors mb-12 text-sm font-bold uppercase tracking-widest font-orbitron"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Insights
        </Link>

        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-full text-xs font-black uppercase tracking-widest">
              {post.category}
            </span>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author}</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase font-orbitron tracking-tight mb-8 leading-[1.1]">
            {post.title}
          </h1>
        </header>

        {/* Featured Image */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden mb-16 border border-white/10 shadow-2xl">
          <Image 
            src={post.image} 
            alt={post.title} 
            fill 
            className="object-cover"
            priority
          />
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-orbitron prose-headings:uppercase prose-headings:text-white prose-a:text-[#C5A059] hover:prose-a:text-[#DFBA73] prose-img:rounded-2xl">
          {post.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return <h3 key={index} className="text-2xl mt-12 mb-6 text-[#C5A059]">{paragraph.replace('### ', '')}</h3>;
            }
            if (paragraph.startsWith('- ')) {
              return <li key={index} className="ml-6 list-disc text-gray-300">{paragraph.replace('- ', '')}</li>;
            }
            if (paragraph.trim() === '') return null;
            return <p key={index} className="text-gray-300 leading-relaxed mb-6">{paragraph}</p>;
          })}
        </div>

      </article>
    </main>
  );
}
