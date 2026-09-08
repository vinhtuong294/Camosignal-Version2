import type { ActionFunctionArgs } from "react-router";

import { removeProductSnapshot } from "../models/campaign.server";
import { syncProductFromWebhook } from "../models/catalogue-webhook.server";
import { authenticate } from "../shopify.server";

function productIdFromPayload(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "admin_graphql_api_id" in payload &&
    typeof payload.admin_graphql_api_id === "string"
  ) {
    return payload.admin_graphql_api_id;
  }
  return null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, payload, session, shop, topic } =
    await authenticate.webhook(request);
  if (!session || !admin) return new Response(null, { status: 200 });

  const productId = productIdFromPayload(payload);
  if (!productId) {
    console.warn("Product webhook did not include a product ID", { shop, topic });
    return new Response(null, { status: 200 });
  }

  if (topic === "PRODUCTS_DELETE") {
    await removeProductSnapshot(shop, productId);
  } else {
    await syncProductFromWebhook({ admin, productId, shop });
  }

  return new Response(null, { status: 200 });
};
