import assert from "node:assert/strict";
import test from "node:test";

import { parseEventPayloadBody } from "./event-payload.ts";

test("event payload accepts JSON", () => {
  assert.deepEqual(
    parseEventPayloadBody(
      JSON.stringify({
        placement: "PRODUCT_PAGE",
        eventType: "CLICK",
        productId: "123",
        sessionKey: "session",
        value: 41.99,
      }),
    ),
    {
      placement: "PRODUCT_PAGE",
      eventType: "CLICK",
      productId: "123",
      sessionKey: "session",
      value: 41.99,
    },
  );
});

test("event payload accepts app-proxy form encoding", () => {
  assert.deepEqual(
    parseEventPayloadBody(
      new URLSearchParams({
        placement: "CART_DRAWER",
        eventType: "ADD",
        productId: "456",
        sessionKey: "session",
        value: "51.99",
      }).toString(),
    ),
    {
      placement: "CART_DRAWER",
      eventType: "ADD",
      productId: "456",
      sessionKey: "session",
      value: 51.99,
    },
  );
});

test("malformed event payload is safely ignored", () => {
  assert.deepEqual(parseEventPayloadBody("{not-json}"), {});
});
