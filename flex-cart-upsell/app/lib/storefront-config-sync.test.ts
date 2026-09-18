import assert from "node:assert/strict";
import test from "node:test";
import { syncNativeStorefrontConfig } from "../models/storefront-config.server.ts";

const campaign = {
  placement: "CART_DRAWER",
  enabled: true,
  filters: { maxProducts: 5 },
  appearance: { heading: "You might also like these" },
  discount: { type: "PERCENTAGE", value: 10, message: "Upsell offer" },
} as unknown as Parameters<typeof syncNativeStorefrontConfig>[1];

test("native configuration sync does not opt another store in", async () => {
  let writes = 0;
  await syncNativeStorefrontConfig(
    {
      graphql: async (_query, options) => {
        if (options) writes++;
        return {
          json: async () => ({
            data: { shop: { id: "shop", metafield: null } },
          }),
        };
      },
    },
    campaign,
  );
  assert.equal(writes, 0);
});
test("native configuration sync retries CAS conflict and preserves other placement plus preview gate", async () => {
  let reads = 0,
    writes = 0;
  const config = {
    version: 1,
    previewThemeId: "qa",
    placements: {
      PRODUCT_PAGE: { enabled: false },
      CART_DRAWER: { enabled: true },
    },
  };
  await syncNativeStorefrontConfig(
    {
      graphql: async (_query, options) => {
        if (!options) {
          reads++;
          return {
            json: async () => ({
              data: {
                shop: {
                  id: "shop",
                  metafield: {
                    value: JSON.stringify(config),
                    compareDigest: `digest-${reads}`,
                  },
                },
              },
            }),
          };
        }
        writes++;
        const fields = options.variables?.metafields as Array<{
          value: string;
          compareDigest: string;
        }>;
        const value = JSON.parse(fields[0].value);
        assert.equal(value.previewThemeId, "qa");
        assert.deepEqual(value.placements.PRODUCT_PAGE, { enabled: false });
        assert.equal(value.placements.CART_DRAWER.maxProducts, 5);
        assert.equal(fields[0].compareDigest, `digest-${reads}`);
        return {
          json: async () => ({
            data: {
              metafieldsSet: {
                userErrors:
                  writes === 1
                    ? [{ code: "INVALID_COMPARE_DIGEST", message: "conflict" }]
                    : [],
              },
            },
          }),
        };
      },
    },
    campaign,
  );
  assert.equal(reads, 2);
  assert.equal(writes, 2);
});
test("native configuration sync surfaces permission errors without silent success", async () => {
  await assert.rejects(
    () =>
      syncNativeStorefrontConfig(
        {
          graphql: async () => ({
            json: async () => ({ errors: [{ message: "Access denied" }] }),
          }),
        },
        campaign,
      ),
    /Unable to read/,
  );
});
