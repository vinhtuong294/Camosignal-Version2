import assert from "node:assert/strict";
import test from "node:test";

import {
  colorForFilename,
  designNameFromProductTitle,
  designTagForProductTitle,
  effectiveColors,
  isColorlessProductType,
  orderListingImages,
  randomSoldCountBase,
  scoreTemplate,
} from "./listing-utils.ts";

test("deduplicates color values and identifies the longest matching color in an asset filename", () => {
  const row = {
    productType: "Hoodie",
    mainColor: "Heather Dark Green",
    colors: ["White", "Heather Dark Green", "white"],
  };
  assert.deepEqual(effectiveColors(row), ["Heather Dark Green", "White"]);
  assert.equal(
    colorForFilename("TURKEY10080__Heather Dark Green__front.png", effectiveColors(row)),
    "Heather Dark Green",
  );
});

test("UPF hoodies intentionally have no color option", () => {
  assert.equal(isColorlessProductType("UPF Hoodie"), true);
  assert.deepEqual(
    effectiveColors({ productType: "UPF Hoodie", mainColor: "White", colors: ["White", "Black"] }),
    [],
  );
});

test("waterproof jackets are size-only and follow the approved gallery order", () => {
  assert.equal(isColorlessProductType("Waterproof Jacket"), true);
  const images = Array.from({ length: 7 }, (_, index) => ({
    name: index === 0 ? "jacket.jpg" : `jacket (${index + 1}).jpg`,
    color: null,
    mimeType: "image/jpeg",
    bytes: new Uint8Array(),
  }));
  assert.deepEqual(
    orderListingImages(images, { productType: "Waterproof Jacket", mainColor: null, colors: [] }).map((image) => image.name),
    ["jacket.jpg", "jacket (4).jpg", "jacket (5).jpg", "jacket (6).jpg", "jacket (3).jpg", "jacket (2).jpg", "jacket (7).jpg"],
  );
});

test("ranks a matching product type above a loose candidate", () => {
  const row = { productType: "Hoodie", title: "Turkey Woods Hoodie", designId: "TGV120802" };
  const matching = scoreTemplate(row, {
    title: "Classic Hoodie",
    productType: "Hoodie",
    optionNames: ["Color", "Size"],
    variantCount: 15,
  });
  const loose = scoreTemplate(row, {
    title: "Classic T-shirt",
    productType: "T-shirt",
    optionNames: ["Size"],
    variantCount: 5,
  });
  assert.ok(matching.score > loose.score);
});
test("puts the main-color image group first, then other multi-image colors", () => {
  const row = {
    productType: "Hoodie",
    mainColor: "Heather Dark Green",
    colors: ["White", "Sport Grey", "Sand", "Heather Dark Green", "Military Green"],
  };
  const images = [
    { name: "white.jpg", color: "White" },
    { name: "grey.jpg", color: "Sport Grey" },
    { name: "sand-1.jpg", color: "Sand" },
    { name: "green-1.jpg", color: "Heather Dark Green" },
    { name: "military.jpg", color: "Military Green" },
    { name: "green-2.jpg", color: "Heather Dark Green" },
    { name: "green-3.jpg", color: "Heather Dark Green" },
    { name: "sand-2.jpg", color: "Sand" },
  ].map((image) => ({ ...image, mimeType: "image/jpeg", bytes: new Uint8Array() }));

  assert.deepEqual(orderListingImages(images, row).map((image) => image.name), [
    "green-1.jpg",
    "green-2.jpg",
    "green-3.jpg",
    "sand-1.jpg",
    "sand-2.jpg",
    "white.jpg",
    "grey.jpg",
    "military.jpg",
  ]);
});

test("puts Main Color first in the Shopify color option order", () => {
  assert.deepEqual(
    effectiveColors({
      productType: "T-shirt",
      mainColor: "Gold",
      colors: ["Navy", "White", "Gold", "Sport Grey"],
    }),
    ["Gold", "Navy", "White", "Sport Grey"],
  );
});

test("generates Sold Count Base inclusively from 50 through 70", () => {
  assert.equal(randomSoldCountBase(() => 0), 50);
  assert.equal(randomSoldCountBase(() => 0.99999), 70);
});
test("builds one canonical design tag across garment product types", () => {
  for (const title of [
    "Trout Trifecta Long-sleeve",
    "Trout Trifecta T-Shirt",
    "Trout Trifecta Hoodie",
    "Trout Trifecta Sweatshirt",
  ]) {
    assert.equal(designNameFromProductTitle(title), "Trout Trifecta");
    assert.equal(designTagForProductTitle(title), "design:Trout-Trifecta");
  }
  assert.equal(designNameFromProductTitle("Wild Crown Camo Layering Series"), "Wild Crown Camo");
  assert.equal(designNameFromProductTitle("Wild Crown Camo Water-Resistant Jacket"), "Wild Crown Camo");
  assert.equal(designNameFromProductTitle("Hunt Hard Camo Water‑Resistant Jacket"), "Hunt Hard Camo");
  assert.equal(designNameFromProductTitle("Rut Driven Camo Fleece Hoodie"), "Rut Driven Camo");
});
