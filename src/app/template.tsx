"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

// How long the branded splash stays fully visible before it fades out (ms).
// It is applied as the CSS animation delay, so it also works without JS.
const SPLASH_HOLD_MS = 1200;
const SPLASH_FADE_MS = 400;

// Module scope: survives client-side navigations, resets on a full page load.
// Only ever written from the browser, so it is never shared between server requests.
let splashPlayed = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Next remounts this template on every route change. Previously that replayed a
  // 2s full-screen loader on every navigation and hid the page (opacity 0) until it
  // finished, so we only play it once per page load, never on /admin, and never
  // hide the content itself.
  const [showSplash, setShowSplash] = useState(() => !splashPlayed && !isAdmin);

  useEffect(() => {
    if (!showSplash) return;
    splashPlayed = true;
    const timer = setTimeout(() => setShowSplash(false), SPLASH_HOLD_MS + SPLASH_FADE_MS);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <>
      {showSplash && (
        <div
          aria-hidden="true"
          className="splash-overlay fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center"
          style={{ animationDelay: `${SPLASH_HOLD_MS}ms`, animationDuration: `${SPLASH_FADE_MS}ms` }}
        >
          {/* Premium Gold Spinner with Logo */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-transparent border-t-[#C5A059] border-r-[#C5A059] animate-spin" />
            <Image src="/logo.jpeg" width={96} height={96} alt="" priority className="absolute w-16 h-16 md:w-24 md:h-24 object-contain rounded-full border border-white/10" />
          </div>
        </div>
      )}

      <div className="w-full h-full">{children}</div>
    </>
  );
}
