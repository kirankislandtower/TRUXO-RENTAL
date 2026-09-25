import type { Metadata } from "next";

// The admin dashboard is private: keep it out of search results and don't follow links from it.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
