import type {
  AppearanceSettings,
  Placement,
  UpsellDiscountSettings,
} from "./recommendation-types.ts";

export type ShopifyUpsellConfig = {
  enabled: boolean;
  maxProducts: number;
  appearance: Partial<AppearanceSettings>;
  discount: UpsellDiscountSettings;
};

// Opt-in is deliberately stored on Shopify, not inferred from a failed API call.
// Missing/invalid configuration keeps the existing campaign implementation.
export function readShopifyUpsellConfig(
  raw: string | undefined,
  placement: Placement,
  themeId?: string,
): ShopifyUpsellConfig | null {
  try {
    const document = JSON.parse(raw || "null");
    if (document?.previewThemeId && String(document.previewThemeId) !== themeId)
      return null;
    const config = document?.version === 1 && document.placements?.[placement];
    if (!config || typeof config.enabled !== "boolean") return null;
    const discount = config.discount;
    const validDiscount =
      ["NONE", "PERCENTAGE", "FIXED_AMOUNT"].includes(discount?.type) &&
      Number.isFinite(discount?.value) &&
      discount.value >= 0;
    return {
      enabled: config.enabled,
      maxProducts: Math.max(
        1,
        Math.min(
          10,
          Math.floor(
            Number(config.maxProducts) || (placement === "CART_DRAWER" ? 5 : 3),
          ),
        ),
      ),
      appearance:
        typeof config.appearance === "object" && config.appearance !== null
          ? config.appearance
          : {},
      discount: validDiscount
        ? {
            type: discount.type,
            value:
              discount.type === "PERCENTAGE"
                ? Math.min(100, discount.value)
                : discount.value,
            message: String(discount.message || "Upsell offer"),
          }
        : { type: "NONE", value: 0, message: "" },
    };
  } catch {
    return null;
  }
}

type Candidate = {
  id?: string | number;
  handle: string;
  requiresCustomization?: boolean;
  excludedFromUpsell?: boolean;
};
const numericId = (id: unknown) =>
  String(id || "").replace("gid://shopify/Product/", "");

// Only Shopify loaders are injected here. No app proxy, database, or analytics
// request can become a dependency of a customer's recommendation/add flow.
export async function shopifyRecommendations<T extends Candidate>({
  productIds,
  limit,
  allowCustomization,
  loadRelated,
  loadFallback,
  loadProduct,
}: {
  productIds: Array<string | number>;
  limit: number;
  allowCustomization: boolean;
  loadRelated: (id: string) => Promise<Candidate[]>;
  loadFallback: () => Promise<Candidate[]>;
  loadProduct: (candidate: Candidate) => Promise<T | null>;
}): Promise<T[]> {
  const excluded = new Set(productIds.map(numericId));
  const handles = new Set<string>();
  const selected: T[] = [];
  const count = Math.max(1, Math.min(10, Math.floor(limit) || 3));
  async function append(candidates: Candidate[]) {
    const pending = Array.isArray(candidates) ? candidates.slice(0, 50) : [];
    while (pending.length && selected.length < count) {
      const batch: Candidate[] = [];
      while (pending.length && batch.length < count - selected.length) {
        const candidate = pending.shift();
        if (
          !candidate ||
          !/^[a-z0-9][a-z0-9-]*$/i.test(candidate.handle) ||
          handles.has(candidate.handle) ||
          excluded.has(numericId(candidate.id)) ||
          candidate.excludedFromUpsell ||
          (!allowCustomization && candidate.requiresCustomization)
        )
          continue;
        handles.add(candidate.handle);
        batch.push(candidate);
      }
      const loaded = await Promise.all(
        batch.map((candidate) => loadProduct(candidate).catch(() => null)),
      );
      for (const product of loaded) {
        if (
          !product?.id ||
          excluded.has(numericId(product.id)) ||
          product.excludedFromUpsell ||
          (!allowCustomization && product.requiresCustomization)
        )
          continue;
        selected.push(product);
        excluded.add(numericId(product.id));
      }
    }
  }
  // One anchor first; only request another cart anchor when it is necessary.
  for (const id of [...excluded].filter((id) => /^\d+$/.test(id)).slice(0, 2)) {
    await append(await loadRelated(id).catch(() => []));
    if (selected.length >= count) break;
  }
  if (selected.length < count)
    await append(await loadFallback().catch(() => []));
  return selected;
}
