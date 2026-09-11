import type { ListingFieldNames, ListingMetafieldInput, ListingStatus, LarkAttachment, LarkListingRow } from "./listing-types";
import { dedupeLabels, effectiveColors, isColorlessProductType, normalizeText } from "./listing-utils";

const LARK_API = "https://open.larksuite.com/open-apis";

type LarkRecord = { record_id: string; fields: Record<string, unknown> };

function env(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

export function larkFieldNames(): ListingFieldNames {
  return {
    designId: env("LARK_FIELD_DESIGN_ID", "Design ID"),
    productType: env("LARK_FIELD_PRODUCT_TYPE", "Product type"),
    mainColor: env("LARK_FIELD_MAIN_COLOR", "Main Color"),
    colors: env("LARK_FIELD_COLORS", "Colors"),
    shopifyUrl: env("LARK_FIELD_SHOPIFY_URL", "Shopify URL"),
    liveDate: env("LARK_FIELD_LIVE_DATE", "Live date"),
    collection: env("LARK_FIELD_COLLECTION", "Collection"),
    weeklyPlan: env("LARK_FIELD_WEEKLY_PLAN", "Weekly Design Plan"),
    attachments: env("LARK_FIELD_ATTACHMENTS", "Assets"),
    title: env("LARK_FIELD_TITLE", "Product name"),
    weeklyPlanTitle: env("LARK_WEEKLY_PLAN_TITLE_FIELD", "Product name"),
    listingStatus: env("LARK_FIELD_LISTING_STATUS", "Listing status"),
    templateProduct: env("LARK_FIELD_TEMPLATE_PRODUCT", "Template product"),
    listingNote: env("LARK_FIELD_LISTING_NOTE", "Listing note"),
    price: env("LARK_FIELD_PRICE", "Price"),
    inventory: env("LARK_FIELD_INVENTORY", "Inventory"),
    printTwoSides: env("LARK_FIELD_PRINT_TWO_SIDES", "PRINT 2-SIDES"),
    tags: env("LARK_FIELD_TAGS", "Tags"),
    metafields: env("LARK_FIELD_METAFIELDS", "Metafields"),
  };
}

export function getLarkConfigStatus() {
  const required = ["LARK_APP_ID", "LARK_APP_SECRET", "LARK_BASE_APP_TOKEN", "LARK_UPLOAD_TABLE_ID"];
  const missing = required.filter((name) => !env(name));
  return { configured: missing.length === 0, missing };
}

async function larkAccessToken() {
  const response = await fetch(`${LARK_API}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: env("LARK_APP_ID"), app_secret: env("LARK_APP_SECRET") }),
  });
  const data = (await response.json()) as { code?: number; msg?: string; tenant_access_token?: string };
  if (!response.ok || data.code || !data.tenant_access_token) {
    throw new Error(`Lark authentication failed: ${data.msg ?? response.statusText}`);
  }
  return data.tenant_access_token;
}

async function larkRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await larkAccessToken();
  const response = await fetch(`${LARK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json()) as T & { code?: number; msg?: string };
  if (!response.ok || data.code) {
    throw new Error(`Lark API failed: ${data.msg ?? response.statusText}`);
  }
  return data;
}

function encode(value: string) {
  return encodeURIComponent(value);
}

async function listTableRecords(tableId: string) {
  const appToken = env("LARK_BASE_APP_TOKEN");
  const records: LarkRecord[] = [];
  let pageToken: string | null = null;
  do {
    const query = new URLSearchParams({ page_size: "100" });
    const viewId = tableId === env("LARK_UPLOAD_TABLE_ID") ? env("LARK_VIEW_ID") : "";
    if (viewId) query.set("view_id", viewId);
    if (pageToken) query.set("page_token", pageToken);
    const data = await larkRequest<{
      data?: { items?: LarkRecord[]; has_more?: boolean; page_token?: string };
    }>(`/bitable/v1/apps/${encode(appToken)}/tables/${encode(tableId)}/records?${query}`);
    records.push(...(data.data?.items ?? []));
    pageToken = data.data?.has_more ? data.data.page_token ?? null : null;
  } while (pageToken);
  return records;
}

async function getTableRecord(tableId: string, recordId: string) {
  const appToken = env("LARK_BASE_APP_TOKEN");
  const data = await larkRequest<{ data?: { record?: LarkRecord } }>(
    `/bitable/v1/apps/${encode(appToken)}/tables/${encode(tableId)}/records/${encode(recordId)}`,
  );
  if (!data.data?.record) throw new Error("Lark record was not found.");
  return data.data.record;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const text = value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (item && typeof item === "object") {
          const object = item as Record<string, unknown>;
          return typeof object.text === "string" ? object.text : typeof object.name === "string" ? object.name : "";
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
    return text || null;
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.text === "string") return object.text || null;
    if (typeof object.name === "string") return object.name || null;
    if (typeof object.link === "string") return object.link || null;
  }
  return null;
}

function asLabels(value: unknown) {
  if (Array.isArray(value)) return dedupeLabels(value.map((item) => asText(item) ?? ""));
  const text = asText(value);
  return text ? dedupeLabels(text.split(",").map((item) => item.trim())) : [];
}

function asMetafields(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return { values: [] as ListingMetafieldInput[], warning: null };
  }
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) throw new Error("the value is not an array");
    const values = parsed.map((item) => {
      if (!item || typeof item !== "object") throw new Error("one item is not an object");
      const itemValue = item as Record<string, unknown>;
      const namespace = itemValue.namespace;
      const key = itemValue.key;
      const type = itemValue.type;
      const metafieldValue = itemValue.value;
      if ([namespace, key, type, metafieldValue].some((part) => typeof part !== "string" || !part.trim())) {
        throw new Error("each item needs namespace, key, type, and value strings");
      }
      return { namespace, key, type, value: metafieldValue } as ListingMetafieldInput;
    });
    return { values, warning: null };
  } catch (error) {
    return {
      values: [] as ListingMetafieldInput[],
      warning: `Metafields ignored: ${error instanceof Error ? error.message : "invalid JSON"}.`,
    };

  }
}

function linkedRecordIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object") {
        const object = item as Record<string, unknown>;
        return typeof object.record_id === "string" ? object.record_id : typeof object.id === "string" ? object.id : null;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}

function asAttachments(value: unknown): LarkAttachment[] {
  if (!Array.isArray(value)) return [];
  const attachments: LarkAttachment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const object = item as Record<string, unknown>;
    const fileToken = object.file_token;
    const name = object.name;
    if (typeof fileToken !== "string" || typeof name !== "string") continue;
    const attachment: LarkAttachment = { fileToken, name };
    if (typeof object.size === "number") attachment.size = object.size;
    if (typeof object.type === "string") attachment.mimeType = object.type;
    attachments.push(attachment);
  }
  return attachments;
}

function getStatus(input: {
  title: string | null;
  attachments: LarkAttachment[];
  productType: string;
  shopifyUrl: string | null;
  existingStatus: string | null;
}) {
  const existing = input.existingStatus?.toLowerCase() ?? "";
  if (input.shopifyUrl || existing.includes("draft created") || existing.includes("live")) return "DRAFT_CREATED" as const;
  if (!input.title) return "NEEDS_TITLE" as const;
  if (!input.attachments.length) return "NEEDS_ASSETS" as const;
  if (!input.productType) return "NEEDS_REVIEW" as const;
  return "READY" as const;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = asText(value)?.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1" || normalized === "checked";
}

function mapRow(record: LarkRecord, weeklyPlanTitle: string | null): LarkListingRow {
  const fields = larkFieldNames();
  const designId = asText(record.fields[fields.designId]) ?? record.record_id;
  const uploadTitle = asText(record.fields[fields.title]);
  const title = uploadTitle ?? weeklyPlanTitle;
  const productType = asText(record.fields[fields.productType]) ?? "";
  const mainColor = asText(record.fields[fields.mainColor]);
  const colors = asLabels(record.fields[fields.colors]);
  const collectionNames = asLabels(record.fields[fields.collection]);
  const weeklyPlanText = asText(record.fields[fields.weeklyPlan]);
  const attachments = asAttachments(record.fields[fields.attachments]);
  const shopifyUrl = asText(record.fields[fields.shopifyUrl]);
  const liveDate = asText(record.fields[fields.liveDate]);
  const metafieldResult = asMetafields(record.fields[fields.metafields]);
  const tags = asLabels(record.fields[fields.tags]);
  const rowWithoutStatus = { productType, mainColor, colors };
  const warnings: string[] = [];
  if (!effectiveColors(rowWithoutStatus).length && !isColorlessProductType(productType)) {
    warnings.push("No colors found. Confirm this product is intentionally colorless.");
  }
  if (!weeklyPlanText) warnings.push("No linked Weekly Design Plan. Collection may need review.");
  if (metafieldResult.warning) warnings.push(metafieldResult.warning);
  const status: ListingStatus = getStatus({
    title,
    attachments,
    productType,
    shopifyUrl,
    existingStatus: asText(record.fields[fields.listingStatus]),
  });
  return {
    recordId: record.record_id,
    designId,
    title,
    titleSource: uploadTitle ? "upload" : weeklyPlanTitle ? "weekly-plan" : "missing",
    productType,
    mainColor,
    colors,
    collectionNames,
    weeklyDesignPlan: weeklyPlanText ?? weeklyPlanTitle,
    weeklyPlanRecordIds: linkedRecordIds(record.fields[fields.weeklyPlan]),
    shopifyUrl,
    liveDate,
    price: asNumber(record.fields[fields.price]),
    inventory: asNumber(record.fields[fields.inventory]),
    printTwoSides: asBoolean(record.fields[fields.printTwoSides]),
    tags,
    metafields: metafieldResult.values,
    attachments,
    status,
    warnings,
  };
}

async function weeklyPlanTitles(recordIds: string[]) {
  const tableId = env("LARK_WEEKLY_PLAN_TABLE_ID");
  if (!tableId || !recordIds.length) return new Map<string, string>();
  const fields = larkFieldNames();
  const uniqueIds = [...new Set(recordIds)];
  const pairs = await Promise.all(
    uniqueIds.map(async (recordId) => {
      const record = await getTableRecord(tableId, recordId);
      return [recordId, asText(record.fields[fields.weeklyPlanTitle]) ?? ""] as const;
    }),
  );
  return new Map(pairs.filter(([, title]) => Boolean(title)));
}

export async function listLarkListingRows() {
  const config = getLarkConfigStatus();
  if (!config.configured) throw new Error(`Missing Lark configuration: ${config.missing.join(", ")}`);
  const records = await listTableRecords(env("LARK_UPLOAD_TABLE_ID"));
  const planIds = records.flatMap((record) => linkedRecordIds(record.fields[larkFieldNames().weeklyPlan]));
  const titles = await weeklyPlanTitles(planIds);
  return records.map((record) => {
    const ids = linkedRecordIds(record.fields[larkFieldNames().weeklyPlan]);
    return mapRow(record, ids.map((id) => titles.get(id)).find(Boolean) ?? null);
  });
}

export async function getLarkListingRow(recordId: string) {
  const config = getLarkConfigStatus();
  if (!config.configured) throw new Error(`Missing Lark configuration: ${config.missing.join(", ")}`);
  const record = await getTableRecord(env("LARK_UPLOAD_TABLE_ID"), recordId);
  const ids = linkedRecordIds(record.fields[larkFieldNames().weeklyPlan]);
  const titles = await weeklyPlanTitles(ids);
  return mapRow(record, ids.map((id) => titles.get(id)).find(Boolean) ?? null);
}

export async function downloadLarkAttachment(fileToken: string) {
  const token = await larkAccessToken();
  const response = await fetch(`${LARK_API}/drive/v1/medias/${encode(fileToken)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Could not download Lark asset: ${response.statusText}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function updateLarkListingRecord(recordId: string, fields: Record<string, unknown>) {
  const appToken = env("LARK_BASE_APP_TOKEN");
  const urlField = larkFieldNames().shopifyUrl;
  const normalizedFields = { ...fields };
  const urlValue = normalizedFields[urlField];
  if (typeof urlValue === "string" && urlValue.trim()) normalizedFields[urlField] = { link: urlValue, text: urlValue };
  await larkRequest(
    `/bitable/v1/apps/${encode(appToken)}/tables/${encode(env("LARK_UPLOAD_TABLE_ID"))}/records/${encode(recordId)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ fields: normalizedFields }),
    },
  );
}
export async function ensureLarkDesignTag(tag: string) {
  const tableId = env("LARK_TAG_DESIGN_TABLE_ID");
  if (!tableId) throw new Error("Set LARK_TAG_DESIGN_TABLE_ID before creating design tags.");
  const fieldName = env("LARK_TAG_DESIGN_FIELD", "TAG DESIGN");
  const records = await listTableRecords(tableId);
  const existing = records
    .map((record) => asText(record.fields[fieldName]))
    .find((value): value is string => Boolean(value) && normalizeText(value) === normalizeText(tag));
  if (existing) return existing;

  const appToken = env("LARK_BASE_APP_TOKEN");
  await larkRequest(
    `/bitable/v1/apps/${encode(appToken)}/tables/${encode(tableId)}/records`,
    {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ fields: { [fieldName]: tag } }),
    },
  );
  return tag;
}
