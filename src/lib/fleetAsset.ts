export const DEFAULT_ASSET_IMAGE = "/images/company_excavator.jpg";

// Just the columns the parser reads, so it works for admin rows and public rows alike.
export type AssetSource = {
  model?: string | null;
  type?: string | null;
  image?: string | null;
};

type ParsedModel = { name?: string; brand?: string; image?: string } | null;

/**
 * Splits a fleet row into display brand / name / image.
 *
 * The `model` column has held three formats over time: a JSON object
 * ({"brand","name","image"}), the legacy "brand||name||image" string, or just
 * the model name. The dedicated `image` column always wins when it is set.
 */
export function parseAssetData(asset: AssetSource): { name: string; brand: string; image: string } {
  let name = asset.model || "";
  let brand = asset.type || "";
  let image = asset.image || DEFAULT_ASSET_IMAGE;

  try {
    const json = JSON.parse(asset.model ?? "") as ParsedModel;
    if (json?.name) name = json.name;
    if (json?.brand) brand = json.brand;
    if (json?.image && !asset.image) image = json.image;
  } catch {
    if (asset.model?.includes("||")) {
      const parts = asset.model.split("||").map((part) => part.trim());
      if (parts.length >= 3) {
        brand = parts[0];
        name = parts[1];
        if (!asset.image && parts[2]) image = parts[2];
      }
    }
  }

  return { name, brand, image };
}
