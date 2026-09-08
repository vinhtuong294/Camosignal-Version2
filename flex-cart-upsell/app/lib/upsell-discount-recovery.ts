import type { Placement } from "./recommendation-types";

export type DiscountFunctionReference = {
  appKey: string;
  handle: string;
  id: string;
};

export type AutomaticAppDiscountReference = {
  appKey: string;
  configurationValue: string | null;
  discountId: string;
  functionId: string;
  title: string;
};

export type DiscountUserError = {
  field?: readonly string[] | null;
  message: string;
};

function quoteShopifySearchValue(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function automaticAppDiscountSearchQuery(title: string) {
  return `method:automatic type:app title:${quoteShopifySearchValue(title)}`;
}

function campaignKey(configurationValue: string | null) {
  if (!configurationValue) return null;

  try {
    const configuration = JSON.parse(configurationValue) as unknown;
    if (
      typeof configuration === "object" &&
      configuration !== null &&
      "campaignKey" in configuration &&
      typeof configuration.campaignKey === "string"
    ) {
      return configuration.campaignKey;
    }
  } catch {
    // A malformed or unrelated metafield must never be adopted.
  }

  return null;
}

export function findOwnedAutomaticAppDiscountId({
  candidates,
  functions,
  functionHandle,
  placement,
  title,
}: {
  candidates: readonly AutomaticAppDiscountReference[];
  functions: readonly DiscountFunctionReference[];
  functionHandle: string;
  placement: Placement;
  title: string;
}) {
  const matchingFunctions = functions.filter(
    (shopifyFunction) => shopifyFunction.handle === functionHandle,
  );

  if (matchingFunctions.length === 0) return null;
  if (matchingFunctions.length > 1) {
    throw new Error(
      `Shopify returned multiple functions with handle ${functionHandle}; refusing to adopt a discount.`,
    );
  }

  const [shopifyFunction] = matchingFunctions;
  const matches = candidates.filter(
    (candidate) =>
      candidate.title === title &&
      campaignKey(candidate.configurationValue) === placement &&
      candidate.appKey === shopifyFunction.appKey &&
      candidate.functionId === shopifyFunction.id,
  );
  const discountIds = [
    ...new Set(matches.map((candidate) => candidate.discountId)),
  ];

  if (discountIds.length > 1) {
    throw new Error(
      `Shopify returned multiple owned automatic discounts titled ${title}; refusing to adopt one.`,
    );
  }

  return discountIds[0] ?? null;
}

export function isDuplicateDiscountTitleError(
  userErrors: readonly DiscountUserError[],
) {
  return userErrors.some((error) => {
    const message = error.message.toLowerCase();
    const titleField = error.field?.some(
      (field) => field.toLowerCase() === "title",
    );

    return (
      message.includes("title must be unique") ||
      (titleField &&
        (message.includes("must be unique") ||
          message.includes("already exists") ||
          message.includes("already been taken")))
    );
  });
}
