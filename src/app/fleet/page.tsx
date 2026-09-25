import JsonLd from "@/components/seo/JsonLd";
import { parseAssetData } from "@/lib/fleetAsset";
import { itemListJsonLd } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import FleetExplorer, { type FleetCardAsset } from "./FleetExplorer";

// Server-rendered (so search engines see every machine and its link) and cached for a couple of minutes.
// The admin fleet API also calls revalidatePath("/fleet"), so edits show up immediately.
export const revalidate = 120;

async function loadFleet(): Promise<FleetCardAsset[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  // Public columns only: this uses the service-role client, so never `select("*")` here.
  const { data, error } = await supabase
    .from("fleet")
    .select("asset_id, type, model, image, location, status")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fleet page: could not load fleet", error);
    return [];
  }

  return data.map((row) => {
    const { brand, name, image } = parseAssetData(row);
    return { id: row.asset_id, brand, name, image, location: row.location || "Dubai" };
  });
}

export default async function FleetPage() {
  const assets = await loadFleet();

  return (
    <>
      {assets.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            "TRUXO heavy equipment rental fleet",
            assets.map((asset) => ({ name: `${asset.brand} ${asset.name}`.trim(), path: `/fleet/${encodeURIComponent(asset.id)}` })),
          )}
        />
      )}
      <FleetExplorer assets={assets} />
    </>
  );
}
