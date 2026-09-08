import assert from "node:assert/strict";
import test from "node:test";

import {
  createStorefrontPreviewProfile,
  createThemeEditorPreviewUrl,
} from "./storefront-preview-profile.ts";
import type { ProductCandidate } from "./recommendation-types.ts";

const product: ProductCandidate = {
  collections: ["apparel"],
  handle: "classic-tee",
  imageUrl: "https://cdn.example.com/classic-tee.jpg",
  inventoryAvailable: true,
  priceMax: 32,
  priceMin: 28,
  productId: "gid://shopify/Product/1",
  productType: "T-shirt",
  publishedAt: "2026-07-01T00:00:00.000Z",
  popularityScore: 0.5,
  tags: ["tee"],
  title: "Classic Tee",
  variants: [
    {
      available: true,
      compareAtPrice: 35,
      id: "gid://shopify/ProductVariant/1",
      price: 28,
      title: "Black / M",
    },
  ],
  vendor: "Tee Blessed",
};

test("CamoSignal stores use the CamoSignal theme profile and real product data", () => {
  const profile = createStorefrontPreviewProfile({
    products: [product],
    shopDomain: "apepsd-ha.myshopify.com",
    shopName: "CamoSignal",
    storefrontUrl: "https://camosignal.com",
  });

  assert.equal(profile.theme.fontFamily.includes("Arial Narrow"), true);
  assert.equal(profile.theme.buttonBackground, "#294237");
  assert.equal(profile.theme.buttonRadius, 8);
  assert.equal(profile.primaryProduct?.title, "Classic Tee");
});

test("CamoSignal combo-builder products are marked as custom in preview data", () => {
  const profile = createStorefrontPreviewProfile({
    products: [
      product,
      {
        ...product,
        handle: "personalized-tee",
        productId: "gid://shopify/Product/2",
        tags: ["combo-builder"],
        title: "Personalized Tee",
      },
    ],
    shopDomain: "apepsd-ha.myshopify.com",
    shopName: "CamoSignal",
    storefrontUrl: "https://camosignal.com",
  });

  assert.equal(profile.recommendedProducts[0]?.requiresCustomization, true);
});

test("theme editor links target the correct placement", () => {
  const drawerUrl = createThemeEditorPreviewUrl({
    apiKey: "client-id",
    placement: "CART_DRAWER",
    shopDomain: "store.myshopify.com",
  });
  const cartPageUrl = createThemeEditorPreviewUrl({
    apiKey: "client-id",
    placement: "CART_PAGE",
    shopDomain: "store.myshopify.com",
  });
  const productPageUrl = createThemeEditorPreviewUrl({
    apiKey: "client-id",
    placement: "PRODUCT_PAGE",
    shopDomain: "store.myshopify.com",
  });

  assert.equal(drawerUrl.includes("template=product"), true);
  assert.equal(drawerUrl.includes("sectionGroup%3Aheader"), true);
  assert.equal(drawerUrl.includes("cart-drawer-upsell"), true);
  assert.equal(cartPageUrl.includes("template=cart"), true);
  assert.equal(cartPageUrl.includes("cart-page-upsell"), true);
  assert.equal(productPageUrl.includes("template=product"), true);
  assert.equal(productPageUrl.includes("product-page-upsell"), true);
});
