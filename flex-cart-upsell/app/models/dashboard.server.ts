import prisma from "../db.server";
import type { Placement } from "../lib/recommendation-types";
import type { PlacementMetrics } from "../components/campaign-dashboard";

const EMPTY_METRICS: PlacementMetrics = {
  clicks: 0,
  conversions: 0,
  conversionValue: 0,
  views: 0,
};

export async function getDashboardMetrics(shop: string) {
  const events = await prisma.upsellEvent.findMany({
    where: { shop },
    select: {
      eventType: true,
      placement: true,
      value: true,
    },
  });
  const metrics: Record<Placement, PlacementMetrics> = {
    PRODUCT_PAGE: { ...EMPTY_METRICS },
    CART_DRAWER: { ...EMPTY_METRICS },
    CART_PAGE: { ...EMPTY_METRICS },
  };

  for (const event of events) {
    const placement: Placement =
      event.placement === "PRODUCT_PAGE"
        ? "PRODUCT_PAGE"
        : event.placement === "CART_PAGE"
          ? "CART_PAGE"
          : "CART_DRAWER";
    if (event.eventType === "VIEW") metrics[placement].views += 1;
    if (event.eventType === "CLICK") metrics[placement].clicks += 1;
    if (event.eventType === "ADD") {
      metrics[placement].conversions += 1;
      metrics[placement].conversionValue += event.value ?? 0;
    }
  }

  return metrics;
}
