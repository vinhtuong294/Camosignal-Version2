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
  // Aggregate in Postgres instead of transferring the entire event history.
  const events = await prisma.upsellEvent.groupBy({
    by: ["eventType", "placement"],
    where: { shop },
    _count: { _all: true },
    _sum: { value: true },
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
    if (event.eventType === "VIEW") metrics[placement].views += event._count._all;
    if (event.eventType === "CLICK") metrics[placement].clicks += event._count._all;
    if (event.eventType === "ADD") {
      metrics[placement].conversions += event._count._all;
      metrics[placement].conversionValue += event._sum.value ?? 0;
    }
  }

  return metrics;
}
