import assert from "node:assert/strict";
import test from "node:test";
import { cartRecentlyProducts } from "./cart-recently.ts";

const product = (handle: string) => ({
  id: handle.replace("item-", ""),
  handle,
});
const fallback = () =>
  Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8].map((id) => product(`item-${id}`)));
const loadProduct = async (candidate: { handle: string }) =>
  product(candidate.handle);

test("shows the five most recent distinct products without loading best sellers", async () => {
  const result = await cartRecentlyProducts({
    history: [
      "item-1",
      "item-2",
      "item-3",
      "item-4",
      "item-5",
      "item-5",
      "item-6",
    ],
    cartIds: [],
    loadProduct,
    loadBestSellers: async () => {
      assert.fail("fallback should not load");
    },
  });
  assert.deepEqual(
    result.map((item) => item.id),
    ["6", "5", "4", "3", "2"],
  );
});

test("fills missing slots in bestseller order without duplicating cart or recent products", async () => {
  const result = await cartRecentlyProducts({
    history: ["item-4", "item-1"],
    cartIds: [1, "gid://shopify/Product/2"],
    loadProduct,
    loadBestSellers: fallback,
  });
  assert.deepEqual(
    result.map((item) => item.id),
    ["4", "3", "5", "6", "7"],
  );
});

test("empty or corrupt history falls back to five best sellers", async () => {
  for (const history of [null, {}, "broken", [], [null, "../cart", 10]]) {
    const result = await cartRecentlyProducts({
      history,
      cartIds: [],
      loadProduct,
      loadBestSellers: fallback,
    });
    assert.deepEqual(
      result.map((item) => item.id),
      ["1", "2", "3", "4", "5"],
    );
  }
});

test("skips unavailable, deleted, customized, and cart products then fills all five slots", async () => {
  const result = await cartRecentlyProducts({
    history: ["item-1", "item-2", "item-3", "item-4"],
    cartIds: [4],
    loadProduct: async (candidate) => {
      if (candidate.handle === "item-1") return null;
      if (candidate.handle === "item-2") throw new Error("404");
      if (candidate.handle === "item-3")
        return { ...product(candidate.handle), requiresCustomization: true };
      return product(candidate.handle);
    },
    loadBestSellers: async () => [...(await fallback()), product("item-9")],
  });
  assert.deepEqual(
    result.map((item) => item.id),
    ["5", "6", "7", "8", "9"],
  );
});

test("collection failure preserves recent products and limited catalog never duplicates items", async () => {
  const base = { history: ["item-1"], cartIds: [], loadProduct };
  assert.equal(
    (
      await cartRecentlyProducts({
        ...base,
        loadBestSellers: async () => {
          throw new Error("offline");
        },
      })
    ).length,
    1,
  );
  assert.equal(
    (
      await cartRecentlyProducts({
        ...base,
        loadBestSellers: async () => [product("item-1"), product("item-2")],
      })
    ).length,
    2,
  );
});
