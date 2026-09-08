import { sampleAnalysis } from "@/lib/sample-analysis";
import type {
  AppAnalysis,
  BlankPerformanceRow,
  CustomerLifecycleRow,
  CustomerLifecycleSegment,
  CustomerLifecycleSummary,
  DailyPoint,
  MetricCard,
  ProductAction,
  ProductPoint,
  ThemeRow,
} from "@/lib/types";

type AnyRecord = Record<string, unknown>;

function record(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function num(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function text(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim();
}

function pct(current: number, previous: number): number {
  if (!previous) return current ? 1 : 0;
  return (current - previous) / Math.abs(previous);
}

function money(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function integer(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function percentValue(value: number): string {
  return `${(value * 100).toFixed(Math.abs(value) < 0.1 ? 1 : 0)}%`;
}

function normalizeDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : raw;
}

function metricFromLegacy(
  label: string,
  value: string,
  delta: number | null,
  helper: string,
): MetricCard {
  return { label, value, delta, helper };
}

function lifecycleLabel(segment: CustomerLifecycleSegment): string {
  if (segment === "returning") return "Returning customers";
  if (segment === "new") return "First-time customers";
  return "Guest / unmatched";
}

function lifecycleRow(segment: CustomerLifecycleSegment, overrides: Partial<CustomerLifecycleRow> = {}): CustomerLifecycleRow {
  const revenue = num(overrides.revenue);
  const orders = num(overrides.orders);
  const grossSales = num(overrides.grossSales, revenue);
  const discounts = num(overrides.discounts);

  return {
    segment,
    label: overrides.label || lifecycleLabel(segment),
    revenue,
    orders,
    discounts,
    grossSales,
    share: num(overrides.share),
    aov: num(overrides.aov, orders ? revenue / orders : 0),
    discountRate: num(overrides.discountRate, grossSales ? discounts / grossSales : 0),
  };
}

function fallbackCustomerLifecycle(
  netSales: number,
  orders: number,
  discounts: number,
  grossSales: number,
): CustomerLifecycleSummary {
  const row = lifecycleRow("unknown", {
    revenue: netSales,
    orders,
    discounts,
    grossSales,
    share: netSales ? 1 : 0,
  });

  return {
    available: false,
    rows: [row],
    newCustomerRevenueShare: 0,
    returningRevenueShare: 0,
    unknownRevenueShare: row.share,
    newCustomerDiscountRate: 0,
    returningDiscountRate: 0,
    diagnosis:
      "Customer lifecycle is not available in this source yet. Add Shopify customer history access to split discount pressure between first-time and returning buyers.",
  };
}

function mapCustomerLifecycle(
  legacy: AnyRecord,
  netSales: number,
  orders: number,
  discounts: number,
  grossSales: number,
): CustomerLifecycleSummary {
  const lifecycle = record(legacy.customerLifecycle);
  const rows = array(lifecycle.rows)
    .map((entry) => {
      const row = record(entry);
      const segmentText = text(row.segment).toLowerCase();
      const segment: CustomerLifecycleSegment =
        segmentText === "returning" ? "returning" : segmentText === "new" ? "new" : "unknown";
      return lifecycleRow(segment, {
        label: text(row.label, lifecycleLabel(segment)),
        revenue: num(row.revenue),
        orders: num(row.orders),
        discounts: num(row.discounts),
        grossSales: num(row.grossSales),
        share: num(row.share),
        aov: num(row.aov),
        discountRate: num(row.discountRate),
      });
    })
    .filter((row) => row.revenue || row.orders);

  if (!rows.length) return fallbackCustomerLifecycle(netSales, orders, discounts, grossSales);

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0) || 1;
  const normalized = rows.map((row) => ({ ...row, share: row.share || row.revenue / totalRevenue }));
  const firstTime = normalized.find((row) => row.segment === "new");
  const returning = normalized.find((row) => row.segment === "returning");
  const unknown = normalized.find((row) => row.segment === "unknown");

  return {
    available: Boolean(lifecycle.available ?? true),
    rows: normalized,
    newCustomerRevenueShare: firstTime?.share || 0,
    returningRevenueShare: returning?.share || 0,
    unknownRevenueShare: unknown?.share || 0,
    newCustomerDiscountRate: firstTime?.discountRate || 0,
    returningDiscountRate: returning?.discountRate || 0,
    diagnosis: text(
      lifecycle.diagnosis,
      "Customer lifecycle split is available from the upstream insight source. Use it to separate retention discount from acquisition discount.",
    ),
  };
}

function sourceLabel(value: unknown): ProductPoint["source"] {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("collection")) return "Shopify collection";
  if (normalized.includes("product_type") || normalized.includes("product type")) return "Product type";
  if (normalized.includes("description")) return "Description";
  return "Product title";
}

function actionForProduct(product: AnyRecord): ProductAction {
  const currentOrders = num(product.currentOrders);
  const delta = num(product.deltaPct, pct(num(product.currentSales), num(product.previousSales)));
  const daysLive = num(product.daysLive);

  if (currentOrders >= 10 && delta >= 0.08) return "scale";
  if (currentOrders >= 10 && delta <= -0.25 && daysLive >= 14) return "fix";
  return "watch";
}

function actionReason(product: AnyRecord, action: ProductAction): string {
  const delta = num(product.deltaPct, pct(num(product.currentSales), num(product.previousSales)));
  const orders = num(product.currentOrders);
  const daysLive = num(product.daysLive);
  const title = text(product.title || product.name, "This product");

  if (action === "scale") {
    return `${title} is up ${percentValue(Math.abs(delta))} with ${integer(orders)} orders. Scale only with inventory cover and Meta ROAS guardrails.`;
  }
  if (action === "fix") {
    return `${title} is down ${percentValue(Math.abs(delta))} after ${integer(daysLive)} days live. Check product page, creative, price, season timing, and collection placement before adding traffic.`;
  }
  if (daysLive < 14) {
    return `${title} is still a newer listing. Keep watching until it has enough orders and Meta spend evidence.`;
  }
  return `${title} does not have enough clean evidence for a hard scale or fix decision yet. Keep monitoring orders, sales velocity, and spend.`;
}

function collectionTitles(value: unknown): string[] {
  return array(value)
    .map((entry) => {
      if (typeof entry === "string") return entry;
      return text(record(entry).title || record(entry).handle);
    })
    .filter(Boolean);
}

function productDaily(product: AnyRecord, legacy: AnyRecord, fallbackDaily: DailyPoint[]): DailyPoint[] {
  const tables = record(legacy.tables);
  const detail = record(legacy.detail);
  const rows = [...array(tables.productDaily), ...array(detail.productDaily)];
  const productId = text(product.id || product.productId);
  const productName = text(product.title || product.name);
  const matched = rows.filter((entry) => {
    const row = record(entry);
    return text(row.productId || row.id) === productId || text(row.product || row.name || row.title) === productName;
  });

  const source = matched.length ? matched : array(product.series);
  const mapped = source.map((entry) => {
    const row = record(entry);
    return {
      date: normalizeDate(row.date || row.day),
      netSales: num(row.netSales ?? row.sales ?? row.revenue),
      orders: num(row.orders),
      sessions: num(row.sessions),
    };
  }).filter((row) => row.date);

  return mapped.length ? mapped : fallbackDaily.map((row) => ({ ...row, netSales: 0, orders: 0 }));
}

function mapProducts(legacy: AnyRecord, fallbackDaily: DailyPoint[]): ProductPoint[] {
  const tables = record(legacy.tables);
  const rows = array(tables.products).length ? array(tables.products) : array(record(legacy.seasonality).products);

  const products = rows.map((entry, index): ProductPoint => {
    const row = record(entry);
    const action = actionForProduct(row);
    const collections = collectionTitles(row.collections);
    const currentOrders = num(row.currentOrders);
    const inventory = num(row.inventory);
    const listingDate = normalizeDate(row.listingDateKey || row.listingDate || row.listedAt);

    return {
      id: text(row.id || row.productId || row.handle, `product-${index}`),
      title: text(row.title || row.name, "Untitled product"),
      handle: text(row.handle || row.id || row.productId, `product-${index}`),
      imageUrl: text(row.imageUrl),
      productType: text(row.productType, "Unknown"),
      apparelType: text(row.apparelLabel || row.apparelType || row.productType, "Unclassified"),
      theme: text(row.themeLabel || row.theme || "Unclassified"),
      designFamily: text(row.designFamilyLabel || row.designFamily || "Unclassified"),
      collections,
      tags: array(row.tags).map((tag) => text(tag)).filter(Boolean),
      descriptionText: text(row.descriptionText),
      listingDate,
      currentSales: num(row.currentSales),
      previousSales: num(row.previousSales),
      currentOrders,
      previousOrders: num(row.previousOrders),
      unitsSold: num(row.unitsSold),
      inventory,
      daysOfCover: row.daysOfCover === null || row.daysOfCover === undefined ? null : num(row.daysOfCover),
      confidence: row.themeConfidence === "high" || row.apparelConfidence === "high" ? 82 : 58,
      roas: row.roas === null || row.roas === undefined ? null : num(row.roas),
      action,
      actionReason: actionReason(row, action),
      source: sourceLabel(row.classificationSource || row.themeClassificationSource || row.source),
      daily: productDaily(row, legacy, fallbackDaily),
    };
  });

  return products.length ? products : sampleAnalysis.products;
}

function mapDaily(legacy: AnyRecord): DailyPoint[] {
  const tables = record(legacy.tables);
  const rows = array(tables.daily).length ? array(tables.daily) : array(legacy.series);
  const daily = rows.map((entry) => {
    const row = record(entry);
    return {
      date: normalizeDate(row.date || row.day),
      netSales: num(row.netSales ?? row.sales ?? row.revenue),
      orders: num(row.orders),
      sessions: num(row.sessions),
    };
  }).filter((row) => row.date);

  return daily.length ? daily : sampleAnalysis.daily;
}

function mapBlankPerformance(legacy: AnyRecord, products: ProductPoint[]): BlankPerformanceRow[] {
  const tables = record(legacy.tables);
  const rows = array(tables.blankMix);
  const mapped = rows.map((entry) => {
    const row = record(entry);
    return {
      label: text(row.label || row.apparelLabel || row.name, "Unclassified"),
      revenue: num(row.revenue ?? row.currentSales ?? row.netSales),
      orders: num(row.orders ?? row.currentOrders),
      products: num(row.products ?? row.productCount, 1),
    };
  }).filter((row) => row.revenue || row.orders || row.products);

  if (mapped.length) return mapped;

  const byType = new Map<string, BlankPerformanceRow>();
  for (const product of products) {
    const row = byType.get(product.apparelType) || {
      label: product.apparelType,
      revenue: 0,
      orders: 0,
      products: 0,
    };
    row.revenue += product.currentSales;
    row.orders += product.currentOrders;
    row.products += 1;
    byType.set(product.apparelType, row);
  }
  return Array.from(byType.values()).sort((a, b) => b.revenue - a.revenue);
}

function themeStatus(value: unknown): ThemeRow["status"] {
  const phase = text(value).toLowerCase();
  if (phase.includes("peak") || phase.includes("active") || phase.includes("in season")) return "In season";
  if (phase.includes("pre")) return "Pre-season";
  if (phase.includes("event")) return "Event";
  return "Off-season";
}

function mapThemes(legacy: AnyRecord, products: ProductPoint[]): ThemeRow[] {
  const tables = record(legacy.tables);
  const seasonality = record(legacy.seasonality);
  const rows = array(tables.seasonCategories).length ? array(tables.seasonCategories) : array(seasonality.categories);
  const totalRevenue = products.reduce((sum, product) => sum + product.currentSales, 0) || 1;

  const mapped = rows.map((entry) => {
    const row = record(entry);
    const revenue = num(row.currentSales ?? row.revenue ?? row.netSales);
    return {
      theme: text(row.shortLabel || row.label || row.theme, "Unclassified"),
      status: themeStatus(row.phaseLabel || row.phase || row.status),
      revenue,
      share: num(row.share, revenue / totalRevenue),
      products: num(row.productCount ?? row.products),
    };
  }).filter((row) => row.revenue || row.products);

  if (mapped.length) return mapped.slice(0, 8);

  const byTheme = new Map<string, ThemeRow>();
  for (const product of products) {
    const row = byTheme.get(product.theme) || {
      theme: product.theme,
      status: "In season",
      revenue: 0,
      share: 0,
      products: 0,
    };
    row.revenue += product.currentSales;
    row.products += 1;
    byTheme.set(product.theme, row);
  }
  return Array.from(byTheme.values())
    .map((row) => ({ ...row, share: row.revenue / totalRevenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

export function adaptLegacyInsights(payload: unknown): AppAnalysis {
  const root = record(payload);
  const legacy = record(root.analysis || payload);
  const snapshot = record(root.snapshot);
  const current = record(snapshot.current);
  const previous = record(snapshot.previous);
  const source = record(legacy.source || snapshot.source);
  const periods = record(legacy.periods);
  const currentPeriod = record(periods.current);
  const previousPeriod = record(periods.previous);
  const daily = mapDaily(legacy);
  const products = mapProducts(legacy, daily);
  const currency = "USD";
  const netSales = num(current.netSales, products.reduce((sum, product) => sum + product.currentSales, 0));
  const previousNetSales = num(previous.netSales, products.reduce((sum, product) => sum + product.previousSales, 0));
  const orders = num(current.orders, products.reduce((sum, product) => sum + product.currentOrders, 0));
  const previousOrders = num(previous.orders, products.reduce((sum, product) => sum + product.previousOrders, 0));
  const grossSales = Math.max(num(current.grossSales, netSales), 1);
  const previousGrossSales = Math.max(num(previous.grossSales, previousNetSales), 1);
  const discountRate = num(current.discounts) / grossSales;
  const previousDiscountRate = num(previous.discounts) / previousGrossSales;
  const refundRate = num(current.refunds) / grossSales;
  const previousRefundRate = num(previous.refunds) / previousGrossSales;

  const metrics: MetricCard[] = [
    metricFromLegacy("Net sales", money(netSales, currency), pct(netSales, previousNetSales), "Shopify orders, refunds removed"),
    metricFromLegacy("Orders", integer(orders), pct(orders, previousOrders), "Unique Shopify orders"),
    metricFromLegacy("AOV", money(orders ? netSales / orders : 0, currency), pct(orders ? netSales / orders : 0, previousOrders ? previousNetSales / previousOrders : 0), "Net sales / orders"),
    metricFromLegacy("Discount rate", percentValue(discountRate), discountRate - previousDiscountRate, "Discounts / gross sales"),
    metricFromLegacy("Refund rate", percentValue(refundRate), refundRate - previousRefundRate, "Refunds / gross sales"),
    metricFromLegacy("ROAS", "No data", null, "Connect Meta Ads for spend"),
  ];

  return {
    generatedAt: text(legacy.generatedAt || snapshot.generatedAt, new Date().toISOString()),
    periodLabel: text(currentPeriod.label || periods.current || current.label || `Last ${num(source.days, 14)} days`),
    comparisonLabel: text(previousPeriod.label || periods.previous || previous.label || `Previous ${num(source.days, 14)} days`),
    currency,
    coverage: {
      shopify: "live",
      metaAds: "manual",
    },
    metrics,
    daily,
    products,
    blankPerformance: mapBlankPerformance(legacy, products),
    themes: mapThemes(legacy, products),
    customerLifecycle: mapCustomerLifecycle(legacy, netSales, orders, num(current.discounts), grossSales),
  };
}
