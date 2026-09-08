import type { ActionFunctionArgs } from "react-router";

import {
  orderContainsUpsellLine,
  orderGraphqlIdFromWebhook,
  UPSELL_ORDER_TAG,
} from "../lib/order-upsell-tag";
import { authenticate } from "../shopify.server";

interface TagsAddResponse {
  data?: {
    tagsAdd?: {
      userErrors?: Array<{ field?: string[]; message: string }>;
    };
  };
  errors?: Array<{ message: string }>;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, payload, session, shop, topic } =
    await authenticate.webhook(request);

  if (!orderContainsUpsellLine(payload)) {
    return new Response(null, { status: 200 });
  }

  const orderId = orderGraphqlIdFromWebhook(payload);
  if (!orderId) {
    console.warn("Upsell order webhook did not include a valid order ID", {
      shop,
      topic,
    });
    return new Response(null, { status: 200 });
  }

  if (!admin || !session) {
    console.error("Unable to tag upsell order without an offline session", {
      orderId,
      shop,
      topic,
    });
    return new Response("Shopify admin session unavailable", { status: 500 });
  }

  const response = await admin.graphql(
    `#graphql
      mutation TagUpsellOrder($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          userErrors { field message }
        }
      }
    `,
    {
      variables: {
        id: orderId,
        tags: [UPSELL_ORDER_TAG],
      },
    },
  );
  const result = (await response.json()) as TagsAddResponse;
  const errors = [
    ...(result.errors ?? []).map((error) => error.message),
    ...(result.data?.tagsAdd?.userErrors ?? []).map(
      (error) => error.message,
    ),
  ];

  if (errors.length) {
    console.error("Unable to tag upsell order", {
      errors,
      orderId,
      shop,
      topic,
    });
    return new Response("Unable to tag upsell order", { status: 500 });
  }

  return new Response(null, { status: 200 });
};
