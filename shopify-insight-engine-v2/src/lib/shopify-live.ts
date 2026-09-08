import type {
  AppAnalysis,
  BlankPerformanceRow,
  CustomerLifecycleRow,
  CustomerLifecycleSegment,
  CustomerLifecycleSummary,
  DailyPoint,
  GrowthCoverageDetail,
  GrowthPeriodSnapshot,
  GrowthSummary,
  MetricCard,
  PopupSegmentKey,
  PopupSegmentRow,
  PopupSelectionDepthRow,
  ProductAction,
  ProductPoint,
  ThemeRow,
} from "@/lib/types";
import type { ShopifySession } from "@/lib/shopify-session";

const DEFAULT_API_VERSION = "2026-04";
const DEFAULT_TIME_ZONE = "America/New_York";
const ORDER_PAGE_SIZE = 100;
const MAX_ORDER_PAGES = 20;
const CUSTOMER_PAGE_SIZE = 250;
const MAX_CUSTOMER_PAGES = 200;
const POPUP_CUSTOMER_CACHE_MS = 5 * 60_000;

const POPUP_SEGMENTS: ReadonlyArray<{ key: PopupSegmentKey; label: string; tag: string }> = [
  { key: "deer", label: "Deer", tag: "deer" },
  { key: "turkey", label: "Turkey", tag: "turkey" },
  { key: "freshwater", label: "Freshwater", tag: "freshwater" },
  { key: "saltwater", label: "Saltwater", tag: "saltwater" },
  { key: "seasonal", label: "Seasonal", tag: "seasonal" },
];

const INSIGHT_ORDERS_QUERY = `
query InsightOrders($first: Int!, $after: String, $query: String!) {
  orders(first: $first, after: $after, query: $query, sortKey: PROCESSED_AT) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      name
      processedAt
      sourceName
      test
      cancelledAt
      displayFinancialStatus
      app {
        name
      }
      customer {
        id
        numberOfOrders
        createdAt
      }
      currentSubtotalLineItemsQuantity
      currentSubtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      currentTotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      currentTotalDiscountsSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalRefundedSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 50) {
        pageInfo {
          hasNextPage
        }
        nodes {
          quantity
          sku
          title
          discountedTotalSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          variant {
            id
            sku
            inventoryQuantity
            image {
              url
              altText
            }
            product {
              id
              title
              handle
              descriptionHtml
              productType
              tags
              createdAt
              publishedAt
              updatedAt
              featuredImage {
                url
                altText
              }
              collections(first: 20) {
                nodes {
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const INSIGHT_ORDERS_WITHOUT_CUSTOMERS_QUERY = `
query InsightOrders($first: Int!, $after: String, $query: String!) {
  orders(first: $first, after: $after, query: $query, sortKey: PROCESSED_AT) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      name
      processedAt
      sourceName
      test
      cancelledAt
      displayFinancialStatus
      app {
        name
      }
      currentSubtotalLineItemsQuantity
      currentSubtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      currentTotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      currentTotalDiscountsSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalRefundedSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 50) {
        pageInfo {
          hasNextPage
        }
        nodes {
          quantity
          sku
          title
          discountedTotalSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          variant {
            id
            sku
            inventoryQuantity
            image {
              url
              altText
            }
            product {
              id
              title
              handle
              descriptionHtml
              productType
              tags
              createdAt
              publishedAt
              updatedAt
              featuredImage {
                url
                altText
              }
              collections(first: 20) {
                nodes {
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const SHOP_QUERY = `
query InsightShop {
  shop {
    ianaTimezone
  }
}
`;

const HUMAN_SESSIONS_QUERY = `
query InsightHumanSessions($query: String!) {
  shopifyqlQuery(query: $query) {
    tableData {
      columns {
        name
        dataType
        displayName
      }
      rows
    }
    parseErrors
  }
}
`;

const POPUP_CUSTOMERS_QUERY = `
query InsightPopupCustomers($first: Int!, $after: String) {
  customers(first: $first, after: $after, query: "tag:'popup'") {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      tags
      createdAt
      numberOfOrders
      defaultEmailAddress {
        marketingState
        marketingUpdatedAt
      }
    }
  }
}
`;

const POPUP_CUSTOMERS_WITHOUT_MARKETING_QUERY = `
query InsightPopupCustomers($first: Int!, $after: String) {
  customers(first: $first, after: $after, query: "tag:'popup'") {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      tags
      createdAt
      numberOfOrders
    }
  }
}
`;

type ShopifyMoneySet = {
  shopMoney?: {
    amount?: string;
    currencyCode?: string;
  };
};

type ShopifyCollection = {
  title?: string;
  handle?: string;
};

type ShopifyProduct = {
  id?: string;
  title?: string;
  handle?: string;
  descriptionHtml?: string;
  productType?: string;
  tags?: string[];
  createdAt?: string;
  publishedAt?: string;
  updatedAt?: string;
  featuredImage?: {
    url?: string;
    altText?: string;
  } | null;
  collections?: {
    nodes?: ShopifyCollection[];
  };
};

type ShopifyLineItem = {
  quantity?: number;
  sku?: string;
  title?: string;
  discountedTotalSet?: ShopifyMoneySet;
  variant?: {
    id?: string;
    sku?: string;
    inventoryQuantity?: number;
    image?: {
      url?: string;
      altText?: string;
    } | null;
    product?: ShopifyProduct | null;
  } | null;
};

type ShopifyCustomer = {
  id?: string;
  numberOfOrders?: number | string;
  createdAt?: string;
};

type ShopifyPopupCustomer = ShopifyCustomer & {
  tags?: string[];
  defaultEmailAddress?: {
    marketingState?: string;
    marketingUpdatedAt?: string | null;
  } | null;
};

type ShopifyOrder = {
  id?: string;
  name?: string;
  processedAt?: string;
  sourceName?: string;
  test?: boolean;
  cancelledAt?: string | null;
  displayFinancialStatus?: string;
  app?: {
    name?: string;
  } | null;
  customer?: ShopifyCustomer | null;
  currentSubtotalLineItemsQuantity?: number;
  currentSubtotalPriceSet?: ShopifyMoneySet;
  currentTotalPriceSet?: ShopifyMoneySet;
  currentTotalDiscountsSet?: ShopifyMoneySet;
  totalRefundedSet?: ShopifyMoneySet;
  lineItems?: {
    nodes?: ShopifyLineItem[];
    pageInfo?: {
      hasNextPage?: boolean;
    };
  };
};

type ShopifyOrdersResponse = {
  orders?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
    nodes?: ShopifyOrder[];
  };
};

type ShopifyPopupCustomersResponse = {
  customers?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
    nodes?: ShopifyPopupCustomer[];
  };
};

type ShopifyQlSessionsResponse = {
  shopifyqlQuery?: {
    tableData?: {
      columns?: Array<{
        name?: string;
        dataType?: string;
        displayName?: string;
      }>;
      rows?: unknown;
    } | null;
    parseErrors?: string[];
  } | null;
};

type HumanSessionsResult = {
  total: number;
  daily: Map<string, number>;
};

type PopupCustomersResult = {
  customers: ShopifyPopupCustomer[];
  marketingConsentAvailable: boolean;
  truncated: boolean;
};

const popupCustomerCache = new Map<string, { expiresAt: number; value: PopupCustomersResult }>();

type IsolatedResult<T> = {
  data: T | null;
  error: string;
};

type ProductAccumulator = Omit<ProductPoint, "currentSales" | "previousSales" | "currentOrders" | "previousOrders" | "action" | "actionReason" | "daily" | "confidence" | "source" | "roas"> & {
  currentSales: number;
  previousSales: number;
  currentOrderIds: Set<string>;
  previousOrderIds: Set<string>;
  dailyMap: Map<string, DailyPoint>;
  classificationSource: ProductPoint["source"];
};

type CustomerLifecycleAccumulator = Omit<CustomerLifecycleRow, "share" | "aov" | "discountRate">;

type ShopifyOrderSet = {
  orders: ShopifyOrder[];
  customerDataAvailable: boolean;
  truncated: boolean;
};

type ShopifyOrderFetchResult = {
  orders: ShopifyOrder[];
  truncated: boolean;
};

type BuyerPeriodSummary = {
  customerDataAvailable: boolean;
  ordersTruncated: boolean;
  buyerIds: Set<string>;
  guestOrders: number;
  customerRevenue: Map<string, number>;
  customerPurchaseTimestamps: Map<string, number[]>;
  customerOrders: Map<string, Array<{ processedAt: number; revenue: number; aovValue: number }>>;
};

type PeriodSummary = BuyerPeriodSummary & {
  label: string;
  netSales: number;
  grossSales: number;
  orders: number;
  discounts: number;
  refunds: number;
  unitsSold: number;
  daily: DailyPoint[];
  products: Map<string, ProductAccumulator>;
  customerLifecycle: Map<CustomerLifecycleSegment, CustomerLifecycleAccumulator>;
  currency: "USD";
};

type SalesChannelFilter = "online_store" | "all";

type DateRange = {
  days: number;
  timeZone: string;
  currentStartKey: string;
  currentEndKey: string;
  previousStartKey: string;
  previousEndKey: string;
  currentStartUtc: Date;
  currentEndUtc: Date;
  previousStartUtc: Date;
  previousEndUtc: Date;
  currentLabel: string;
  previousLabel: string;
};

function env(name: string) {
  return String(process.env[name] || "").trim();
}

function normalizeShopDomain(value: string) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
}

function validatedTimeZone(value: unknown): string {
  const candidate = String(value || "").trim();
  if (!candidate || candidate.length > 100 || !/^[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(candidate)) {
    return DEFAULT_TIME_ZONE;
  }
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: candidate }).resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function moneyAmount(set: ShopifyMoneySet | undefined): number {
  const amount = Number(set?.shopMoney?.amount);
  return Number.isFinite(amount) ? amount : 0;
}

function stripHtml(value: string | undefined): string {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function pct(current: number, previous: number): number {
  if (!previous) return current ? 1 : 0;
  return (current - previous) / Math.abs(previous);
}

function metric(label: string, value: string, delta: number | null, helper: string): MetricCard {
  return { label, value, delta, helper };
}

function salesChannelFromSearch(search: URLSearchParams): SalesChannelFilter {
  return search.get("channel") === "all" ? "all" : "online_store";
}

function orderMatchesSalesChannel(order: ShopifyOrder, channel: SalesChannelFilter): boolean {
  if (channel === "all") return true;
  const source = String(order.sourceName || "").toLowerCase();
  const appName = String(order.app?.name || "").toLowerCase();
  return source === "web" || source.includes("online") || appName === "online store";
}

function isReportableOrder(order: ShopifyOrder): boolean {
  if (order.test) return false;
  if (order.cancelledAt) return false;

  const financialStatus = String(order.displayFinancialStatus || "").toUpperCase();
  return !["VOIDED", "EXPIRED"].includes(financialStatus);
}

function dateKeyInRange(dateKey: string, startKey: string, endExclusiveKey: string): boolean {
  return Boolean(dateKey && (!startKey || dateKey >= startKey) && (!endExclusiveKey || dateKey < endExclusiveKey));
}

function lifecycleLabel(segment: CustomerLifecycleSegment): string {
  if (segment === "returning") return "Returning customers";
  if (segment === "new") return "First-time customers";
  return "Guest / unmatched";
}

function emptyLifecycleRow(segment: CustomerLifecycleSegment): CustomerLifecycleAccumulator {
  return {
    segment,
    label: lifecycleLabel(segment),
    revenue: 0,
    orders: 0,
    discounts: 0,
    grossSales: 0,
  };
}

function customerSegment(order: ShopifyOrder, customerDataAvailable: boolean): CustomerLifecycleSegment {
  if (!customerDataAvailable) return "unknown";
  if (!order.customer?.id) return "unknown";

  const orderCount = Number(order.customer.numberOfOrders || 0);
  if (Number.isFinite(orderCount) && orderCount > 1) return "returning";
  return "new";
}

function addCustomerLifecycle(
  rows: Map<CustomerLifecycleSegment, CustomerLifecycleAccumulator>,
  segment: CustomerLifecycleSegment,
  revenue: number,
  grossSales: number,
  discounts: number,
) {
  const row = rows.get(segment) || emptyLifecycleRow(segment);
  row.revenue += revenue;
  row.grossSales += grossSales;
  row.discounts += discounts;
  row.orders += 1;
  rows.set(segment, row);
}

function customerLifecycleRows(
  rows: Map<CustomerLifecycleSegment, CustomerLifecycleAccumulator>,
  totalRevenue: number,
): CustomerLifecycleRow[] {
  const order: CustomerLifecycleSegment[] = ["returning", "new", "unknown"];
  return order
    .map((segment) => {
      const row = rows.get(segment) || emptyLifecycleRow(segment);
      return {
        ...row,
        share: totalRevenue ? row.revenue / totalRevenue : 0,
        aov: row.orders ? row.revenue / row.orders : 0,
        discountRate: row.grossSales ? row.discounts / row.grossSales : 0,
      };
    })
    .filter((row) => row.revenue || row.orders || row.segment === "unknown");
}

function rowForSegment(rows: CustomerLifecycleRow[], segment: CustomerLifecycleSegment): CustomerLifecycleRow {
  return rows.find((row) => row.segment === segment) || {
    ...emptyLifecycleRow(segment),
    share: 0,
    aov: 0,
    discountRate: 0,
  };
}

function lifecycleDiagnosis(rows: CustomerLifecycleRow[], available: boolean): string {
  if (!available) {
    return "Customer lifecycle is locked because the app does not have read_customers scope yet. Shopify revenue still loads, but new vs returning discount pressure cannot be trusted until that scope is granted.";
  }

  const returning = rowForSegment(rows, "returning");
  const firstTime = rowForSegment(rows, "new");
  const unknown = rowForSegment(rows, "unknown");
  const newDiscountPressure = firstTime.discountRate - returning.discountRate;

  if (unknown.share >= 0.2) {
    return "A meaningful share of revenue is from guest or unmatched checkouts, so treat the split as directional. Encourage customer identification before using discount strategy conclusions too aggressively.";
  }

  if (returning.share >= 0.45 && returning.discountRate > firstTime.discountRate) {
    return "Returning customers are carrying a large share of revenue and using more discount than first-time buyers. That can be healthy retention for hunting/fishing communities, but watch margin by cohort.";
  }

  if (firstTime.share >= 0.45 && newDiscountPressure >= 0.05) {
    return "Discount pressure is heavier on first-time customers. That suggests acquisition may be relying on markdowns, so test price, offer, and creative before scaling spend.";
  }

  if (returning.share < 0.25) {
    return "Repeat revenue is still light for a loyalty-heavy niche. Build post-purchase flows and collection-specific follow-up before relying on one-time acquisition.";
  }

  return "New and returning customer economics look balanced. Use this panel as the guardrail for discount tests, not just the total discount rate.";
}

function customerLifecycleSummary(period: PeriodSummary): CustomerLifecycleSummary {
  const rows = customerLifecycleRows(period.customerLifecycle, period.netSales);
  const returning = rowForSegment(rows, "returning");
  const firstTime = rowForSegment(rows, "new");
  const unknown = rowForSegment(rows, "unknown");

  return {
    available: period.customerDataAvailable,
    rows,
    newCustomerRevenueShare: firstTime.share,
    returningRevenueShare: returning.share,
    unknownRevenueShare: unknown.share,
    newCustomerDiscountRate: firstTime.discountRate,
    returningDiscountRate: returning.discountRate,
    diagnosis: lifecycleDiagnosis(rows, period.customerDataAvailable),
  };
}

function datePartsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
    minute: Number(map.get("minute")),
    second: Number(map.get("second")),
  };
}

function dateKeyInZone(date: Date, timeZone: string): string {
  const part = datePartsInZone(date, timeZone);
  return `${part.year}-${String(part.month).padStart(2, "0")}-${String(part.day).padStart(2, "0")}`;
}

function offsetMsAt(date: Date, timeZone: string): number {
  const part = datePartsInZone(date, timeZone);
  const asUtc = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second);
  return asUtc - date.getTime();
}

function zonedDateStartUtc(dateKey: string, timeZone: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  let utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  for (let i = 0; i < 3; i += 1) {
    utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMsAt(utc, timeZone));
  }
  return utc;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0));
  return date.toISOString().slice(0, 10);
}

function rangeDays(startKey: string, endExclusiveKey: string): number {
  const start = Date.parse(`${startKey}T00:00:00Z`);
  const end = Date.parse(`${endExclusiveKey}T00:00:00Z`);
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

function filledDaily(startKey: string, endExclusiveKey: string, rows: Map<string, DailyPoint>): DailyPoint[] {
  const output: DailyPoint[] = [];
  for (let key = startKey; key < endExclusiveKey; key = addDaysToDateKey(key, 1)) {
    output.push(rows.get(key) || { date: key, netSales: 0, orders: 0 });
  }
  return output;
}

function buildRange(search: URLSearchParams, timeZone: string): DateRange {
  const requestedStart = search.get("start") || "";
  const requestedEnd = search.get("end") || "";
  const hasCustomRange = Boolean(requestedStart && requestedEnd);
  let days = Math.max(1, Math.min(Number(search.get("days") || 14), 60));
  let currentStartKey: string;
  let currentEndKey: string;
  let currentLabel: string;

  if (hasCustomRange) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedStart) || !/^\d{4}-\d{2}-\d{2}$/.test(requestedEnd)) {
      throw new Error("Start and end must use YYYY-MM-DD");
    }
    if (requestedEnd < requestedStart) throw new Error("End date must be on or after start date");
    currentStartKey = requestedStart;
    currentEndKey = addDaysToDateKey(requestedEnd, 1);
    days = Math.min(rangeDays(currentStartKey, currentEndKey), 60);
    currentEndKey = addDaysToDateKey(currentStartKey, days);
    currentLabel = `${currentStartKey} - ${addDaysToDateKey(currentEndKey, -1)}`;
  } else {
    const today = dateKeyInZone(new Date(), timeZone);
    currentEndKey = addDaysToDateKey(today, 1);
    currentStartKey = addDaysToDateKey(currentEndKey, -days);
    currentLabel = days === 1 ? "Yesterday" : `Last ${days} days`;
  }

  const previousEndKey = currentStartKey;
  const previousStartKey = addDaysToDateKey(previousEndKey, -days);

  return {
    days,
    timeZone,
    currentStartKey,
    currentEndKey,
    previousStartKey,
    previousEndKey,
    currentStartUtc: zonedDateStartUtc(currentStartKey, timeZone),
    currentEndUtc: zonedDateStartUtc(currentEndKey, timeZone),
    previousStartUtc: zonedDateStartUtc(previousStartKey, timeZone),
    previousEndUtc: zonedDateStartUtc(previousEndKey, timeZone),
    currentLabel,
    previousLabel: hasCustomRange
      ? `${previousStartKey} - ${addDaysToDateKey(previousEndKey, -1)} comparison`
      : `Previous ${days} days`,
  };
}

function shopifyQueryForRange(start: Date, end: Date) {
  return `processed_at:>=${start.toISOString()} processed_at:<${end.toISOString()} status:any`;
}

async function shopifyGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  session?: ShopifySession | null,
): Promise<T> {
  const shop = normalizeShopDomain(session?.shop || env("SHOPIFY_STORE_DOMAIN") || env("SHOPIFY_SHOP_DOMAIN"));
  const token = session?.accessToken || env("SHOPIFY_ADMIN_ACCESS_TOKEN");
  const version = env("SHOPIFY_API_VERSION") || DEFAULT_API_VERSION;

  if (!shop) throw new Error("SHOPIFY_STORE_DOMAIN is not configured");
  if (!token) throw new Error("SHOPIFY_ADMIN_ACCESS_TOKEN is not configured");

  const response = await fetch(`https://${shop}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-access-token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errors?.length) {
    const message = response.status === 401
      ? "Shopify Admin API returned 401. V2 did not receive the OAuth session token that V1 uses, or SHOPIFY_ADMIN_ACCESS_TOKEN is invalid."
      : payload.errors?.[0]?.message || `Shopify Admin API returned ${response.status}`;
    throw new Error(message);
  }

  return payload.data as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unknown Shopify error");
}

async function isolate<T>(promise: Promise<T>): Promise<IsolatedResult<T>> {
  try {
    return { data: await promise, error: "" };
  } catch (error) {
    return { data: null, error: errorMessage(error) };
  }
}

function sessionsShopifyQl(startKey: string, endExclusiveKey: string, timeZone: string): string {
  const inclusiveEndKey = addDaysToDateKey(endExclusiveKey, -1);
  const reportTimeZone = validatedTimeZone(timeZone);
  return [
    "FROM sessions",
    "SHOW sessions",
    `WITH TIMEZONE '${reportTimeZone}'`,
    "WHERE human_or_bot_session = 'human'",
    "TIMESERIES day",
    `SINCE ${startKey}`,
    `UNTIL ${inclusiveEndKey}`,
    "ORDER BY day ASC",
  ].join("\n");
}

function shopifyQlRows(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row));
}

async function fetchHumanSessions(
  startKey: string,
  endExclusiveKey: string,
  timeZone: string,
  session?: ShopifySession | null,
): Promise<HumanSessionsResult> {
  const data = await shopifyGraphql<ShopifyQlSessionsResponse>(HUMAN_SESSIONS_QUERY, {
    query: sessionsShopifyQl(startKey, endExclusiveKey, timeZone),
  }, session);
  const result = data.shopifyqlQuery;
  const parseErrors = result?.parseErrors || [];
  if (parseErrors.length) {
    throw new Error(`ShopifyQL sessions query failed: ${parseErrors.join("; ")}`);
  }
  if (!result?.tableData) {
    throw new Error("ShopifyQL sessions returned no table data");
  }
  if (!Array.isArray(result.tableData.rows)) {
    throw new Error("ShopifyQL sessions returned an invalid rows payload");
  }

  const daily = new Map<string, number>();
  let parsedRows = 0;
  const rows = shopifyQlRows(result.tableData.rows);
  for (const row of rows) {
    const day = String(row.day || "").slice(0, 10);
    if (row.sessions === null || row.sessions === undefined) continue;
    const sessions = Number(row.sessions);
    if (!dateKeyInRange(day, startKey, endExclusiveKey) || !Number.isFinite(sessions)) continue;
    daily.set(day, (daily.get(day) || 0) + Math.max(0, Math.round(sessions)));
    parsedRows += 1;
  }
  if (rows.length && !parsedRows) {
    throw new Error("ShopifyQL sessions returned rows without readable day/session values");
  }

  return {
    total: Array.from(daily.values()).reduce((sum, value) => sum + value, 0),
    daily,
  };
}

function isMarketingConsentFieldError(error: unknown): boolean {
  return /defaultEmailAddress|marketing(State|UpdatedAt)|protected customer data|access denied/i.test(errorMessage(error));
}

async function fetchPopupCustomerPages(
  includeMarketingConsent: boolean,
  session?: ShopifySession | null,
): Promise<PopupCustomersResult> {
  const customers = new Map<string, ShopifyPopupCustomer>();
  const query = includeMarketingConsent ? POPUP_CUSTOMERS_QUERY : POPUP_CUSTOMERS_WITHOUT_MARKETING_QUERY;
  let after: string | null = null;
  let hasNextPage = false;

  for (let page = 0; page < MAX_CUSTOMER_PAGES; page += 1) {
    const data: ShopifyPopupCustomersResponse = await shopifyGraphql<ShopifyPopupCustomersResponse>(query, {
      first: CUSTOMER_PAGE_SIZE,
      after,
    }, session);
    for (const customer of data.customers?.nodes || []) {
      if (customer.id) customers.set(customer.id, customer);
    }

    hasNextPage = Boolean(data.customers?.pageInfo?.hasNextPage);
    if (!hasNextPage) break;
    const nextCursor = data.customers?.pageInfo?.endCursor || null;
    if (!nextCursor || nextCursor === after) break;
    after = nextCursor;
  }

  return {
    customers: Array.from(customers.values()),
    marketingConsentAvailable: includeMarketingConsent,
    truncated: hasNextPage,
  };
}

async function fetchPopupCustomers(session?: ShopifySession | null): Promise<PopupCustomersResult> {
  const shop = normalizeShopDomain(session?.shop || env("SHOPIFY_STORE_DOMAIN") || env("SHOPIFY_SHOP_DOMAIN"));
  const cached = shop ? popupCustomerCache.get(shop) : undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let result: PopupCustomersResult;
  try {
    result = await fetchPopupCustomerPages(true, session);
  } catch (error) {
    if (!isMarketingConsentFieldError(error)) throw error;
    result = await fetchPopupCustomerPages(false, session);
  }
  if (shop) popupCustomerCache.set(shop, { expiresAt: Date.now() + POPUP_CUSTOMER_CACHE_MS, value: result });
  return result;
}

function mergeSessions(daily: DailyPoint[], sessions: HumanSessionsResult | null): DailyPoint[] {
  if (!sessions) return daily;
  return daily.map((row) => ({
    ...row,
    sessions: sessions.daily.get(row.date) || 0,
  }));
}

async function shopifyTimeZone(session?: ShopifySession | null): Promise<string> {
  try {
    const data = await shopifyGraphql<{ shop?: { ianaTimezone?: string } }>(SHOP_QUERY, {}, session);
    return validatedTimeZone(data.shop?.ianaTimezone);
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

async function fetchOrders(
  start: Date,
  end: Date,
  session?: ShopifySession | null,
  includeCustomers = true,
): Promise<ShopifyOrderFetchResult> {
  const orders: ShopifyOrder[] = [];
  let after: string | null = null;
  let hasNextPage = false;
  const query = includeCustomers ? INSIGHT_ORDERS_QUERY : INSIGHT_ORDERS_WITHOUT_CUSTOMERS_QUERY;

  for (let page = 0; page < MAX_ORDER_PAGES; page += 1) {
    const data: ShopifyOrdersResponse = await shopifyGraphql<ShopifyOrdersResponse>(query, {
      first: ORDER_PAGE_SIZE,
      after,
      query: shopifyQueryForRange(start, end),
    }, session);

    orders.push(...(data.orders?.nodes || []));
    hasNextPage = Boolean(data.orders?.pageInfo?.hasNextPage);
    if (!hasNextPage) break;
    const nextCursor = data.orders?.pageInfo?.endCursor || null;
    if (!nextCursor || nextCursor === after) break;
    after = nextCursor;
  }

  return { orders, truncated: hasNextPage };
}

function isCustomerScopeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /customer|read_customers|access denied/i.test(message);
}

async function fetchOrdersWithCustomerFallback(
  start: Date,
  end: Date,
  session?: ShopifySession | null,
): Promise<ShopifyOrderSet> {
  try {
    const result = await fetchOrders(start, end, session, true);
    return {
      ...result,
      customerDataAvailable: true,
    };
  } catch (error) {
    if (!isCustomerScopeError(error)) throw error;
    const result = await fetchOrders(start, end, session, false);
    return {
      ...result,
      customerDataAvailable: false,
    };
  }
}

function apparelLabel(productType: string, title: string): string {
  const value = `${productType} ${title}`.toLowerCase();
  if (value.includes("hoodie")) return "Hoodie";
  if (value.includes("sweatshirt")) return "Sweatshirt";
  if (value.includes("long sleeve")) return "Long sleeve";
  if (value.includes("tank")) return "Tank top";
  if (value.includes("hat") || value.includes("cap")) return "Hat / cap";
  if (value.includes("comfort colors")) return "Comfort Colors tee";
  if (value.includes("bella")) return "Bella Canvas tee";
  if (value.includes("gildan")) return "Gildan tee";
  if (value.includes("t-shirt") || value.includes("tee") || value.includes("shirt")) return "T-shirt / tee";
  return productType || "Unclassified";
}

function classifyTheme(product: Pick<ProductPoint, "title" | "collections" | "tags" | "descriptionText" | "productType">): {
  theme: string;
  designFamily: string;
  source: ProductPoint["source"];
} {
  const collections = product.collections.join(" ").toLowerCase();
  const tags = product.tags.join(" ").toLowerCase();
  const title = product.title.toLowerCase();
  const description = product.descriptionText.toLowerCase();
  const sourceText = [collections, tags, title, description].join(" ");
  const source: ProductPoint["source"] = collections
    ? "Shopify collection"
    : product.productType
      ? "Product type"
      : description
        ? "Description"
        : "Product title";

  if (sourceText.includes("turkey")) {
    return {
      theme: "Turkey hunting",
      designFamily: sourceText.includes("slam") ? "Turkey Slam / subspecies" : "Turkey wildlife graphic",
      source,
    };
  }
  if (sourceText.includes("waterfowl") || sourceText.includes("duck")) {
    return { theme: "Waterfowl hunting", designFamily: "Waterfowl graphic", source };
  }
  if (sourceText.includes("deer") || sourceText.includes("buck")) {
    return { theme: "Deer hunting", designFamily: "Deer / buck graphic", source };
  }
  if (sourceText.includes("hunting")) {
    return { theme: "Hunting general", designFamily: "Hunting lifestyle graphic", source };
  }
  if (sourceText.includes("trout")) {
    return { theme: "Fishing / trout", designFamily: "Fish species graphic", source };
  }
  if (sourceText.includes("bass")) {
    return { theme: "Fishing / bass", designFamily: "Bass fishing graphic", source };
  }
  if (sourceText.includes("fish") || sourceText.includes("offshore") || sourceText.includes("mahi")) {
    return { theme: "Fishing general", designFamily: "Fishing graphic", source };
  }
  if (sourceText.includes("father") || sourceText.includes("dad") || sourceText.includes("papa")) {
    return { theme: "Father's Day gifting", designFamily: "Giftable text graphic", source };
  }
  if (sourceText.includes("national park") || sourceText.includes("map")) {
    return { theme: "National park / outdoor", designFamily: "Map / destination graphic", source };
  }
  if (sourceText.includes("patriotic") || sourceText.includes("america") || sourceText.includes("usa")) {
    return { theme: "Patriotic / lifestyle", designFamily: "Patriotic graphic", source };
  }
  return { theme: "Lifestyle / unclassified", designFamily: "General POD graphic", source };
}

function actionForProduct(currentOrders: number, currentSales: number, previousSales: number, daysLive: number | null): ProductAction {
  const delta = pct(currentSales, previousSales);
  if (currentOrders >= 10 && delta >= 0.08) return "scale";
  if (currentOrders >= 10 && previousSales > 0 && delta <= -0.25 && (daysLive === null || daysLive >= 14)) return "fix";
  return "watch";
}

function actionReason(product: ProductPoint): string {
  const delta = pct(product.currentSales, product.previousSales);
  if (product.action === "scale") {
    return `${product.title} is up ${percentValue(Math.abs(delta))} with ${integer(product.currentOrders)} orders. Scale only after checking inventory, product page conversion, and Meta ROAS.`;
  }
  if (product.action === "fix") {
    return `${product.title} is down ${percentValue(Math.abs(delta))} versus comparison. Fix product page, creative, price, season timing, and collection placement before adding traffic.`;
  }
  if (product.currentOrders < 10) {
    return `${product.title} has fewer than 10 orders in the selected period, so keep it in watch until the sample is cleaner.`;
  }
  return `${product.title} has mixed signal. Watch daily velocity and Meta spend before making a hard scale or fix call.`;
}

function seasonStatus(theme: string): ThemeRow["status"] {
  const month = new Date().getUTCMonth() + 1;
  const lower = theme.toLowerCase();
  if (lower.includes("father")) return month === 6 ? "Event" : "Pre-season";
  if (lower.includes("fishing") || lower.includes("national park")) return month >= 5 && month <= 8 ? "In season" : "Pre-season";
  if (lower.includes("turkey")) return month >= 3 && month <= 5 ? "In season" : "Off-season";
  if (lower.includes("deer") || lower.includes("waterfowl")) return month >= 8 && month <= 12 ? "Pre-season" : "Off-season";
  return "In season";
}

function listingDate(product: ShopifyProduct | undefined): string {
  return String(product?.publishedAt || product?.createdAt || "").slice(0, 10);
}

function daysSince(dateKey: string): number | null {
  if (!dateKey) return null;
  const date = Date.parse(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, Math.round((Date.now() - date) / 86_400_000));
}

function productKey(product: ShopifyProduct | undefined, line: ShopifyLineItem): string {
  return product?.id || line.variant?.id || line.sku || line.title || "unknown-product";
}

function isExcludedMerchandise(line: ShopifyLineItem): boolean {
  const product = line.variant?.product || undefined;
  const text = [
    product?.title,
    product?.handle,
    product?.productType,
    line.title,
    ...(product?.tags || []),
  ].join(" ").toLowerCase();

  return (
    text.includes("shipping protection") ||
    text.includes("shipping insurance") ||
    text.includes("selleasy-exclude") ||
    text.includes("route protection")
  );
}

function ensureProduct(map: Map<string, ProductAccumulator>, line: ShopifyLineItem): ProductAccumulator {
  const product = line.variant?.product || undefined;
  const key = productKey(product, line);
  const existing = map.get(key);
  if (existing) return existing;

  const title = product?.title || line.title || "Unknown product";
  const productType = product?.productType || "";
  const collections = (product?.collections?.nodes || []).map((collection) => collection.title || collection.handle || "").filter(Boolean);
  const tags = product?.tags || [];
  const descriptionText = stripHtml(product?.descriptionHtml);
  const classified = classifyTheme({
    title,
    productType,
    collections,
    tags,
    descriptionText,
  });
  const productListingDate = listingDate(product);

  const next: ProductAccumulator = {
    id: key,
    title,
    handle: product?.handle || key,
    imageUrl: line.variant?.image?.url || product?.featuredImage?.url || "",
    productType: productType || "Unknown",
    apparelType: apparelLabel(productType, title),
    theme: classified.theme,
    designFamily: classified.designFamily,
    collections,
    tags,
    descriptionText,
    listingDate: productListingDate,
    unitsSold: 0,
    inventory: 0,
    daysOfCover: null,
    currentSales: 0,
    previousSales: 0,
    currentOrderIds: new Set<string>(),
    previousOrderIds: new Set<string>(),
    dailyMap: new Map<string, DailyPoint>(),
    classificationSource: classified.source,
  };

  map.set(key, next);
  return next;
}

function addDaily(map: Map<string, DailyPoint>, date: string, netSales: number, orders: number) {
  const row = map.get(date) || { date, netSales: 0, orders: 0 };
  row.netSales += netSales;
  row.orders += orders;
  map.set(date, row);
}

function emptyBuyerPeriod(customerDataAvailable: boolean, ordersTruncated: boolean): BuyerPeriodSummary {
  return {
    customerDataAvailable,
    ordersTruncated,
    buyerIds: new Set<string>(),
    guestOrders: 0,
    customerRevenue: new Map<string, number>(),
    customerPurchaseTimestamps: new Map<string, number[]>(),
    customerOrders: new Map<string, Array<{ processedAt: number; revenue: number; aovValue: number }>>(),
  };
}

function addBuyerOrder(
  period: BuyerPeriodSummary,
  order: ShopifyOrder,
  revenue: number,
  aovValue: number,
): void {
  if (!period.customerDataAvailable) return;
  const customerId = order.customer?.id || "";
  if (!customerId) {
    period.guestOrders += 1;
    return;
  }

  period.buyerIds.add(customerId);
  period.customerRevenue.set(customerId, (period.customerRevenue.get(customerId) || 0) + revenue);
  const processedAt = Date.parse(String(order.processedAt || ""));
  if (!Number.isFinite(processedAt)) return;
  const timestamps = period.customerPurchaseTimestamps.get(customerId) || [];
  timestamps.push(processedAt);
  period.customerPurchaseTimestamps.set(customerId, timestamps);
  const orders = period.customerOrders.get(customerId) || [];
  orders.push({ processedAt, revenue, aovValue });
  period.customerOrders.set(customerId, orders);
}

function summarizeBuyerPeriod(
  orders: ShopifyOrder[],
  timeZone: string,
  startKey: string,
  endKey: string,
  customerDataAvailable: boolean,
  ordersTruncated: boolean,
): BuyerPeriodSummary {
  const period = emptyBuyerPeriod(customerDataAvailable, ordersTruncated);
  const seenOrderIds = new Set<string>();

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index];
    if (!isReportableOrder(order)) continue;
    const processedAt = new Date(String(order.processedAt || ""));
    if (!Number.isFinite(processedAt.getTime())) continue;
    const date = dateKeyInZone(processedAt, timeZone);
    if (!dateKeyInRange(date, startKey, endKey)) continue;
    const orderId = order.id || `${date}-${index}`;
    if (seenOrderIds.has(orderId)) continue;
    seenOrderIds.add(orderId);
    const revenue = moneyAmount(order.currentTotalPriceSet);
    const aovValue = moneyAmount(order.currentSubtotalPriceSet) || revenue;
    addBuyerOrder(period, order, revenue, aovValue);
  }

  return period;
}

function summarizePeriod(
  orders: ShopifyOrder[],
  label: string,
  timeZone: string,
  startKey: string,
  endKey: string,
  customerDataAvailable: boolean,
  ordersTruncated: boolean,
  targetProducts?: Map<string, ProductAccumulator>,
): PeriodSummary {
  const dailyMap = new Map<string, DailyPoint>();
  const products = targetProducts || new Map<string, ProductAccumulator>();
  const customerLifecycle = new Map<CustomerLifecycleSegment, CustomerLifecycleAccumulator>();
  const buyerPeriod = emptyBuyerPeriod(customerDataAvailable, ordersTruncated);
  const period: PeriodSummary = {
    ...buyerPeriod,
    label,
    netSales: 0,
    grossSales: 0,
    orders: 0,
    discounts: 0,
    refunds: 0,
    unitsSold: 0,
    daily: [],
    products,
    customerLifecycle,
    currency: "USD",
  };
  const seenOrderIds = new Set<string>();

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index];
    if (!isReportableOrder(order)) continue;

    const processedAt = new Date(String(order.processedAt || ""));
    if (!Number.isFinite(processedAt.getTime())) continue;
    const date = dateKeyInZone(processedAt, timeZone);
    if (!dateKeyInRange(date, startKey, endKey)) continue;

    const orderId = order.id || `${date}-${index}`;
    if (seenOrderIds.has(orderId)) continue;
    seenOrderIds.add(orderId);

    const netSales = moneyAmount(order.currentTotalPriceSet);
    const grossSales = moneyAmount(order.currentSubtotalPriceSet) || netSales;
    const discounts = moneyAmount(order.currentTotalDiscountsSet);
    const refunds = moneyAmount(order.totalRefundedSet);
    const unitsSold = Number(order.currentSubtotalLineItemsQuantity || 0);

    period.netSales += netSales;
    period.grossSales += grossSales;
    period.orders += 1;
    period.discounts += discounts;
    period.refunds += refunds;
    period.unitsSold += unitsSold;
    addDaily(dailyMap, date, netSales, 1);
    addCustomerLifecycle(customerLifecycle, customerSegment(order, customerDataAvailable), netSales, grossSales, discounts);

    addBuyerOrder(period, order, netSales, grossSales);

    for (const line of order.lineItems?.nodes || []) {
      if (isExcludedMerchandise(line)) continue;
      const product = ensureProduct(products, line);
      const lineSales = moneyAmount(line.discountedTotalSet);
      const quantity = Number(line.quantity || 0);
      const isPrevious = label.toLowerCase().includes("previous") || label.toLowerCase().includes("comparison");

      if (isPrevious) {
        product.previousSales += lineSales;
        product.previousOrderIds.add(orderId);
      } else {
        product.currentSales += lineSales;
        product.currentOrderIds.add(orderId);
        addDaily(product.dailyMap, date, lineSales, 1);
        product.unitsSold += quantity;
        const inventory = Number(line.variant?.inventoryQuantity || 0);
        if (inventory > product.inventory) product.inventory = inventory;
      }
    }
  }

  period.daily = filledDaily(startKey, endKey, dailyMap);
  return period;
}

function productConfidence(product: ProductAccumulator): number {
  let score = 35;
  if (product.currentOrderIds.size >= 10) score += 20;
  if (product.currentOrderIds.size >= 30) score += 12;
  if (product.collections.length) score += 14;
  if (product.listingDate) score += 8;
  if (product.imageUrl) score += 6;
  if (product.descriptionText) score += 5;
  return Math.min(96, score);
}

function mapProducts(products: Map<string, ProductAccumulator>, daily: DailyPoint[]): ProductPoint[] {
  return Array.from(products.values())
    .map((product) => {
      const currentOrders = product.currentOrderIds.size;
      const previousOrders = product.previousOrderIds.size;
      const daysLive = daysSince(product.listingDate);
      const velocity = product.unitsSold / Math.max(1, daily.filter((row) => row.orders > 0).length);
      const daysOfCover = product.inventory > 0 && velocity > 0 ? product.inventory / velocity : null;
      const action = actionForProduct(currentOrders, product.currentSales, product.previousSales, daysLive);
      const mapped: ProductPoint = {
        ...product,
        currentOrders,
        previousOrders,
        daysOfCover,
        confidence: productConfidence(product),
        roas: null,
        action,
        actionReason: "",
        source: product.classificationSource,
        daily: daily.map((day) => product.dailyMap.get(day.date) || { date: day.date, netSales: 0, orders: 0 }),
      };
      mapped.actionReason = actionReason(mapped);
      return mapped;
    })
    .filter((product) => product.currentSales > 0 || product.previousSales > 0)
    .sort((a, b) => b.currentSales - a.currentSales);
}

function mapBlankPerformance(products: ProductPoint[]): BlankPerformanceRow[] {
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

function mapThemes(products: ProductPoint[]): ThemeRow[] {
  const total = products.reduce((sum, product) => sum + product.currentSales, 0) || 1;
  const byTheme = new Map<string, ThemeRow>();
  for (const product of products) {
    const row = byTheme.get(product.theme) || {
      theme: product.theme,
      status: seasonStatus(product.theme),
      revenue: 0,
      share: 0,
      products: 0,
    };
    row.revenue += product.currentSales;
    row.products += 1;
    byTheme.set(product.theme, row);
  }
  return Array.from(byTheme.values())
    .map((row) => ({ ...row, share: row.revenue / total }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function observedPopupSignupTimestamp(customer: ShopifyPopupCustomer): number | null {
  const marketingState = String(customer.defaultEmailAddress?.marketingState || "").toUpperCase();
  const consentTimestamp = ["SUBSCRIBED", "PENDING"].includes(marketingState)
    ? customer.defaultEmailAddress?.marketingUpdatedAt
    : null;
  for (const value of [consentTimestamp, customer.createdAt]) {
    const timestamp = Date.parse(String(value || ""));
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

function timestampInRange(timestamp: number | null, start: Date, end: Date): boolean {
  return timestamp !== null && timestamp >= start.getTime() && timestamp < end.getTime();
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return numerator / denominator;
}

function popupCustomerTags(customer: ShopifyPopupCustomer): Set<string> {
  return new Set((customer.tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

function popupCustomersInRange(
  popup: PopupCustomersResult,
  start: Date,
  end: Date,
): PopupSignupCohortMember[] {
  const customers: PopupSignupCohortMember[] = [];
  for (const customer of popup.customers) {
    const signupTimestamp = observedPopupSignupTimestamp(customer);
    if (signupTimestamp !== null && timestampInRange(signupTimestamp, start, end)) {
      const tags = popupCustomerTags(customer);
      customers.push({
        customer,
        signupTimestamp,
        recognizedSegments: POPUP_SEGMENTS.filter((segment) => tags.has(segment.tag)).map((segment) => segment.key),
      });
    }
  }
  return customers;
}

type PopupSignupCohortMember = {
  customer: ShopifyPopupCustomer;
  signupTimestamp: number;
  recognizedSegments: PopupSegmentKey[];
};

type PopupCohortPerformance = {
  customers: number;
  share: number | null;
  periodBuyers: number | null;
  buyerRate: number | null;
  periodOrders: number | null;
  periodRevenue: number | null;
  aov: number | null;
};

function hasPurchaseAtOrAfter(period: BuyerPeriodSummary, customerId: string, timestamp: number): boolean {
  return (period.customerPurchaseTimestamps.get(customerId) || []).some((processedAt) => processedAt >= timestamp);
}

function buyerDataUsable(period: BuyerPeriodSummary): boolean {
  return period.customerDataAvailable && !period.ordersTruncated;
}

function popupAudienceMetrics(period: BuyerPeriodSummary, popup: PopupCustomersResult): {
  buyers: number;
  revenue: number;
} {
  let buyers = 0;
  let revenue = 0;
  for (const customer of popup.customers) {
    const customerId = customer.id || "";
    if (!customerId || !period.buyerIds.has(customerId)) continue;
    buyers += 1;
    revenue += period.customerRevenue.get(customerId) || 0;
  }
  return { buyers, revenue };
}

function growthPeriodSnapshot(
  selectedChannelPeriod: BuyerPeriodSummary,
  funnelPeriod: BuyerPeriodSummary,
  sessions: HumanSessionsResult | null,
  popup: PopupCustomersResult | null,
  start: Date,
  end: Date,
): GrowthPeriodSnapshot {
  const estimatedSignups = popup ? popupCustomersInRange(popup, start, end) : null;
  const selectedBuyersAvailable = buyerDataUsable(selectedChannelPeriod);
  const funnelBuyersAvailable = buyerDataUsable(funnelPeriod);
  const audience = popup && selectedBuyersAvailable ? popupAudienceMetrics(selectedChannelPeriod, popup) : null;
  let estimatedSignupBuyers: number | null = null;

  if (estimatedSignups && funnelBuyersAvailable) {
    estimatedSignupBuyers = estimatedSignups.reduce((count, signup) => {
      const customerId = signup.customer.id || "";
      return customerId && hasPurchaseAtOrAfter(funnelPeriod, customerId, signup.signupTimestamp) ? count + 1 : count;
    }, 0);
  }

  return {
    humanSessions: sessions?.total ?? null,
    uniqueBuyers: selectedBuyersAvailable ? selectedChannelPeriod.buyerIds.size : null,
    guestOrders: selectedBuyersAvailable ? selectedChannelPeriod.guestOrders : null,
    estimatedPopupSignups: estimatedSignups?.length ?? null,
    estimatedPopupSignupBuyers: estimatedSignupBuyers,
    popupAudienceBuyers: audience?.buyers ?? null,
    popupAudienceRevenue: audience?.revenue ?? null,
  };
}

function popupCohortPerformance(
  period: BuyerPeriodSummary,
  cohort: PopupSignupCohortMember[],
  shareDenominator: number,
): PopupCohortPerformance {
  const customers = cohort.length;
  const share = shareDenominator > 0 ? customers / shareDenominator : null;
  if (!buyerDataUsable(period)) {
    return {
      customers,
      share,
      periodBuyers: null,
      buyerRate: null,
      periodOrders: null,
      periodRevenue: null,
      aov: null,
    };
  }

  let periodBuyers = 0;
  let periodOrders = 0;
  let periodRevenue = 0;
  let periodAovValue = 0;
  for (const signup of cohort) {
    const customerId = signup.customer.id || "";
    if (!customerId) continue;
    const qualifyingOrders = (period.customerOrders.get(customerId) || [])
      .filter((order) => order.processedAt >= signup.signupTimestamp);
    if (!qualifyingOrders.length) continue;
    periodBuyers += 1;
    periodOrders += qualifyingOrders.length;
    periodRevenue += qualifyingOrders.reduce((sum, order) => sum + order.revenue, 0);
    periodAovValue += qualifyingOrders.reduce((sum, order) => sum + order.aovValue, 0);
  }

  return {
    customers,
    share,
    periodBuyers,
    buyerRate: customers ? periodBuyers / customers : null,
    periodOrders,
    periodRevenue,
    aov: periodOrders ? periodAovValue / periodOrders : null,
  };
}

function popupSegmentRows(period: BuyerPeriodSummary, cohort: PopupSignupCohortMember[]): PopupSegmentRow[] {
  const periodSignups = cohort.length;
  return POPUP_SEGMENTS.map((segment) => {
    const segmentCohort = cohort.filter((signup) => signup.recognizedSegments.includes(segment.key));
    return {
      key: segment.key,
      label: segment.label,
      ...popupCohortPerformance(period, segmentCohort, periodSignups),
    };
  });
}

function popupSelectionDepthRows(
  period: BuyerPeriodSummary,
  cohort: PopupSignupCohortMember[],
): PopupSelectionDepthRow[] {
  const eligibleSignups = cohort.filter((signup) => signup.recognizedSegments.length > 0).length;
  const groups: Array<{
    key: PopupSelectionDepthRow["key"];
    label: string;
    matches: (count: number) => boolean;
  }> = [
    { key: "one", label: "1 option", matches: (count) => count === 1 },
    { key: "two", label: "2 options", matches: (count) => count === 2 },
    { key: "three_plus", label: "3+ options", matches: (count) => count >= 3 },
  ];

  return groups.map((group) => ({
    key: group.key,
    label: group.label,
    ...popupCohortPerformance(
      period,
      cohort.filter((signup) => group.matches(signup.recognizedSegments.length)),
      eligibleSignups,
    ),
  }));
}

function sessionsCoverage(
  current: IsolatedResult<HumanSessionsResult>,
  previous: IsolatedResult<HumanSessionsResult>,
): GrowthCoverageDetail {
  const currentAvailable = Boolean(current.data);
  const previousAvailable = Boolean(previous.data);
  if (currentAvailable && previousAvailable) {
    return {
      state: "live",
      source: "ShopifyQL sessions",
      reason: "Human online-store sessions are live; ShopifyQL filters human_or_bot_session to human.",
    };
  }

  const missing = [
    !currentAvailable ? `Current period: ${current.error}` : "",
    !previousAvailable ? `Comparison: ${previous.error}` : "",
  ].filter(Boolean).join(" ");
  return {
    state: currentAvailable || previousAvailable ? "partial" : "missing",
    source: "ShopifyQL sessions",
    reason: `Sessions need read_reports and Shopify protected customer data access. ${missing}`.trim(),
  };
}

function buyersCoverage(current: PeriodSummary, previous: PeriodSummary): GrowthCoverageDetail {
  const currentAvailable = buyerDataUsable(current);
  const previousAvailable = buyerDataUsable(previous);
  if (currentAvailable && previousAvailable) {
    return {
      state: "live",
      source: "Shopify Admin orders",
      reason: "The buyer snapshot follows the selected sales channel; popup-signup funnel purchases always use Online Store orders. Guest orders stay separate.",
    };
  }
  const truncationReason = current.ordersTruncated || previous.ordersTruncated
    ? " One or both order periods exceeded the pagination safety limit."
    : "";
  const permissionReason = !current.customerDataAvailable || !previous.customerDataAvailable
    ? " Buyer identity is unavailable for one or both periods. Reauthorize the app with read_customers."
    : "";
  return {
    state: currentAvailable || previousAvailable || current.ordersTruncated || previous.ordersTruncated ? "partial" : "missing",
    source: "Shopify Admin orders",
    reason: `${permissionReason}${truncationReason}`.trim(),
  };
}

function popupCoverage(result: IsolatedResult<PopupCustomersResult>): GrowthCoverageDetail {
  if (!result.data) {
    return {
      state: "missing",
      source: "Shopify customer tag: popup",
      reason: `Popup customers need read_customers. ${result.error}`.trim(),
    };
  }

  const consentDetail = result.data.marketingConsentAvailable
    ? "Signup timing uses marketingUpdatedAt only for subscribed or pending consent, then falls back to customer createdAt."
    : "Protected marketing consent fields are unavailable, so signup timing estimates customer createdAt only.";
  return {
    state: result.data.truncated ? "partial" : "estimated",
    source: "Shopify customer tag: popup",
    reason: `${consentDetail} Interest and selection-depth groups use each customer's current tags; Shopify does not provide a historical tag snapshot at signup.${result.data.truncated ? " The popup audience exceeded the pagination safety limit, so totals are partial." : ""}`,
  };
}

function buildGrowthSummary(
  current: PeriodSummary,
  previous: PeriodSummary,
  currentFunnelBuyers: BuyerPeriodSummary,
  previousFunnelBuyers: BuyerPeriodSummary,
  currentSessions: IsolatedResult<HumanSessionsResult>,
  previousSessions: IsolatedResult<HumanSessionsResult>,
  popupResult: IsolatedResult<PopupCustomersResult>,
  range: DateRange,
  salesChannel: SalesChannelFilter,
): GrowthSummary {
  const popup = popupResult.data;
  const currentSnapshot = growthPeriodSnapshot(
    current,
    currentFunnelBuyers,
    currentSessions.data,
    popup,
    range.currentStartUtc,
    range.currentEndUtc,
  );
  const previousSnapshot = growthPeriodSnapshot(
    previous,
    previousFunnelBuyers,
    previousSessions.data,
    popup,
    range.previousStartUtc,
    range.previousEndUtc,
  );
  const popupAudienceCustomers = popup?.customers.length ?? null;
  const currentPopupCohort = popup
    ? popupCustomersInRange(popup, range.currentStartUtc, range.currentEndUtc)
    : null;
  const unclassifiedSignups = currentPopupCohort
    ? currentPopupCohort.filter((signup) => signup.recognizedSegments.length === 0).length
    : null;

  return {
    current: currentSnapshot,
    previous: previousSnapshot,
    popupAudience: {
      customers: popupAudienceCustomers,
      activeEmailSubscribers: popup?.marketingConsentAvailable
        ? popup.customers.filter((customer) => String(customer.defaultEmailAddress?.marketingState || "").toUpperCase() === "SUBSCRIBED").length
        : null,
      periodSignups: currentPopupCohort?.length ?? null,
      unclassifiedSignups,
      segments: currentPopupCohort ? popupSegmentRows(currentFunnelBuyers, currentPopupCohort) : [],
      selectionDepth: currentPopupCohort ? popupSelectionDepthRows(currentFunnelBuyers, currentPopupCohort) : [],
      multiSelect: true,
      tagStateBasis: "current_customer_tags",
    },
    rates: {
      sessionToSignup: ratio(currentSnapshot.estimatedPopupSignups, currentSnapshot.humanSessions),
      signupToBuyer: ratio(currentSnapshot.estimatedPopupSignupBuyers, currentSnapshot.estimatedPopupSignups),
      sessionToSignupBuyer: ratio(currentSnapshot.estimatedPopupSignupBuyers, currentSnapshot.humanSessions),
      popupAudienceBuyerRate: ratio(currentSnapshot.popupAudienceBuyers, popupAudienceCustomers),
    },
    buyerScope: salesChannel,
    funnelBuyerScope: "online_store",
    signupDateBasis: "marketing_updated_at_then_customer_created_at_estimate",
    sample: false,
    coverage: {
      sessions: sessionsCoverage(currentSessions, previousSessions),
      buyers: buyersCoverage(current, previous),
      popupAudience: popupCoverage(popupResult),
    },
  };
}

export function shopifyLiveConfigured(): boolean {
  return Boolean(env("SHOPIFY_STORE_DOMAIN") || env("SHOPIFY_SHOP_DOMAIN")) && Boolean(env("SHOPIFY_ADMIN_ACCESS_TOKEN"));
}

export async function buildShopifyLiveAnalysis(
  search: URLSearchParams,
  session?: ShopifySession | null,
): Promise<AppAnalysis> {
  const timeZone = await shopifyTimeZone(session);
  const range = buildRange(search, timeZone);
  const salesChannel = salesChannelFromSearch(search);
  const [currentOrderSet, previousOrderSet, currentSessions, previousSessions, popupResult] = await Promise.all([
    fetchOrdersWithCustomerFallback(range.currentStartUtc, range.currentEndUtc, session),
    fetchOrdersWithCustomerFallback(range.previousStartUtc, range.previousEndUtc, session),
    isolate(fetchHumanSessions(range.currentStartKey, range.currentEndKey, range.timeZone, session)),
    isolate(fetchHumanSessions(range.previousStartKey, range.previousEndKey, range.timeZone, session)),
    isolate(fetchPopupCustomers(session)),
  ]);
  const currentOrders = currentOrderSet.orders.filter((order) => orderMatchesSalesChannel(order, salesChannel));
  const previousOrders = previousOrderSet.orders.filter((order) => orderMatchesSalesChannel(order, salesChannel));

  const current = summarizePeriod(
    currentOrders,
    range.currentLabel,
    range.timeZone,
    range.currentStartKey,
    range.currentEndKey,
    currentOrderSet.customerDataAvailable,
    currentOrderSet.truncated,
  );
  const previous = summarizePeriod(
    previousOrders,
    range.previousLabel,
    range.timeZone,
    range.previousStartKey,
    range.previousEndKey,
    previousOrderSet.customerDataAvailable,
    previousOrderSet.truncated,
    current.products,
  );
  const currentFunnelBuyers = salesChannel === "online_store"
    ? current
    : summarizeBuyerPeriod(
        currentOrderSet.orders.filter((order) => orderMatchesSalesChannel(order, "online_store")),
        range.timeZone,
        range.currentStartKey,
        range.currentEndKey,
        currentOrderSet.customerDataAvailable,
        currentOrderSet.truncated,
      );
  const previousFunnelBuyers = salesChannel === "online_store"
    ? previous
    : summarizeBuyerPeriod(
        previousOrderSet.orders.filter((order) => orderMatchesSalesChannel(order, "online_store")),
        range.timeZone,
        range.previousStartKey,
        range.previousEndKey,
        previousOrderSet.customerDataAvailable,
        previousOrderSet.truncated,
      );
  current.daily = mergeSessions(current.daily, currentSessions.data);
  previous.daily = mergeSessions(previous.daily, previousSessions.data);
  const products = mapProducts(current.products, current.daily);
  const discountRate = current.discounts / Math.max(current.grossSales, 1);
  const previousDiscountRate = previous.discounts / Math.max(previous.grossSales, 1);
  const refundRate = current.refunds / Math.max(current.grossSales, 1);
  const previousRefundRate = previous.refunds / Math.max(previous.grossSales, 1);
  const currentAov = current.orders ? current.grossSales / current.orders : 0;
  const previousAov = previous.orders ? previous.grossSales / previous.orders : 0;

  return {
    generatedAt: new Date().toISOString(),
    periodLabel: range.currentLabel,
    comparisonLabel: range.previousLabel,
    currency: current.currency,
    coverage: {
      shopify: "live",
      metaAds: "manual",
    },
    metrics: [
      metric("Total sales", money(current.netSales), pct(current.netSales, previous.netSales), salesChannel === "all" ? "All Shopify channels" : "Online Store orders"),
      metric("Orders", integer(current.orders), pct(current.orders, previous.orders), salesChannel === "all" ? "All Shopify orders" : "Online Store orders"),
      metric("AOV", money(currentAov), pct(currentAov, previousAov), "Subtotal sales / orders"),
      metric("Discount rate", percentValue(discountRate), discountRate - previousDiscountRate, "Discounts / gross sales"),
      metric("Refund rate", percentValue(refundRate), refundRate - previousRefundRate, "Refunds / gross sales"),
      metric("ROAS", "No data", null, "Connect/import Meta Ads for spend"),
    ],
    daily: current.daily,
    products,
    blankPerformance: mapBlankPerformance(products),
    themes: mapThemes(products),
    customerLifecycle: customerLifecycleSummary(current),
    growth: buildGrowthSummary(
      current,
      previous,
      currentFunnelBuyers,
      previousFunnelBuyers,
      currentSessions,
      previousSessions,
      popupResult,
      range,
      salesChannel,
    ),
  };
}
