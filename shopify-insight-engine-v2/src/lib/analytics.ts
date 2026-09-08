import type { AppAnalysis, ProductAction, ProductPoint } from "@/lib/types";

export function money(value: number, currency = "USD", compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(value || 0);
}

export function number(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value || 0);
}

export function percent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "No data";
  return `${value >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value)}`;
}

export function rawPercent(value: number, digits = 1) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value);
}

export function deltaTone(value: number | null) {
  if (value === null) return "text-amber-700";
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-red-700";
  return "text-muted-foreground";
}

export function actionLabel(action: ProductAction) {
  if (action === "scale") return "Scale";
  if (action === "fix") return "Fix first";
  return "Watch";
}

export function actionTone(action: ProductAction) {
  if (action === "scale") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (action === "fix") return "bg-red-50 text-red-800 ring-red-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

export function actionGroups(products: ProductPoint[]) {
  const groups: Record<ProductAction, ProductPoint[]> = {
    scale: [],
    watch: [],
    fix: [],
  };
  for (const product of products) groups[product.action].push(product);
  return groups;
}

export function productDelta(product: ProductPoint) {
  if (!product.previousSales) return product.currentSales ? 1 : 0;
  return (product.currentSales - product.previousSales) / product.previousSales;
}

export function productAov(product: ProductPoint) {
  return product.currentOrders ? product.currentSales / product.currentOrders : 0;
}

export function listingAgeDays(product: ProductPoint, now = new Date("2026-06-17T12:00:00-04:00")) {
  const listed = new Date(`${product.listingDate}T00:00:00-04:00`);
  if (Number.isNaN(listed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - listed.getTime()) / 86_400_000));
}

export function productTypeMix(products: ProductPoint[]) {
  const rows = new Map<string, { label: string; revenue: number; orders: number; products: number }>();
  for (const product of products) {
    const key = product.apparelType || product.productType || "Unclassified";
    const current = rows.get(key) || { label: key, revenue: 0, orders: 0, products: 0 };
    current.revenue += product.currentSales;
    current.orders += product.currentOrders;
    current.products += 1;
    rows.set(key, current);
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}

export function analysisTotals(analysis: AppAnalysis) {
  return {
    revenue: analysis.products.reduce((sum, product) => sum + product.currentSales, 0),
    orders: analysis.products.reduce((sum, product) => sum + product.currentOrders, 0),
    previousRevenue: analysis.products.reduce((sum, product) => sum + product.previousSales, 0),
  };
}
