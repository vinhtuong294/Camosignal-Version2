export type MetaAdsRow = {
  date: string;
  campaign: string;
  adSet: string;
  ad: string;
  spend: number;
  impressions: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  purchaseValue: number;
  productHint: string;
  themeHint: string;
  sourceRow: number;
};

export type MetaAdsGroup = Omit<MetaAdsRow, "date" | "sourceRow" | "productHint" | "themeHint"> & {
  key: string;
  rows: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  landingPageRate: number | null;
  purchaseRate: number | null;
};

export type MetaAdsSummary = {
  rows: number;
  spend: number;
  impressions: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  purchaseValue: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  landingPageRate: number | null;
  addToCartRate: number | null;
  checkoutRate: number | null;
  purchaseRate: number | null;
  dateRange: string;
  byCampaign: MetaAdsGroup[];
  byAdSet: MetaAdsGroup[];
  byAd: MetaAdsGroup[];
};

const aliases = {
  date: ["day", "date", "reporting starts", "reporting start", "date start", "date_start"],
  campaign: ["campaign name", "campaign", "campaign_name"],
  adSet: ["ad set name", "adset name", "ad set", "adset", "ad_set_name"],
  ad: ["ad name", "ad", "ad_name"],
  spend: ["amount spent", "amount spent usd", "amount spent (usd)", "spend", "spent", "cost"],
  impressions: ["impressions", "impression"],
  linkClicks: ["link clicks", "link click", "inline link clicks", "inline_link_clicks", "outbound clicks", "clicks"],
  landingPageViews: [
    "landing page views",
    "landing_page_views",
    "lpv",
    "landing page view",
    "content views",
    "content view",
    "view content",
    "website content views",
  ],
  addToCart: ["adds to cart", "add to cart", "website adds to cart", "add_to_cart"],
  initiateCheckout: ["checkouts initiated", "checkout initiated", "initiate checkout", "initiated checkout", "initiate_checkout"],
  purchases: ["purchases", "website purchases", "purchase", "omni purchases"],
  purchaseValue: [
    "purchase conversion value",
    "website purchase conversion value",
    "conversion value",
    "purchase value",
    "purchases conversion value",
    "action values purchase",
  ],
  resultsRoas: ["results roas", "website purchase roas", "purchase roas", "return on ad spend", "roas"],
  productHint: ["product", "product name", "product url", "landing page url", "url", "website url"],
  themeHint: ["theme", "collection", "utm campaign", "utm_campaign"],
} as const;

type MetaField = keyof typeof aliases;
type SourceRecord = Record<string, unknown>;
type NumericKind = "count" | "money" | "ratio";

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: unknown, kind: NumericKind = "ratio"): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw.toLowerCase() === "nan") return 0;
  const negative = raw.includes("(") && raw.includes(")");
  let cleaned = raw.replace(/[%$\s]/g, "").replace(/[()]/g, "").trim();

  if (kind === "count") {
    const unsigned = cleaned.replace(/^[-+]/, "");
    cleaned = /^\d{1,3}(?:[.,]\d{3})+$/.test(unsigned)
      ? cleaned.replace(/[.,]/g, "")
      : cleaned.replace(/,/g, "");
  } else {
    const commaIndex = cleaned.lastIndexOf(",");
    const dotIndex = cleaned.lastIndexOf(".");
    const commaCount = (cleaned.match(/,/g) || []).length;
    const dotCount = (cleaned.match(/\./g) || []).length;

    if (commaCount && dotCount) {
      cleaned = commaIndex > dotIndex
        ? cleaned.replace(/\./g, "").replace(/,/g, ".")
        : cleaned.replace(/,/g, "");
    } else if (commaCount === 1) {
      const decimalDigits = cleaned.length - commaIndex - 1;
      const commaIsDecimal = kind === "ratio" || decimalDigits <= 2;
      cleaned = commaIsDecimal ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
    } else if (commaCount > 1) {
      cleaned = cleaned.replace(/,/g, "");
    } else if (dotCount > 1) {
      const decimalDigits = cleaned.length - dotIndex - 1;
      cleaned = decimalDigits <= 2
        ? `${cleaned.slice(0, dotIndex).replace(/\./g, "")}.${cleaned.slice(dotIndex + 1)}`
        : cleaned.replace(/\./g, "");
    }
  }

  const next = Number(cleaned);
  if (!Number.isFinite(next)) return 0;
  return negative ? -next : next;
}

function parseReportedRoas(value: unknown): number {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  if (!raw.includes(".") && (raw.match(/,/g) || []).length > 1) return 0;
  return parseNumber(value, "ratio");
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function recordsFromCsv(input: string): SourceRecord[] {
  const rows = csvRows(input);
  const headers = rows[0] || [];
  return rows.slice(1).map((row) => {
    const record: SourceRecord = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

function recordsFromJson(input: string): SourceRecord[] {
  const parsed = JSON.parse(input) as unknown;
  if (Array.isArray(parsed)) return parsed.filter((row): row is SourceRecord => Boolean(row && typeof row === "object"));
  if (parsed && typeof parsed === "object") {
    const object = parsed as Record<string, unknown>;
    for (const key of ["data", "rows", "results", "insights"]) {
      if (Array.isArray(object[key])) {
        return object[key].filter((row): row is SourceRecord => Boolean(row && typeof row === "object"));
      }
    }
  }
  return [];
}

function valueByAliases(record: SourceRecord, field: MetaField): unknown {
  const normalized = new Map(Object.keys(record).map((key) => [normalizeHeader(key), key]));
  for (const alias of aliases[field]) {
    const key = normalized.get(normalizeHeader(alias));
    if (key) return record[key];
  }
  return "";
}

function actionMetric(record: SourceRecord, wanted: string[]): number {
  const actions = record.actions;
  if (!Array.isArray(actions)) return 0;
  for (const action of actions) {
    if (!action || typeof action !== "object") continue;
    const row = action as Record<string, unknown>;
    const type = normalizeHeader(String(row.action_type || row.type || ""));
    if (wanted.some((entry) => type.includes(normalizeHeader(entry)))) return parseNumber(row.value, "count");
  }
  return 0;
}

function actionValue(record: SourceRecord, wanted: string[]): number {
  const actions = record.action_values || record.actionValues;
  if (!Array.isArray(actions)) return 0;
  for (const action of actions) {
    if (!action || typeof action !== "object") continue;
    const row = action as Record<string, unknown>;
    const type = normalizeHeader(String(row.action_type || row.type || ""));
    if (wanted.some((entry) => type.includes(normalizeHeader(entry)))) return parseNumber(row.value, "money");
  }
  return 0;
}

function normalizeRecord(record: SourceRecord, index: number): MetaAdsRow {
  const spend = parseNumber(valueByAliases(record, "spend"), "money");
  const purchases = parseNumber(valueByAliases(record, "purchases"), "count") || actionMetric(record, ["purchase"]);
  const directPurchaseValue = parseNumber(valueByAliases(record, "purchaseValue"), "money") || actionValue(record, ["purchase"]);
  const resultsRoas = parseReportedRoas(valueByAliases(record, "resultsRoas"));
  const purchaseValue = directPurchaseValue || (resultsRoas > 0 && spend ? resultsRoas * spend : 0);
  const linkClicks = parseNumber(valueByAliases(record, "linkClicks"), "count") || actionMetric(record, ["link click", "link_click"]);
  const landingPageViews = parseNumber(valueByAliases(record, "landingPageViews"), "count") || actionMetric(record, ["landing page view", "view content"]);
  const addToCart = parseNumber(valueByAliases(record, "addToCart"), "count") || actionMetric(record, ["add to cart"]);
  const initiateCheckout = parseNumber(valueByAliases(record, "initiateCheckout"), "count") || actionMetric(record, ["checkout"]);

  return {
    date: text(valueByAliases(record, "date")),
    campaign: text(valueByAliases(record, "campaign")) || "Unclassified campaign",
    adSet: text(valueByAliases(record, "adSet")) || "Unclassified ad set",
    ad: text(valueByAliases(record, "ad")) || "Unclassified ad",
    spend,
    impressions: parseNumber(valueByAliases(record, "impressions"), "count"),
    linkClicks,
    landingPageViews,
    addToCart,
    initiateCheckout,
    purchases,
    purchaseValue,
    productHint: text(valueByAliases(record, "productHint")),
    themeHint: text(valueByAliases(record, "themeHint")),
    sourceRow: index + 1,
  };
}

function divide(numerator: number, denominator: number): number | null {
  return denominator ? numerator / denominator : null;
}

function groupRows(rows: MetaAdsRow[], grain: "campaign" | "adSet" | "ad"): MetaAdsGroup[] {
  const groups = new Map<string, MetaAdsGroup>();
  for (const row of rows) {
    const key = grain === "campaign"
      ? row.campaign
      : grain === "adSet"
        ? `${row.campaign} | ${row.adSet}`
        : `${row.campaign} | ${row.adSet} | ${row.ad}`;
    const current = groups.get(key) || {
      key,
      rows: 0,
      campaign: row.campaign,
      adSet: grain === "campaign" ? "All ad sets" : row.adSet,
      ad: grain === "ad" ? row.ad : "All ads",
      spend: 0,
      impressions: 0,
      linkClicks: 0,
      landingPageViews: 0,
      addToCart: 0,
      initiateCheckout: 0,
      purchases: 0,
      purchaseValue: 0,
      roas: null,
      cpa: null,
      ctr: null,
      cpc: null,
      cpm: null,
      landingPageRate: null,
      purchaseRate: null,
    };
    current.rows += 1;
    current.spend += row.spend;
    current.impressions += row.impressions;
    current.linkClicks += row.linkClicks;
    current.landingPageViews += row.landingPageViews;
    current.addToCart += row.addToCart;
    current.initiateCheckout += row.initiateCheckout;
    current.purchases += row.purchases;
    current.purchaseValue += row.purchaseValue;
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map((row) => ({
      ...row,
      roas: divide(row.purchaseValue, row.spend),
      cpa: divide(row.spend, row.purchases),
      ctr: divide(row.linkClicks, row.impressions),
      cpc: divide(row.spend, row.linkClicks),
      cpm: row.impressions ? (row.spend / row.impressions) * 1000 : null,
      landingPageRate: divide(row.landingPageViews, row.linkClicks),
      purchaseRate: divide(row.purchases, row.landingPageViews),
    }))
    .sort((a, b) => b.spend - a.spend);
}

export function parseMetaAdsImport(input: string): MetaAdsRow[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const records = trimmed.startsWith("{") || trimmed.startsWith("[") ? recordsFromJson(trimmed) : recordsFromCsv(trimmed);
  return parseMetaAdsRecords(records);
}

export function parseMetaAdsRecords(records: Record<string, unknown>[]): MetaAdsRow[] {
  return records
    .map(normalizeRecord)
    .filter((row) => (
      row.spend ||
      row.impressions ||
      row.linkClicks ||
      row.landingPageViews ||
      row.addToCart ||
      row.initiateCheckout ||
      row.purchases ||
      row.purchaseValue
    ));
}

export function summarizeMetaAdsRows(rows: MetaAdsRow[]): MetaAdsSummary {
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const linkClicks = rows.reduce((sum, row) => sum + row.linkClicks, 0);
  const landingPageViews = rows.reduce((sum, row) => sum + row.landingPageViews, 0);
  const addToCart = rows.reduce((sum, row) => sum + row.addToCart, 0);
  const initiateCheckout = rows.reduce((sum, row) => sum + row.initiateCheckout, 0);
  const purchases = rows.reduce((sum, row) => sum + row.purchases, 0);
  const purchaseValue = rows.reduce((sum, row) => sum + row.purchaseValue, 0);
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const dateRange = dates.length ? `${dates[0]} - ${dates[dates.length - 1]}` : "Imported range";

  return {
    rows: rows.length,
    spend,
    impressions,
    linkClicks,
    landingPageViews,
    addToCart,
    initiateCheckout,
    purchases,
    purchaseValue,
    roas: divide(purchaseValue, spend),
    cpa: divide(spend, purchases),
    ctr: divide(linkClicks, impressions),
    cpc: divide(spend, linkClicks),
    cpm: impressions ? (spend / impressions) * 1000 : null,
    landingPageRate: divide(landingPageViews, linkClicks),
    addToCartRate: divide(addToCart, landingPageViews),
    checkoutRate: divide(initiateCheckout, addToCart),
    purchaseRate: divide(purchases, landingPageViews),
    dateRange,
    byCampaign: groupRows(rows, "campaign"),
    byAdSet: groupRows(rows, "adSet"),
    byAd: groupRows(rows, "ad"),
  };
}
