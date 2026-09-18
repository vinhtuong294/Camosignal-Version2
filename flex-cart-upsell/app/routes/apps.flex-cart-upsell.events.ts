import type { ActionFunctionArgs } from "react-router";

import prisma from "../db.server";
import { parseEventPayloadBody } from "../lib/event-payload";
import { authenticate } from "../shopify.server";

function productGid(value: string) {
  return value.startsWith("gid://") ? value : `gid://shopify/Product/${value}`;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) return Response.json({ ok: false }, { status: 401 });

  const payload = parseEventPayloadBody(await request.text());
  const placement =
    payload.placement === "CART_PAGE" ? "CART_PAGE" : "CART_DRAWER";
  const eventType = ["VIEW", "CLICK", "ADD"].includes(payload.eventType ?? "")
    ? payload.eventType!
    : "VIEW";
  const productId = payload.productId
    ? productGid(payload.productId)
    : undefined;
  const campaign = await prisma.campaign.findUnique({
    where: { shop_placement: { shop: session.shop, placement } },
    select: { id: true },
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.upsellEvent.create({
      select: { id: true },
      data: {
        shop: session.shop,
        campaignId: campaign?.id,
        placement,
        eventType,
        productId,
        sessionKey: payload.sessionKey?.slice(0, 80),
        value:
          typeof payload.value === "number" && Number.isFinite(payload.value)
            ? payload.value
            : undefined,
      },
    });

    if (eventType === "ADD" && productId) {
      await transaction.productSnapshot.updateMany({
        where: { shop: session.shop, productId },
        data: { popularityScore: { increment: 0.02 } },
      });
    }
  });

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
};
