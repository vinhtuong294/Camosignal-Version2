import assert from "node:assert/strict";
import test from "node:test";
import {
  readShopifyUpsellConfig,
  shopifyRecommendations,
} from "./shopify-recommendations.ts";

const products = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  handle: `product-${i + 1}`,
  requiresCustomization: i === 1,
}));
test("Shopify source requires explicit versioned configuration; disable is retained", () => {
  assert.equal(readShopifyUpsellConfig("invalid", "CART_DRAWER"), null);
  assert.equal(readShopifyUpsellConfig("{}", "CART_DRAWER"), null);
  const config = readShopifyUpsellConfig(
    JSON.stringify({
      version: 1,
      placements: { CART_DRAWER: { enabled: false, maxProducts: 200 } },
    }),
    "CART_DRAWER",
  );
  assert.equal(config?.enabled, false);
  assert.equal(config?.maxProducts, 10);
  assert.equal(config?.discount.type, "NONE");
  const preview = JSON.stringify({
    version: 1,
    previewThemeId: "42",
    placements: { CART_DRAWER: { enabled: true } },
  });
  assert.equal(readShopifyUpsellConfig(preview, "CART_DRAWER", "1"), null);
  assert.equal(
    readShopifyUpsellConfig(preview, "CART_DRAWER", "42")?.enabled,
    true,
  );
});
test("drawers select five unique, non-custom products excluding cart IDs", async () => {
  let fallbacks = 0;
  const result = await shopifyRecommendations({
    productIds: ["gid://shopify/Product/1"],
    limit: 5,
    allowCustomization: false,
    loadRelated: async () => products,
    loadFallback: async () => {
      fallbacks++;
      return [];
    },
    loadProduct: async (p) => p,
  });
  assert.deepEqual(
    result.map((p) => p.id),
    [3, 4, 5, 6, 7],
  );
  assert.equal(fallbacks, 0);
});
test("recommendation errors fall back; unavailable, duplicate, excluded and unsafe products are skipped", async () => {
  const result = await shopifyRecommendations({
    productIds: [1],
    limit: 3,
    allowCustomization: false,
    loadRelated: async () => {
      throw new Error("Shopify recommendation unavailable");
    },
    loadFallback: async () => [
      { id: 99, handle: "../unsafe" },
      ...products,
      ...products,
    ],
    loadProduct: async (p) =>
      p.id === 3 ? null : { ...p, excludedFromUpsell: p.id === 4 },
  });
  assert.deepEqual(
    result.map((p) => p.id),
    [5, 6, 7],
  );
});
test("product-page cards can retain CUSTOMIZE products; metadata wins over candidate", async () => {
  const result = await shopifyRecommendations({
    productIds: [1],
    limit: 3,
    allowCustomization: true,
    loadRelated: async () => products,
    loadFallback: async () => [],
    loadProduct: async (p) => p,
  });
  assert.deepEqual(
    result.map((p) => p.id),
    [2, 3, 4],
  );
  const drawer = await shopifyRecommendations({
    productIds: [1],
    limit: 2,
    allowCustomization: false,
    loadRelated: async () =>
      products.map((p) => ({ ...p, requiresCustomization: false })),
    loadFallback: async () => [],
    loadProduct: async (p) => ({ ...p, requiresCustomization: p.id === 2 }),
  });
  assert.deepEqual(
    drawer.map((p) => p.id),
    [3, 4],
  );
});
test("failed metadata does not turn unknown customization into quick-add", async () => {
  const result = await shopifyRecommendations({
    productIds: [1],
    limit: 5,
    allowCustomization: false,
    loadRelated: async () => products,
    loadFallback: async () => [],
    loadProduct: async () => {
      throw new Error("metadata unavailable");
    },
  });
  assert.deepEqual(result, []);
});
