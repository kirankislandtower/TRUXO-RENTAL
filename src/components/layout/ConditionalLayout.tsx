"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomTabNavigation from "./BottomTabNavigation";
import FAB from "./FAB";
import SmoothScroller from "./SmoothScroller";
import ContactClickTracker from "@/components/analytics/ContactClickTracker";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <SmoothScroller>
      <Navbar />
      {children}
      <FAB />
      <BottomTabNavigation />
      <Footer />
      <ContactClickTracker />
    </SmoothScroller>
  );
}
