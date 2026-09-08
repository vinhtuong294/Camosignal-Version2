export const UPSELL_LINE_PROPERTY = "_flex_upsell_campaign";
export const UPSELL_ORDER_TAG = "upsell";

const UPSELL_PLACEMENTS = new Set([
  "PRODUCT_PAGE",
  "CART_DRAWER",
  "CART_PAGE",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUpsellPlacement(value: unknown) {
  return (
    typeof value === "string" && UPSELL_PLACEMENTS.has(value.trim().toUpperCase())
  );
}

function propertiesContainUpsellMarker(properties: unknown) {
  if (Array.isArray(properties)) {
    return properties.some((property) => {
      if (!isRecord(property)) return false;
      const name = property.name ?? property.key;
      return name === UPSELL_LINE_PROPERTY && isUpsellPlacement(property.value);
    });
  }

  return (
    isRecord(properties) &&
    isUpsellPlacement(properties[UPSELL_LINE_PROPERTY])
  );
}

export function orderContainsUpsellLine(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.line_items)) return false;

  return payload.line_items.some(
    (lineItem) =>
      isRecord(lineItem) &&
      propertiesContainUpsellMarker(lineItem.properties),
  );
}

export function orderGraphqlIdFromWebhook(payload: unknown) {
  if (!isRecord(payload)) return null;

  if (
    typeof payload.admin_graphql_api_id === "string" &&
    /^gid:\/\/shopify\/Order\/\d+$/.test(payload.admin_graphql_api_id)
  ) {
    return payload.admin_graphql_api_id;
  }

  if (
    (typeof payload.id === "string" || typeof payload.id === "number") &&
    /^\d+$/.test(String(payload.id))
  ) {
    return `gid://shopify/Order/${String(payload.id)}`;
  }

  return null;
}
