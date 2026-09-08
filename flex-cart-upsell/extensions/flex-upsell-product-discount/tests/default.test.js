import { describe, expect, test } from "vitest";
import { cartLinesDiscountsGenerateRun } from "../src/cart_lines_discounts_generate_run";

function inputFor(configuration) {
  return {
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/upsell",
          quantity: 2,
          attribute: { value: "CART_DRAWER" },
        },
        {
          id: "gid://shopify/CartLine/normal",
          quantity: 1,
          attribute: null,
        },
      ],
    },
    discount: {
      discountClasses: ["PRODUCT"],
      metafield: { value: JSON.stringify(configuration) },
    },
  };
}

describe("Flex Upsell Product Discount", () => {
  test("discounts only the product line added from this upsell campaign by percentage", () => {
    const result = cartLinesDiscountsGenerateRun(
      inputFor({
        campaignKey: "CART_DRAWER",
        discountType: "PERCENTAGE",
        value: 15,
        message: "15% upsell offer",
      }),
    );

    expect(result).toEqual({
      operations: [
        {
          productDiscountsAdd: {
            candidates: [
              {
                message: "15% upsell offer",
                targets: [
                  {
                    cartLine: {
                      id: "gid://shopify/CartLine/upsell",
                      quantity: 2,
                    },
                  },
                ],
                value: { percentage: { value: 15 } },
              },
            ],
            selectionStrategy: "FIRST",
          },
        },
      ],
    });
  });

  test("supports a fixed amount discount for each eligible upsell item", () => {
    const result = cartLinesDiscountsGenerateRun(
      inputFor({
        campaignKey: "CART_DRAWER",
        discountType: "FIXED_AMOUNT",
        value: 5,
        message: "Five dollars off",
      }),
    );

    expect(result.operations[0].productDiscountsAdd.candidates[0].value).toEqual({
      fixedAmount: { amount: 5, appliesToEachItem: true },
    });
  });

  test("does not discount lines not marked as added by this campaign", () => {
    const result = cartLinesDiscountsGenerateRun(
      inputFor({
        campaignKey: "PRODUCT_PAGE",
        discountType: "PERCENTAGE",
        value: 15,
      }),
    );

    expect(result).toEqual({ operations: [] });
  });
});
