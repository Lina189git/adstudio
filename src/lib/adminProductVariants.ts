import { getCanvasSizeLabel, getFrameStyleLabel } from "@/lib/paintingOrder";

export type AdminVariantInput = {
  id?: string;
  name?: string | null;
  canvasSize?: string | null;
  frameStyle?: string | null;
  previewImageUrl?: string | null;
  details?: string | null;
  priceCents?: number | string | null;
  stockQuantity?: number | string | null;
  isActive?: boolean | null;
};

function slugSegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeAdminProductVariants(
  variants: AdminVariantInput[] | undefined,
  productSlug: string
) {
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new Error("Add at least one frame and size variant.");
  }

  const seen = new Set<string>();

  return variants.map((variant, index) => {
    const canvasSize = String(variant.canvasSize || "").trim();
    const frameStyle = String(variant.frameStyle || "").trim();

    if (!canvasSize || !frameStyle) {
      throw new Error(`Variant ${index + 1} must include both canvas size and frame style.`);
    }

    const combinationKey = `${canvasSize}::${frameStyle}`;
    if (seen.has(combinationKey)) {
      throw new Error(`Duplicate variant combination found for ${canvasSize} and ${frameStyle}.`);
    }
    seen.add(combinationKey);

    const priceCents = Number(variant.priceCents);
    const stockQuantity = Number(variant.stockQuantity);

    if (!Number.isFinite(priceCents) || priceCents < 0) {
      throw new Error(`Variant ${index + 1} surcharge must be zero or greater.`);
    }

    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      throw new Error(`Variant ${index + 1} stock quantity must be zero or greater.`);
    }

    return {
      id: variant.id || undefined,
      name:
        String(variant.name || "").trim() ||
        `${getCanvasSizeLabel(canvasSize)} / ${getFrameStyleLabel(frameStyle)}`,
      sku: `${slugSegment(productSlug)}-${slugSegment(canvasSize)}-${slugSegment(frameStyle)}`,
      canvasSize,
      frameStyle,
      previewImageUrl: String(variant.previewImageUrl || "").trim() || null,
      details: String(variant.details || "").trim() || null,
      priceCents,
      stockQuantity,
      isActive: variant.isActive !== false,
    };
  });
}
