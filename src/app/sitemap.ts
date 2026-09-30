import type { MetadataRoute } from "next";
import { insightsData } from "@/data/insights";
import { services } from "@/data";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { absoluteUrl } from "@/lib/site";

// Rebuilt at most hourly; the admin fleet API also revalidates it the moment equipment changes.
export const revalidate = 3600;

function validDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/fleet"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...services.map((service): MetadataRoute.Sitemap[number] => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/industries"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/insights"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const articles: MetadataRoute.Sitemap = insightsData.map((post) => ({
    url: absoluteUrl(`/insights/${post.slug}`),
    lastModified: validDate(post.date) ?? now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // One URL per piece of equipment, straight from the fleet table.
  let equipment: MetadataRoute.Sitemap = [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("fleet").select("asset_id, created_at");
    if (error) console.error("sitemap: could not load fleet", error);
    equipment = (data ?? []).map((row) => ({
      url: absoluteUrl(`/fleet/${encodeURIComponent(row.asset_id)}`),
      lastModified: validDate(row.created_at) ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  }

  return [...staticPages, ...equipment, ...articles];
}
