import type { LoaderFunctionArgs } from "react-router";

import { recommendProducts } from "../lib/recommendation-engine";
import { productRequiresCustomization } from "../lib/product-eligibility";
import type { CartContext, Placement } from "../lib/recommendation-types";
import {
  getCampaign,
  getProductCatalogue,
  getProductVariants,
} from "../models/campaign.server";
import { authenticate } from "../shopify.server";

function productGid(value: string) {
  return value.startsWith("gid://") ? value : `gid://shopify/Product/${value}`;
}

function parseNumber(value: string | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function publicVariantId(gid: string) {
  return gid.split("/").at(-1) ?? gid;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) {
    return Response.json(
      { recommendations: [], reason: "missing-session" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const requestedPlacement = url.searchParams.get("placement");
  const placement: Placement =
    requestedPlacement === "PRODUCT_PAGE"
      ? "PRODUCT_PAGE"
      : requestedPlacement === "CART_PAGE"
        ? "CART_PAGE"
        : "CART_DRAWER";
  const productIds = (url.searchParams.get("product_ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(productGid);
  const cart: CartContext = {
    productIds,
    subtotal: parseNumber(url.searchParams.get("subtotal")),
    itemCount: parseNumber(url.searchParams.get("item_count")),
  };
  const [campaign, catalogue] = await Promise.all([
    getCampaign(session.shop, placement),
    getProductCatalogue(session.shop),
  ]);
  const rankedRecommendations = recommendProducts(campaign, cart, catalogue);
  const variantsByProductId = await getProductVariants(
    session.shop,
    rankedRecommendations.map(({ product }) => product.productId),
  );
  const recommendations = rankedRecommendations.map((recommendation) => ({
    ...recommendation,
    product: {
      ...recommendation.product,
      variants:
        variantsByProductId.get(recommendation.product.productId) ?? [],
    },
  }));

  return Response.json(
    {
      placement,
      appearance: campaign.appearance,
      discount: campaign.discount,
      recommendations: recommendations.map(({ product, score, reasons }) => ({
        id: product.productId,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        imageUrl: product.imageUrl,
        price: product.priceMin,
        compareAtPrice: product.variants[0]?.compareAtPrice,
        requiresCustomization: productRequiresCustomization(product),
        score: Math.round(score * 100) / 100,
        reasons,
        variants: product.variants
          .filter((variant) => variant.available)
          .map((variant) => ({
            ...variant,
            id: publicVariantId(variant.id),
          })),
      })),
    },
    {
      headers: {
        "Cache-Control":
          placement === "PRODUCT_PAGE"
            ? "private, max-age=60, stale-while-revalidate=300"
            : "private, no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
};
