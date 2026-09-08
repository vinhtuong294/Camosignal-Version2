import assert from "node:assert/strict";
import test from "node:test";

import {
  automaticAppDiscountSearchQuery,
  findOwnedAutomaticAppDiscountId,
  isDuplicateDiscountTitleError,
  type AutomaticAppDiscountReference,
  type DiscountFunctionReference,
} from "./upsell-discount-recovery.ts";

const functionHandle = "flex-upsell-product-discount";
const title = "Cart drawer upsell - Upsell discount";
const functions: DiscountFunctionReference[] = [
  {
    appKey: "current-app",
    handle: functionHandle,
    id: "function-1",
  },
];

function candidate(
  overrides: Partial<AutomaticAppDiscountReference> = {},
): AutomaticAppDiscountReference {
  return {
    appKey: "current-app",
    configurationValue: JSON.stringify({ campaignKey: "CART_DRAWER" }),
    discountId: "gid://shopify/DiscountAutomaticNode/1",
    functionId: "function-1",
    title,
    ...overrides,
  };
}

test("discount lookup safely quotes Shopify search values", () => {
  assert.equal(
    automaticAppDiscountSearchQuery('Cart \\ "drawer"'),
    'method:automatic type:app title:"Cart \\\\ \\"drawer\\""',
  );
});

test("adopts only an exact title, placement, app, and function match", () => {
  assert.equal(
    findOwnedAutomaticAppDiscountId({
      candidates: [
        candidate({ appKey: "another-app", discountId: "foreign-app" }),
        candidate({ functionId: "function-2", discountId: "wrong-function" }),
        candidate({
          configurationValue: JSON.stringify({ campaignKey: "PRODUCT_PAGE" }),
          discountId: "wrong-placement",
        }),
        candidate({ title: title.toUpperCase(), discountId: "wrong-title" }),
        candidate(),
      ],
      functions,
      functionHandle,
      placement: "CART_DRAWER",
      title,
    }),
    "gid://shopify/DiscountAutomaticNode/1",
  );
});

test("does not adopt malformed or missing campaign configuration", () => {
  assert.equal(
    findOwnedAutomaticAppDiscountId({
      candidates: [
        candidate({ configurationValue: null }),
        candidate({ configurationValue: "not-json" }),
      ],
      functions,
      functionHandle,
      placement: "CART_DRAWER",
      title,
    }),
    null,
  );
});

test("refuses to choose between multiple owned matching discounts", () => {
  assert.throws(
    () =>
      findOwnedAutomaticAppDiscountId({
        candidates: [candidate(), candidate({ discountId: "second" })],
        functions,
        functionHandle,
        placement: "CART_DRAWER",
        title,
      }),
    /multiple owned automatic discounts/i,
  );
});

test("recognizes duplicate-title create errors without matching unrelated errors", () => {
  assert.equal(
    isDuplicateDiscountTitleError([
      { field: ["automaticAppDiscount", "title"], message: "Must be unique" },
    ]),
    true,
  );
  assert.equal(
    isDuplicateDiscountTitleError([
      {
        field: ["automaticAppDiscount", "title"],
        message: "Title must be unique",
      },
    ]),
    true,
  );
  assert.equal(
    isDuplicateDiscountTitleError([
      { field: ["automaticAppDiscount", "startsAt"], message: "Is invalid" },
    ]),
    false,
  );
});
