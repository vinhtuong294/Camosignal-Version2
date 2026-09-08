export type Placement = "PRODUCT_PAGE" | "CART_DRAWER" | "CART_PAGE";

export type RecommendationStrategy =
  | "MANUAL"
  | "COMPLEMENTARY"
  | "SAME_COLLECTION"
  | "SAME_TAGS"
  | "SAME_PRODUCT_TYPE"
  | "SAME_VENDOR"
  | "BEST_SELLERS"
  | "NEW_ARRIVALS"
  | "PRICE_AFFINITY"
  | "RULE_BASED_MIX"
  | "SMART_WEIGHTED";

export type ConditionField =
  | "CART_SUBTOTAL"
  | "CART_ITEM_COUNT"
  | "CART_PRODUCT"
  | "CART_COLLECTION"
  | "CART_TAG"
  | "CART_VENDOR"
  | "CART_PRODUCT_TYPE";

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "GREATER_OR_EQUAL"
  | "LESS_OR_EQUAL";

export interface CampaignCondition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string | number;
}

export interface RecommendationFilters {
  onlyAvailable: boolean;
  excludeCartProducts: boolean;
  excludeTriggerProducts: boolean;
  excludeGiftCards: boolean;
  includeProductIds: string[];
  excludeProductIds: string[];
  includeCollections: string[];
  excludeCollections: string[];
  includeTags: string[];
  excludeTags: string[];
  includeVendors: string[];
  excludeVendors: string[];
  includeProductTypes: string[];
  excludeProductTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  maxProducts: number;
  maxPerVendor: number;
}

export interface StrategyWeights {
  collection: number;
  tag: number;
  productType: number;
  vendor: number;
  popularity: number;
  recency: number;
  priceAffinity: number;
}

export interface RecommendationStrategyConfig {
  manualProductIds: string[];
  complementaryByProductId: Record<string, string[]>;
  weights: StrategyWeights;
  fallbackStrategy: RecommendationStrategy;
}

export interface AppearanceSettings {
  stylePreset: "CAMOSIGNAL" | "COMPLETE_THE_LOOK" | "CLASSIC";
  heading: string;
  subheading: string;
  layout: "STACKED" | "GRID" | "CAROUSEL";
  imageRatio: "SQUARE" | "PORTRAIT" | "LANDSCAPE";
  showVendor: boolean;
  showComparePrice: boolean;
  showVariantPicker: boolean;
  showQuickAdd: boolean;
  cardBackground: string;
  cardBorder: string;
  textColor: string;
  mutedTextColor: string;
  buttonBackground: string;
  buttonTextColor: string;
  accentColor: string;
  borderRadius: number;
  imageRadius: number;
  spacing: number;
  buttonLabel: string;
  customCss: string;
}

export type UpsellDiscountType = "NONE" | "PERCENTAGE" | "FIXED_AMOUNT";

export interface UpsellDiscountSettings {
  type: UpsellDiscountType;
  value: number;
  message: string;
}

export interface CampaignDraft {
  name: string;
  placement: Placement;
  enabled: boolean;
  strategy: RecommendationStrategy;
  strategyConfig: RecommendationStrategyConfig;
  conditionMode: "ALL" | "ANY";
  conditions: CampaignCondition[];
  filters: RecommendationFilters;
  appearance: AppearanceSettings;
  discount: UpsellDiscountSettings;
}

export interface ProductCandidate {
  productId: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  collections: string[];
  imageUrl?: string;
  priceMin: number;
  priceMax: number;
  inventoryAvailable: boolean;
  publishedAt?: string;
  popularityScore: number;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    available: boolean;
    selectedOptions?: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

export interface CartContext {
  productIds: string[];
  subtotal: number;
  itemCount: number;
}

export interface RankedRecommendation {
  product: ProductCandidate;
  score: number;
  reasons: string[];
}
