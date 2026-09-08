import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMOSIGNAL_COMBO_TAG,
  customizationIsRequired,
  isExcludedFromUpsell,
  productRequiresCustomization,
  UPSELL_EXCLUDE_TAG,
  UPSELL_CUSTOMIZE_TAG,
  withCustomizationMarker,
} from "./product-eligibility.ts";

test("customization metafield marks a product for customization", () => {
  assert.equal(customizationIsRequired({ value: "true" }), true);
  assert.equal(customizationIsRequired({ value: " TRUE " }), true);
  assert.equal(customizationIsRequired({ value: "false" }), false);
  assert.equal(customizationIsRequired(null), false);
  assert.equal(
    productRequiresCustomization({ customizationEnabled: { value: "true" } }),
    true,
  );
  assert.equal(
    isExcludedFromUpsell({ customizationEnabled: { value: "true" } }),
    false,
  );
});

test("reserved exclusion tag is case-insensitive and exact", () => {
  assert.equal(
    isExcludedFromUpsell({ tags: [UPSELL_EXCLUDE_TAG.toUpperCase()] }),
    true,
  );
  assert.equal(
    isExcludedFromUpsell({ tags: [`${UPSELL_EXCLUDE_TAG}-other`] }),
    false,
  );
});

test("a product without the custom box marker stays eligible", () => {
  assert.equal(
    isExcludedFromUpsell({
      tags: [],
      customizationEnabled: { value: "false" },
    }),
    false,
  );
});

test("CamoSignal combo-builder products remain visible but require customization", () => {
  assert.equal(
    productRequiresCustomization({ tags: [CAMOSIGNAL_COMBO_TAG] }),
    true,
  );
  assert.equal(isExcludedFromUpsell({ tags: [CAMOSIGNAL_COMBO_TAG] }), false);
});

test("catalogue snapshots preserve the customization marker", () => {
  assert.deepEqual(
    withCustomizationMarker(["faithings"], { value: "true" }),
    ["faithings", UPSELL_CUSTOMIZE_TAG],
  );
  assert.equal(
    productRequiresCustomization({ tags: [UPSELL_CUSTOMIZE_TAG] }),
    true,
  );
});
