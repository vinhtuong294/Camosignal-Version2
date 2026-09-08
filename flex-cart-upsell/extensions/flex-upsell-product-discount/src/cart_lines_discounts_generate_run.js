const DiscountClass = { Product: "PRODUCT" };
const ProductDiscountSelectionStrategy = { First: "FIRST" };

/**
 * Applies a campaign discount only to cart lines marked by the storefront
 * with the matching _flex_upsell_campaign attribute.
 */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes(DiscountClass.Product)) {
    return { operations: [] };
  }

  const rawConfiguration = input.discount.metafield?.value;
  if (!rawConfiguration) return { operations: [] };

  let configuration;
  try {
    configuration = JSON.parse(rawConfiguration);
  } catch {
    return { operations: [] };
  }

  const value = Number(configuration.value);
  const campaignKey = configuration.campaignKey;
  if (
    !campaignKey ||
    !Number.isFinite(value) ||
    value <= 0 ||
    !["PERCENTAGE", "FIXED_AMOUNT"].includes(configuration.discountType)
  ) {
    return { operations: [] };
  }

  const eligibleLines = input.cart.lines.filter(
    (line) => line.attribute?.value === campaignKey,
  );
  if (!eligibleLines.length) return { operations: [] };

  const valueDefinition =
    configuration.discountType === "PERCENTAGE"
      ? { percentage: { value: Math.min(value, 100) } }
      : { fixedAmount: { amount: value, appliesToEachItem: true } };

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: eligibleLines.map((line) => ({
            message: configuration.message?.trim() || "Upsell offer",
            targets: [{ cartLine: { id: line.id, quantity: line.quantity } }],
            value: valueDefinition,
          })),
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
