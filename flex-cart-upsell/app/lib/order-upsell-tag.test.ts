import assert from "node:assert/strict";
import test from "node:test";

import {
  orderContainsUpsellLine,
  orderGraphqlIdFromWebhook,
} from "./order-upsell-tag.ts";

test("detects an upsell line from Shopify order property arrays", () => {
  assert.equal(
    orderContainsUpsellLine({
      line_items: [
        {
          properties: [
            { name: "_flex_upsell_campaign", value: "PRODUCT_PAGE" },
          ],
        },
      ],
    }),
    true,
  );
});

test("detects an upsell line from object-shaped properties", () => {
  assert.equal(
    orderContainsUpsellLine({
      line_items: [
        {
          properties: { _flex_upsell_campaign: "cart_drawer" },
        },
      ],
    }),
    true,
  );
});

test("ignores normal lines and invalid marker values", () => {
  assert.equal(
    orderContainsUpsellLine({
      line_items: [
        { properties: null },
        {
          properties: [
            { name: "_flex_upsell_campaign", value: "not-an-upsell" },
          ],
        },
      ],
    }),
    false,
  );
});

test("extracts the Shopify order GraphQL ID", () => {
  assert.equal(
    orderGraphqlIdFromWebhook({
      admin_graphql_api_id: "gid://shopify/Order/123456789",
      id: 987,
    }),
    "gid://shopify/Order/123456789",
  );
  assert.equal(
    orderGraphqlIdFromWebhook({ id: "987654321" }),
    "gid://shopify/Order/987654321",
  );
  assert.equal(orderGraphqlIdFromWebhook({ id: "invalid" }), null);
});
