import type {
  CampaignDraft,
  Placement,
  RecommendationStrategy,
} from "./recommendation-types";

export const STRATEGY_OPTIONS: Array<{
  value: RecommendationStrategy;
  label: string;
  description: string;
  badge?: string;
}> = [
  {
    value: "SMART_WEIGHTED",
    label: "Smart weighted mix",
    description:
      "Scores collection, tags, product type, vendor, popularity, recency, and price.",
    badge: "Recommended",
  },
  {
    value: "MANUAL",
    label: "Manually selected products",
    description: "Choose and prioritize the exact products you want to offer.",
  },
  {
    value: "COMPLEMENTARY",
    label: "Complementary products",
    description:
      "Pair accessories or products that are frequently bought together.",
  },
  {
    value: "SAME_COLLECTION",
    label: "Same collection",
    description: "Prioritize products from the same collections as cart items.",
  },
  {
    value: "SAME_TAGS",
    label: "Same tags",
    description: "Match products that share your store's merchandising tags.",
  },
  {
    value: "SAME_PRODUCT_TYPE",
    label: "Same product type",
    description: "Recommend related products from the same product type.",
  },
  {
    value: "SAME_VENDOR",
    label: "Same vendor",
    description: "Keep recommendations within the same brand or creator.",
  },
  {
    value: "BEST_SELLERS",
    label: "Best sellers",
    description:
      "Prioritize products with the strongest app conversion signals.",
  },
  {
    value: "NEW_ARRIVALS",
    label: "New arrivals",
    description: "Prioritize the newest published products in your catalogue.",
  },
  {
    value: "PRICE_AFFINITY",
    label: "Price affinity",
    description: "Match products close to the cart's average item price.",
  },
  {
    value: "RULE_BASED_MIX",
    label: "Custom weighted mix",
    description: "Set the influence of each recommendation signal yourself.",
  },
];

export function createDefaultCampaign(placement: Placement): CampaignDraft {
  const isDrawer = placement === "CART_DRAWER";
  const isProductPage = placement === "PRODUCT_PAGE";

  return {
    name: isProductPage
      ? "Product page upsell"
      : isDrawer
        ? "Cart drawer upsell"
        : "Cart page upsell",
    placement,
    enabled: false,
    strategy: "SMART_WEIGHTED",
    strategyConfig: {
      manualProductIds: [],
      complementaryByProductId: {},
      weights: {
        collection: 42,
        tag: 24,
        productType: 18,
        vendor: 8,
        popularity: 18,
        recency: 8,
        priceAffinity: 14,
      },
      fallbackStrategy: "BEST_SELLERS",
    },
    conditionMode: "ALL",
    conditions: [],
    filters: {
      onlyAvailable: true,
      excludeCartProducts: true,
      excludeTriggerProducts: true,
      excludeGiftCards: true,
      includeProductIds: [],
      excludeProductIds: [],
      includeCollections: [],
      excludeCollections: [],
      includeTags: [],
      excludeTags: [],
      includeVendors: [],
      excludeVendors: [],
      includeProductTypes: [],
      excludeProductTypes: [],
      maxProducts: isDrawer || isProductPage ? 3 : 4,
      maxPerVendor: isDrawer || isProductPage ? 3 : 2,
    },
    appearance: {
      stylePreset: "CAMOSIGNAL",
      heading: isDrawer
        ? "You might also like these"
        : isProductPage
          ? "People also bought"
          : "Complete your order",
      subheading: "",
      layout: isDrawer ? "CAROUSEL" : isProductPage ? "STACKED" : "GRID",
      imageRatio: "PORTRAIT",
      showVendor: false,
      showComparePrice: true,
      showVariantPicker: true,
      showQuickAdd: true,
      cardBackground: "#ffffff",
      cardBorder: "#dce2dd",
      textColor: "#18251f",
      mutedTextColor: "#6d766f",
      buttonBackground: "#294237",
      buttonTextColor: "#ffffff",
      accentColor: "#c84436",
      borderRadius: 12,
      imageRadius: 8,
      spacing: 10,
      buttonLabel: "Add",
      customCss: "",
    },
    discount: {
      type: "NONE",
      value: 0,
      message: "Upsell offer",
    },
  };
}
