export const UPSELL_EXCLUDE_TAG = "flex-upsell:exclude";
export const UPSELL_CUSTOMIZE_TAG = "flex-upsell:customize";
export const CAMOSIGNAL_COMBO_TAG = "combo-builder";

type ProductEligibilityInput = {
  tags?: string[];
  customizationEnabled?: { value?: string | null } | null;
};

function normalized(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function customizationIsRequired(
  customizationEnabled: ProductEligibilityInput["customizationEnabled"],
) {
  return ["true", "1", "yes", "on"].includes(
    normalized(customizationEnabled?.value),
  );
}

export function isExcludedFromUpsell(product: ProductEligibilityInput) {
  return (product.tags ?? []).some(
    (tag) => normalized(tag) === UPSELL_EXCLUDE_TAG,
  );
}

export function productRequiresCustomization(product: ProductEligibilityInput) {
  return (
    customizationIsRequired(product.customizationEnabled) ||
    (product.tags ?? []).some(
      (tag) =>
        normalized(tag) === UPSELL_CUSTOMIZE_TAG ||
        normalized(tag) === CAMOSIGNAL_COMBO_TAG,
    )
  );
}

export function withCustomizationMarker(
  tags: string[],
  customizationEnabled: ProductEligibilityInput["customizationEnabled"],
) {
  if (!customizationIsRequired(customizationEnabled)) return tags;
  if (productRequiresCustomization({ tags })) return tags;
  return [...tags, UPSELL_CUSTOMIZE_TAG];
}
