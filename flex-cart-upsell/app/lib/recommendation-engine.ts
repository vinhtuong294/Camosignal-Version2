import type {
  CampaignCondition,
  CampaignDraft,
  CartContext,
  ProductCandidate,
  RankedRecommendation,
  RecommendationFilters,
  RecommendationStrategy,
  StrategyWeights,
} from "./recommendation-types";
import {
  isExcludedFromUpsell,
  productRequiresCustomization,
} from "./product-eligibility.ts";

const DAY_MS = 86_400_000;

function normalizedSet(values: string[]) {
  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function intersects(left: string[], right: Set<string>) {
  return left.some((value) => right.has(value.toLowerCase()));
}

function matchesListFilter(
  productValues: string[],
  includeValues: string[],
  excludeValues: string[],
) {
  const includes = normalizedSet(includeValues);
  const excludes = normalizedSet(excludeValues);
  const normalizedProductValues = productValues.map((value) => value.toLowerCase());

  if (includes.size > 0 && !intersects(normalizedProductValues, includes)) {
    return false;
  }

  return !intersects(normalizedProductValues, excludes);
}

function passesFilters(
  product: ProductCandidate,
  filters: RecommendationFilters,
  cartProductIds: Set<string>,
  triggerProductIds: Set<string>,
) {
  if (!product.publishedAt) return false;
  if (isExcludedFromUpsell(product)) return false;
  if (filters.onlyAvailable && !product.inventoryAvailable) return false;
  if (filters.excludeCartProducts && cartProductIds.has(product.productId)) return false;
  if (filters.excludeTriggerProducts && triggerProductIds.has(product.productId)) {
    return false;
  }
  if (filters.excludeGiftCards && product.productType.toLowerCase() === "gift card") {
    return false;
  }

  const includedProducts = new Set(filters.includeProductIds);
  const excludedProducts = new Set(filters.excludeProductIds);
  if (includedProducts.size > 0 && !includedProducts.has(product.productId)) return false;
  if (excludedProducts.has(product.productId)) return false;
  if (filters.minPrice !== undefined && product.priceMin < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && product.priceMin > filters.maxPrice) return false;

  return (
    matchesListFilter(
      product.collections,
      filters.includeCollections,
      filters.excludeCollections,
    ) &&
    matchesListFilter(product.tags, filters.includeTags, filters.excludeTags) &&
    matchesListFilter(
      [product.vendor],
      filters.includeVendors,
      filters.excludeVendors,
    ) &&
    matchesListFilter(
      [product.productType],
      filters.includeProductTypes,
      filters.excludeProductTypes,
    )
  );
}

function numericComparison(
  actual: number,
  operator: CampaignCondition["operator"],
  expected: number,
) {
  if (operator === "GREATER_OR_EQUAL") return actual >= expected;
  if (operator === "LESS_OR_EQUAL") return actual <= expected;
  if (operator === "NOT_EQUALS") return actual !== expected;
  return actual === expected;
}

function listComparison(
  actual: string[],
  operator: CampaignCondition["operator"],
  expected: string,
) {
  const expectedValue = expected.toLowerCase();
  const hasValue = actual.some((value) => value.toLowerCase() === expectedValue);
  return operator === "NOT_CONTAINS" || operator === "NOT_EQUALS"
    ? !hasValue
    : hasValue;
}

function matchesCondition(
  condition: CampaignCondition,
  cart: CartContext,
  cartProducts: ProductCandidate[],
) {
  if (condition.field === "CART_SUBTOTAL") {
    return numericComparison(cart.subtotal, condition.operator, Number(condition.value));
  }
  if (condition.field === "CART_ITEM_COUNT") {
    return numericComparison(cart.itemCount, condition.operator, Number(condition.value));
  }

  const productValues = {
    CART_PRODUCT: cart.productIds,
    CART_COLLECTION: cartProducts.flatMap((product) => product.collections),
    CART_TAG: cartProducts.flatMap((product) => product.tags),
    CART_VENDOR: cartProducts.map((product) => product.vendor),
    CART_PRODUCT_TYPE: cartProducts.map((product) => product.productType),
  }[condition.field];

  return listComparison(productValues, condition.operator, String(condition.value));
}

export function matchesCampaignConditions(
  campaign: CampaignDraft,
  cart: CartContext,
  catalogue: ProductCandidate[],
) {
  if (!campaign.enabled) return false;
  if (campaign.conditions.length === 0) return true;

  const cartIds = new Set(cart.productIds);
  const cartProducts = catalogue.filter((product) => cartIds.has(product.productId));
  const results = campaign.conditions.map((condition) =>
    matchesCondition(condition, cart, cartProducts),
  );

  return campaign.conditionMode === "ANY"
    ? results.some(Boolean)
    : results.every(Boolean);
}

function addScore(
  scores: Map<string, RankedRecommendation>,
  product: ProductCandidate,
  points: number,
  reason: string,
) {
  if (points <= 0) return;
  const current = scores.get(product.productId) ?? {
    product,
    score: 0,
    reasons: [],
  };
  current.score += points;
  if (!current.reasons.includes(reason)) current.reasons.push(reason);
  scores.set(product.productId, current);
}

function overlapCount(left: string[], right: Set<string>) {
  return left.reduce(
    (total, value) => total + (right.has(value.toLowerCase()) ? 1 : 0),
    0,
  );
}

function scoreSignals(
  product: ProductCandidate,
  cartProducts: ProductCandidate[],
  cart: CartContext,
  weights: StrategyWeights,
) {
  const collections = normalizedSet(
    cartProducts.flatMap((item) => item.collections),
  );
  const tags = normalizedSet(cartProducts.flatMap((item) => item.tags));
  const productTypes = normalizedSet(cartProducts.map((item) => item.productType));
  const vendors = normalizedSet(cartProducts.map((item) => item.vendor));
  const reasons: Array<[number, string]> = [];

  const collectionOverlap = overlapCount(product.collections, collections);
  if (collectionOverlap > 0) {
    reasons.push([weights.collection * Math.min(collectionOverlap, 2), "Cùng collection"]);
  }

  const tagOverlap = overlapCount(product.tags, tags);
  if (tagOverlap > 0) {
    reasons.push([weights.tag * Math.min(tagOverlap, 3), "Cùng tag"]);
  }

  if (productTypes.has(product.productType.toLowerCase())) {
    reasons.push([weights.productType, "Cùng lo?i s?n ph?m"]);
  }
  if (vendors.has(product.vendor.toLowerCase())) {
    reasons.push([weights.vendor, "Cùng vendor"]);
  }

  reasons.push([
    weights.popularity * Math.min(Math.max(product.popularityScore, 0), 1),
    "Dang bán t?t",
  ]);

  if (product.publishedAt) {
    const ageInDays = Math.max(
      0,
      (Date.now() - new Date(product.publishedAt).getTime()) / DAY_MS,
    );
    reasons.push([
      weights.recency * Math.max(0, 1 - ageInDays / 180),
      "S?n ph?m m?i",
    ]);
  }

  const averageCartPrice =
    cart.itemCount > 0 ? cart.subtotal / cart.itemCount : product.priceMin;
  const priceDistance =
    averageCartPrice > 0
      ? Math.abs(product.priceMin - averageCartPrice) / averageCartPrice
      : 0;
  reasons.push([
    weights.priceAffinity * Math.max(0, 1 - priceDistance),
    "Kho?ng giá phù h?p",
  ]);

  return reasons;
}

function weightsForStrategy(
  strategy: RecommendationStrategy,
  configured: StrategyWeights,
): StrategyWeights {
  const zero: StrategyWeights = {
    collection: 0,
    tag: 0,
    productType: 0,
    vendor: 0,
    popularity: 0,
    recency: 0,
    priceAffinity: 0,
  };

  const singleSignal: Partial<Record<RecommendationStrategy, keyof StrategyWeights>> = {
    SAME_COLLECTION: "collection",
    SAME_TAGS: "tag",
    SAME_PRODUCT_TYPE: "productType",
    SAME_VENDOR: "vendor",
    BEST_SELLERS: "popularity",
    NEW_ARRIVALS: "recency",
    PRICE_AFFINITY: "priceAffinity",
  };

  const key = singleSignal[strategy];
  if (key) return { ...zero, [key]: 100 };
  if (strategy === "RULE_BASED_MIX" || strategy === "SMART_WEIGHTED") {
    return configured;
  }
  return zero;
}

function hasDirectMerchandisingMatch(
  product: ProductCandidate,
  cartProducts: ProductCandidate[],
) {
  if (cartProducts.length === 0) return false;
  const collections = normalizedSet(
    cartProducts.flatMap((item) => item.collections),
  );
  const tags = normalizedSet(cartProducts.flatMap((item) => item.tags));
  const productTypes = normalizedSet(cartProducts.map((item) => item.productType));
  const vendors = normalizedSet(cartProducts.map((item) => item.vendor));

  return (
    intersects(product.collections, collections) ||
    intersects(product.tags, tags) ||
    productTypes.has(product.productType.toLowerCase()) ||
    vendors.has(product.vendor.toLowerCase())
  );
}
function applyDiversity(
  ranked: RankedRecommendation[],
  maximum: number,
  maxPerVendor: number,
) {
  const vendorCounts = new Map<string, number>();
  const selected: RankedRecommendation[] = [];

  for (const recommendation of ranked) {
    const vendorKey = recommendation.product.vendor.toLowerCase();
    const count = vendorCounts.get(vendorKey) ?? 0;
    if (maxPerVendor > 0 && count >= maxPerVendor) continue;
    selected.push(recommendation);
    vendorCounts.set(vendorKey, count + 1);
    if (selected.length >= maximum) break;
  }

  return selected;
}

function rankWithStrategy(
  strategy: RecommendationStrategy,
  campaign: CampaignDraft,
  cart: CartContext,
  cartProducts: ProductCandidate[],
  candidates: ProductCandidate[],
) {
  const scores = new Map<string, RankedRecommendation>();
  const manualOrder = new Map(
    campaign.strategyConfig.manualProductIds.map((id, index) => [id, index]),
  );
  const complementaryIds = new Set(
    cart.productIds.flatMap(
      (productId) =>
        campaign.strategyConfig.complementaryByProductId[productId] ?? [],
    ),
  );
  const weights = weightsForStrategy(strategy, campaign.strategyConfig.weights);
  const directlyRelated =
    strategy === "SMART_WEIGHTED"
      ? candidates.filter((product) =>
          hasDirectMerchandisingMatch(product, cartProducts),
        )
      : [];
  const productsToRank = directlyRelated.length ? directlyRelated : candidates;

  for (const product of productsToRank) {
    if (strategy === "MANUAL" && manualOrder.has(product.productId)) {
      addScore(
        scores,
        product,
        10_000 - (manualOrder.get(product.productId) ?? 0),
        "Du?c ch?n th? công",
      );
      continue;
    }
    if (strategy === "COMPLEMENTARY" && complementaryIds.has(product.productId)) {
      addScore(scores, product, 10_000, "S?n ph?m b? tr?");
      continue;
    }

    for (const [points, reason] of scoreSignals(
      product,
      cartProducts,
      cart,
      weights,
    )) {
      addScore(scores, product, points, reason);
    }
  }

  return [...scores.values()].sort(
    (left, right) =>
      right.score - left.score ||
      right.product.popularityScore - left.product.popularityScore ||
      left.product.title.localeCompare(right.product.title),
  );
}

export function recommendProducts(
  campaign: CampaignDraft,
  cart: CartContext,
  catalogue: ProductCandidate[],
): RankedRecommendation[] {
  if (!matchesCampaignConditions(campaign, cart, catalogue)) return [];

  const cartProductIds = new Set(cart.productIds);
  const triggerProductIds = new Set(cart.productIds);
  const cartProducts = catalogue.filter((product) =>
    cartProductIds.has(product.productId),
  );
  const candidates = catalogue.filter(
    (product) =>
      (campaign.placement !== "CART_DRAWER" ||
        !productRequiresCustomization(product)) &&
      passesFilters(
        product,
        campaign.filters,
        cartProductIds,
        triggerProductIds,
      ),
  );

  let ranked = rankWithStrategy(
    campaign.strategy,
    campaign,
    cart,
    cartProducts,
    candidates,
  );

  if (ranked.length === 0 && campaign.strategyConfig.fallbackStrategy) {
    ranked = rankWithStrategy(
      campaign.strategyConfig.fallbackStrategy,
      campaign,
      cart,
      cartProducts,
      candidates,
    );
  }

  return applyDiversity(
    ranked,
    Math.max(1, campaign.filters.maxProducts),
    campaign.filters.maxPerVendor,
  );
}
