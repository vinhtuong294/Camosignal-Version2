import type { ListingImage, LarkListingRow, ShopifyTemplateCandidate } from "./listing-types";

const COLORLESS_PRODUCT_TYPES = new Set([
  "upf hoodie",
  "upf hoodies",
  "fleece hoodie",
  "fleece hoodies",
  "waterproof jacket",
  "waterproof jackets",
]);

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function dedupeLabels(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalizeText(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isColorlessProductType(productType: string) {
  const normalized = normalizeText(productType);
  return COLORLESS_PRODUCT_TYPES.has(normalized) || (normalized.includes("upf hoodie") && normalized.includes("face mask"));
}

export function effectiveColors(row: Pick<LarkListingRow, "colors" | "mainColor" | "productType">) {
  if (isColorlessProductType(row.productType)) return [];
  // Main Color drives both the first Shopify option value and the first media group. Remaining colors keep their original Lark order.
  return dedupeLabels([row.mainColor ?? "", ...(row.colors ?? [])]);
}

export function colorForFilename(filename: string, colors: string[]) {
  const normalizedFilename = normalizeText(filename);
  const matches = colors
    .filter((color) => normalizedFilename.includes(normalizeText(color)))
    .sort((left, right) => normalizeText(right).length - normalizeText(left).length);
  return matches[0] ?? null;
}

/**
 * Keeps the storefront's featured image aligned with the product's Main Color.
 * Extra images for that color stay together, then the remaining colors with
 * more imagery appear before single-image colors. This mirrors the manual
 * drag-and-drop merchandising order used by Camo Signal.
 */
export function orderListingImages(images: ListingImage[], row: Pick<LarkListingRow, "colors" | "mainColor" | "productType">) {
  if (normalizeText(row.productType) === "waterproof jacket") {
    // The approved jacket template merchandises the gallery as:
    // main, detail 4, lifestyle 5, lifestyle 6, detail 3, back 2.
    // Extra supplied images are kept after that approved six-image sequence.
    const priority = new Map([[0, 0], [3, 1], [4, 2], [5, 3], [2, 4], [1, 5]]);
    return images
      .map((image, index) => ({ image, index }))
      .sort((left, right) => (priority.get(left.index) ?? left.index + 6) - (priority.get(right.index) ?? right.index + 6))
      .map(({ image }) => image);
  }
  if (!row.mainColor || isColorlessProductType(row.productType)) return images;

  const mainColor = normalizeText(row.mainColor);
  const colors = effectiveColors(row);
  const colorOrder = new Map(colors.map((color, index) => [normalizeText(color), index]));
  const imageCount = new Map<string, number>();
  images.forEach((image) => {
    const color = normalizeText(image.color);
    if (color) imageCount.set(color, (imageCount.get(color) ?? 0) + 1);
  });

  return images
    .map((image, originalIndex) => ({ image, originalIndex, color: normalizeText(image.color) }))
    .sort((left, right) => {
      const leftIsMain = left.color === mainColor;
      const rightIsMain = right.color === mainColor;
      if (leftIsMain !== rightIsMain) return leftIsMain ? -1 : 1;
      if (left.color === right.color) return left.originalIndex - right.originalIndex;
      if (!left.color || !right.color) return left.color ? -1 : right.color ? 1 : left.originalIndex - right.originalIndex;

      const countDifference = (imageCount.get(right.color) ?? 0) - (imageCount.get(left.color) ?? 0);
      if (countDifference) return countDifference;
      return (colorOrder.get(left.color) ?? Number.MAX_SAFE_INTEGER) - (colorOrder.get(right.color) ?? Number.MAX_SAFE_INTEGER);
    })
    .map(({ image }) => image);
}

export function randomSoldCountBase(random: () => number = Math.random) {
  return 50 + Math.floor(random() * 21);
}


const DASH_OR_SPACE = "[\\s\\-\\u2010-\\u2015]";
const PRODUCT_TYPE_SUFFIX = new RegExp(
  `(?:\\s*[-\\u2013\\u2014:|]?\\s*)(?:water${DASH_OR_SPACE}?resistant jacket|waterproof jacket|fleece hoodie|layering series|t${DASH_OR_SPACE}?shirt|hoodie|sweatshirt|long${DASH_OR_SPACE}?sleeve)\\s*$`,
  "i",
);

export function designNameFromProductTitle(title: string) {
  let designName = title.trim();
  while (/^\s*\d+\s*[./-]\s*/.test(designName)) designName = designName.replace(/^\s*\d+\s*[./-]\s*/, "").trim();
  while (PRODUCT_TYPE_SUFFIX.test(designName)) designName = designName.replace(PRODUCT_TYPE_SUFFIX, "").trim();
  return designName;
}

export function designTagForProductTitle(title: string) {
  const designName = designNameFromProductTitle(title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return designName ? `design:${designName}` : null;
}
export function collectionKeywords(row: Pick<LarkListingRow, "designId" | "title" | "productType" | "weeklyDesignPlan" | "collectionNames">) {
  let source = normalizeText(
    [row.designId, row.title, row.productType, row.weeklyDesignPlan, ...row.collectionNames].filter(Boolean).join(" "),
  );
  if (source.includes("jesus") || source.includes("christian") || source.includes("lord") || source.includes("thanks") || source.includes("blessed harvest")) source += " faith";
  if (source.includes("hunter") || source.includes("bowhunter") || source.includes("bowhunting") || source.includes("one breath") || source.includes("runs deep") || source.includes("death from above") || source.includes("shoot more suck less") || source.includes("silent death")) source += " deer";
  const keywords = [
    "turkey",
    "deer",
    "saltwater",
    "freshwater",
    "fishing",
    "national park",
    "game day",
    "spooky",
    "faith",
    "jesus",
    "christian",
    "hunter",
    "bowhunter",
  ];
  if (source.includes("jesus") || source.includes("christian") || source.includes("faith") || source.includes("lord") || source.includes("blessed harvest")) keywords.push("faith");
  if (source.includes("hunter") || source.includes("bowhunter") || source.includes("bowhunting") || source.includes("one breath") || source.includes("runs deep") || source.includes("death from above") || source.includes("shoot more suck less") || source.includes("silent death")) keywords.push("deer");
  return keywords.filter((keyword) => source.includes(keyword));
}

export function scoreTemplate(
  row: Pick<LarkListingRow, "productType" | "title" | "designId">,
  candidate: Pick<ShopifyTemplateCandidate, "title" | "productType" | "optionNames" | "variantCount">,
) {
  let score = 0;
  const reasons: string[] = [];
  const targetType = normalizeText(row.productType);
  const productType = normalizeText(candidate.productType);
  const targetTitle = normalizeText(row.title);
  const title = normalizeText(candidate.title);

  if (targetType && targetType === productType) {
    score += 60;
    reasons.push("same product type");
  } else if (targetType && (productType.includes(targetType) || targetType.includes(productType))) {
    score += 35;
    reasons.push("similar product type");
  }
  if (targetTitle && title.includes(targetTitle)) {
    score += 20;
    reasons.push("title overlap");
  }
  if (candidate.optionNames.some((name) => normalizeText(name) === "color")) {
    score += 8;
    reasons.push("has color variants");
  }
  if (candidate.variantCount > 1) score += 2;

  return { score, reasons };
}

export function templateNeedsColorOption(optionNames: string[]) {
  return optionNames.some((name) => normalizeText(name) === "color");
}
