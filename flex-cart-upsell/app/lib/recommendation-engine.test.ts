import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultCampaign } from "./campaign-defaults.ts";
import {
  matchesCampaignConditions,
  recommendProducts,
} from "./recommendation-engine.ts";
import type { ProductCandidate } from "./recommendation-types.ts";

const products: ProductCandidate[] = [
  {
    productId: "shirt",
    handle: "shirt",
    title: "Core shirt",
    vendor: "Camo",
    productType: "Shirt",
    tags: ["summer", "cotton"],
    collections: ["tops"],
    priceMin: 40,
    priceMax: 40,
    inventoryAvailable: true,
    publishedAt: "2026-01-01T00:00:00.000Z",
    popularityScore: 0.7,
    variants: [{ id: "shirt-v", title: "Default", price: 40, available: true }],
  },
  {
    productId: "cap",
    handle: "cap",
    title: "Camo cap",
    vendor: "Camo",
    productType: "Accessory",
    tags: ["summer"],
    collections: ["tops", "accessories"],
    priceMin: 22,
    priceMax: 22,
    inventoryAvailable: true,
    publishedAt: "2026-06-01T00:00:00.000Z",
    popularityScore: 0.9,
    variants: [{ id: "cap-v", title: "Default", price: 22, available: true }],
  },
  {
    productId: "mug",
    handle: "mug",
    title: "Tee Blessed mug",
    vendor: "Tee Blessed",
    productType: "Mug",
    tags: ["ceramic"],
    collections: ["home"],
    priceMin: 18,
    priceMax: 18,
    inventoryAvailable: true,
    publishedAt: "2025-01-01T00:00:00.000Z",
    popularityScore: 0.4,
    variants: [{ id: "mug-v", title: "Default", price: 18, available: true }],
  },
];

const customProduct: ProductCandidate = {
  productId: "custom-sweatshirt",
  handle: "custom-sweatshirt",
  title: "Personalized sweatshirt",
  vendor: "Camo",
  productType: "Sweatshirt",
  tags: ["flex-upsell:customize"],
  collections: ["tops"],
  priceMin: 46.99,
  priceMax: 46.99,
  inventoryAvailable: true,
  publishedAt: "2026-07-01T00:00:00.000Z",
  popularityScore: 1,
  variants: [
    {
      id: "custom-sweatshirt-v",
      title: "Default",
      price: 46.99,
      available: true,
    },
  ],
};

test("main CamoSignal placements allow three recommendations from one vendor", () => {
  assert.equal(
    createDefaultCampaign("PRODUCT_PAGE").filters.maxPerVendor,
    3,
  );
  assert.equal(
    createDefaultCampaign("CART_DRAWER").filters.maxPerVendor,
    3,
  );
});

test("smart mix favors a related candidate and excludes the cart product", () => {
  const campaign = createDefaultCampaign("CART_DRAWER");
  campaign.enabled = true;
  const results = recommendProducts(
    campaign,
    { productIds: ["shirt"], subtotal: 40, itemCount: 1 },
    products,
  );

  assert.equal(results[0]?.product.productId, "cap");
  assert.equal(results.some((item) => item.product.productId === "shirt"), false);
});

test("hard filters run before ranking", () => {
  const campaign = createDefaultCampaign("CART_PAGE");
  campaign.enabled = true;
  campaign.filters.excludeVendors = ["Camo"];
  const results = recommendProducts(
    campaign,
    { productIds: ["shirt"], subtotal: 40, itemCount: 1 },
    products,
  );

  assert.deepEqual(
    results.map((item) => item.product.productId),
    ["mug"],
  );
});

test("cart drawer recommendations exclude products that require customization", () => {
  const campaign = createDefaultCampaign("CART_DRAWER");
  campaign.enabled = true;
  campaign.strategy = "BEST_SELLERS";
  campaign.filters.maxProducts = 10;

  const results = recommendProducts(
    campaign,
    { productIds: ["shirt"], subtotal: 40, itemCount: 1 },
    [...products, customProduct],
  );

  assert.equal(
    results.some((item) => item.product.productId === customProduct.productId),
    false,
  );
});

test("product page recommendations still allow custom products", () => {
  const campaign = createDefaultCampaign("PRODUCT_PAGE");
  campaign.enabled = true;
  campaign.strategy = "BEST_SELLERS";
  campaign.filters.maxProducts = 10;

  const results = recommendProducts(
    campaign,
    { productIds: ["shirt"], subtotal: 0, itemCount: 0 },
    [...products, customProduct],
  );

  assert.equal(
    results.some((item) => item.product.productId === customProduct.productId),
    true,
  );
});

test("ALL and ANY audience conditions are supported", () => {
  const campaign = createDefaultCampaign("CART_PAGE");
  campaign.enabled = true;
  campaign.conditions = [
    {
      id: "subtotal",
      field: "CART_SUBTOTAL",
      operator: "GREATER_OR_EQUAL",
      value: 100,
    },
    {
      id: "tag",
      field: "CART_TAG",
      operator: "CONTAINS",
      value: "summer",
    },
  ];

  const cart = { productIds: ["shirt"], subtotal: 40, itemCount: 1 };
  assert.equal(matchesCampaignConditions(campaign, cart, products), false);
  campaign.conditionMode = "ANY";
  assert.equal(matchesCampaignConditions(campaign, cart, products), true);
});
