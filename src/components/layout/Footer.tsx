import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#12131A] text-[#F5F2EB] pt-24 pb-12 border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="TRUXO heavy equipment rental logo" width={40} height={40} className="w-10 h-10 object-contain rounded-full border border-white/10" />
            <span className="font-orbitron font-black text-2xl tracking-widest text-white uppercase">truxo</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed font-medium">
            TRUXO rents excavators, forklifts, wheel shovels, cranes and trucks to construction, industrial and infrastructure projects in Dubai and across the UAE.
          </p>
        </div>

        <div className="space-y-6">
          <h4 className="text-[#C5A059] font-orbitron font-bold text-sm uppercase tracking-wider">quick links</h4>
          <ul className="space-y-3 text-sm text-gray-400 font-bold capitalize">
            <li><Link href="/fleet" className="hover:text-[#C5A059] transition-colors">Our Fleet</Link></li>
            <li><Link href="/services" className="hover:text-[#C5A059] transition-colors">Services</Link></li>
            <li><Link href="/industries" className="hover:text-[#C5A059] transition-colors">Industries</Link></li>
            <li><Link href="/insights" className="hover:text-[#C5A059] transition-colors">News &amp; Insights</Link></li>
            <li><Link href="/contact" className="hover:text-[#C5A059] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[#C5A059] font-orbitron font-bold text-sm uppercase tracking-wider">contact details</h4>
          <address className="not-italic">
            <ul className="space-y-3 text-sm text-gray-400 font-bold">
              <li>
                <a href="tel:+971543058358" className="flex items-center gap-2 hover:text-[#C5A059] transition-colors">
                  <Phone className="w-4 h-4 text-[#A51A1A]" />
                  <span>+971 54 305 8358</span>
                </a>
              </li>

              <li>
                <a href="mailto:admin@truxo.ae" className="flex items-center gap-2 hover:text-[#C5A059] transition-colors">
                  <Mail className="w-4 h-4 text-[#A51A1A]" />
                  <span>admin@truxo.ae</span>
                </a>
              </li>
            </ul>
          </address>
        </div>

        <div className="space-y-6">
          <h4 className="text-[#C5A059] font-orbitron font-bold text-sm uppercase tracking-wider">location</h4>
          <p className="text-sm text-gray-400 leading-relaxed font-bold flex items-start gap-2">
            <MapPin className="w-5 h-5 text-[#A51A1A] shrink-0" />
            <span>
              Dubai, UAE
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 text-center text-xs text-gray-500 font-bold tracking-wider uppercase font-orbitron">
        <p>© 2026 truxo heavy equipment rental. all rights reserved.</p>
      </div>
    </footer>
  );
}
