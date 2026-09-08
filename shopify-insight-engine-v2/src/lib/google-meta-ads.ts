import { createSign } from "crypto";
import { parseMetaAdsRecords, type MetaAdsRow } from "@/lib/meta-ads-import";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DEFAULT_SPREADSHEET_ID = "14BL_RGXFAxRljQG9dyhgWOyG7qwYH5JB9ce_NJEezco";
const DEFAULT_SHEET_GID = "362684494";
const DEFAULT_CELL_RANGE = "A1:AB10000";
const MAX_SHEET_ROWS = 50_000;

type ServiceAccount = {
  clientEmail: string;
  privateKey: string;
  tokenUri: string;
};

type GoogleSheetMetadata = {
  properties?: {
    title?: string;
  };
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
      hidden?: boolean;
      gridProperties?: {
        rowCount?: number;
        columnCount?: number;
      };
    };
  }>;
};

type GoogleSheetValues = {
  values?: unknown[][];
};

export type GoogleMetaAdsLoad = {
  rows: MetaAdsRow[];
  loadedAt: string;
  sheet: {
    spreadsheetTitle: string;
    sheetTitle: string;
    sheetId: number;
    cellRange: string;
    sourceRows: number;
  };
};

export class GoogleMetaAdsError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status = 502) {
    super(message);
    this.name = "GoogleMetaAdsError";
    this.code = code;
    this.status = status;
  }
}

let tokenCache: { token: string; expiresAt: number; clientEmail: string } | null = null;
let tokenRequest: Promise<string> | null = null;
let dataCache: { key: string; value: GoogleMetaAdsLoad; expiresAt: number } | null = null;
let dataRequest: Promise<GoogleMetaAdsLoad> | null = null;

function env(name: string, fallback = ""): string {
  return String(process.env[name] || fallback).trim();
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function parseServiceAccountJson(raw: string): ServiceAccount | null {
  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) return null;
    return {
      clientEmail: parsed.client_email.trim(),
      privateKey: parsed.private_key.replace(/\\n/g, "\n").trim(),
      tokenUri: GOOGLE_TOKEN_URL,
    };
  } catch {
    return null;
  }
}

function serviceAccount(): ServiceAccount {
  const encodedJson = env("GOOGLE_META_ADS_SERVICE_ACCOUNT_JSON_B64");
  if (encodedJson) {
    const parsed = parseServiceAccountJson(Buffer.from(encodedJson, "base64").toString("utf8"));
    if (parsed) return parsed;
  }

  const rawJson = env("GOOGLE_META_ADS_SERVICE_ACCOUNT_JSON");
  if (rawJson) {
    const parsed = parseServiceAccountJson(rawJson);
    if (parsed) return parsed;
  }

  const clientEmail = env("GOOGLE_META_ADS_CLIENT_EMAIL");
  const privateKey = env("GOOGLE_META_ADS_PRIVATE_KEY").replace(/\\n/g, "\n").trim();
  if (clientEmail && privateKey) {
    return {
      clientEmail,
      privateKey,
      tokenUri: GOOGLE_TOKEN_URL,
    };
  }

  throw new GoogleMetaAdsError(
    "Google Sheets credentials are not configured.",
    "GOOGLE_CREDENTIALS_MISSING",
    503,
  );
}

function sheetSettings() {
  const spreadsheetId = env("GOOGLE_META_ADS_SPREADSHEET_ID", DEFAULT_SPREADSHEET_ID);
  const sheetGid = env("GOOGLE_META_ADS_SHEET_GID", DEFAULT_SHEET_GID);
  const cellRange = env("GOOGLE_META_ADS_CELL_RANGE", DEFAULT_CELL_RANGE).toUpperCase();
  const requestedCacheSeconds = Number(env("GOOGLE_META_ADS_CACHE_SECONDS", "300"));
  const cacheSeconds = Number.isFinite(requestedCacheSeconds)
    ? Math.max(0, Math.min(3600, requestedCacheSeconds))
    : 300;

  if (!/^[A-Za-z0-9_-]+$/.test(spreadsheetId)) {
    throw new GoogleMetaAdsError("Google spreadsheet id is invalid.", "GOOGLE_SHEET_ID_INVALID", 503);
  }
  if (!/^\d+$/.test(sheetGid)) {
    throw new GoogleMetaAdsError("Google sheet gid is invalid.", "GOOGLE_SHEET_GID_INVALID", 503);
  }

  const rangeMatch = cellRange.match(/^([A-Z]{1,3})([1-9]\d*):([A-Z]{1,3})([1-9]\d*)$/);
  if (!rangeMatch || Number(rangeMatch[4]) > MAX_SHEET_ROWS) {
    throw new GoogleMetaAdsError(
      `Google Sheet cell range must be a bounded A1 range with at most ${MAX_SHEET_ROWS} rows.`,
      "GOOGLE_SHEET_RANGE_INVALID",
      503,
    );
  }

  return {
    spreadsheetId,
    sheetGid: Number(sheetGid),
    cellRange,
    cacheSeconds,
  };
}

export function googleMetaAdsConfigured(): boolean {
  try {
    serviceAccount();
    sheetSettings();
    return true;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GoogleMetaAdsError("Google Sheets request timed out.", "GOOGLE_REQUEST_TIMEOUT", 504);
    }
    throw new GoogleMetaAdsError("Google Sheets could not be reached.", "GOOGLE_REQUEST_FAILED", 502);
  } finally {
    clearTimeout(timer);
  }
}

async function requestGoogleAccessToken(account: ServiceAccount): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: account.clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: account.tokenUri,
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  let signature: Buffer;
  try {
    signature = signer.sign(account.privateKey);
  } catch {
    throw new GoogleMetaAdsError("Google service-account private key is invalid.", "GOOGLE_PRIVATE_KEY_INVALID", 503);
  }

  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetchWithTimeout(account.tokenUri, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = await response.json().catch(() => ({})) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!response.ok || !payload.access_token) {
    throw new GoogleMetaAdsError(
      `Google OAuth rejected the service account (${response.status}).`,
      "GOOGLE_OAUTH_REJECTED",
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  }

  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in) || 3600) * 1000 - 60_000,
    clientEmail: account.clientEmail,
  };
  return payload.access_token;
}

async function googleAccessToken(): Promise<string> {
  const account = serviceAccount();
  if (tokenCache && tokenCache.clientEmail === account.clientEmail && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  if (tokenRequest) return tokenRequest;

  tokenRequest = requestGoogleAccessToken(account).finally(() => {
    tokenRequest = null;
  });
  return tokenRequest;
}

async function googleJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const status = response.status;
    const code = status === 403 ? "GOOGLE_SHEET_FORBIDDEN" : status === 404 ? "GOOGLE_SHEET_NOT_FOUND" : "GOOGLE_SHEETS_API_ERROR";
    const message = status === 403
      ? "The Google service account does not have Viewer access to this Sheet."
      : status === 404
        ? "The configured Google Sheet could not be found."
        : `Google Sheets API returned ${status}.`;
    throw new GoogleMetaAdsError(message, code, status === 403 || status === 404 ? 503 : 502);
  }

  return response.json() as Promise<T>;
}

function rowsFromValues(values: unknown[][]): Record<string, unknown>[] {
  const [headerRow = [], ...dataRows] = values;
  const headers = headerRow.map((value) => String(value ?? "").trim());
  if (!headers.some(Boolean)) {
    throw new GoogleMetaAdsError("The Google Sheet header row is empty.", "GOOGLE_SHEET_HEADERS_MISSING", 422);
  }

  return dataRows
    .filter((row) => row.some((value) => String(value ?? "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header || `Column ${index + 1}`, row[index] ?? ""])));
}

async function fetchGoogleMetaAdsRows(): Promise<GoogleMetaAdsLoad> {
  const settings = sheetSettings();
  const accessToken = await googleAccessToken();
  const metadataUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}`);
  metadataUrl.searchParams.set("includeGridData", "false");
  metadataUrl.searchParams.set(
    "fields",
    "properties(title),sheets(properties(sheetId,title,hidden,gridProperties(rowCount,columnCount)))",
  );
  const metadata = await googleJson<GoogleSheetMetadata>(metadataUrl.toString(), accessToken);
  const targetSheet = metadata.sheets?.find((sheet) => sheet.properties?.sheetId === settings.sheetGid)?.properties;

  if (!targetSheet?.title) {
    throw new GoogleMetaAdsError("The configured Google Sheet tab was not found.", "GOOGLE_SHEET_TAB_NOT_FOUND", 503);
  }

  const quotedTitle = `'${targetSheet.title.replace(/'/g, "''")}'`;
  const a1Range = `${quotedTitle}!${settings.cellRange}`;
  const valuesUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/${encodeURIComponent(a1Range)}`,
  );
  valuesUrl.searchParams.set("majorDimension", "ROWS");
  valuesUrl.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  valuesUrl.searchParams.set("dateTimeRenderOption", "FORMATTED_STRING");
  const valuesPayload = await googleJson<GoogleSheetValues>(valuesUrl.toString(), accessToken);
  const sourceRecords = rowsFromValues(Array.isArray(valuesPayload.values) ? valuesPayload.values : []);
  const rows = parseMetaAdsRecords(sourceRecords);

  if (!rows.length) {
    throw new GoogleMetaAdsError(
      "The Google Sheet contains no usable Meta Ads rows.",
      "GOOGLE_SHEET_ROWS_UNUSABLE",
      422,
    );
  }

  return {
    rows,
    loadedAt: new Date().toISOString(),
    sheet: {
      spreadsheetTitle: metadata.properties?.title || "Google Sheet",
      sheetTitle: targetSheet.title,
      sheetId: settings.sheetGid,
      cellRange: settings.cellRange,
      sourceRows: sourceRecords.length,
    },
  };
}

export async function loadGoogleMetaAds(options: { force?: boolean } = {}): Promise<GoogleMetaAdsLoad> {
  const settings = sheetSettings();
  const cacheKey = `${settings.spreadsheetId}:${settings.sheetGid}:${settings.cellRange}`;
  if (!options.force && dataCache?.key === cacheKey && dataCache.expiresAt > Date.now()) {
    return dataCache.value;
  }
  if (dataRequest) return dataRequest;

  dataRequest = fetchGoogleMetaAdsRows()
    .then((value) => {
      dataCache = {
        key: cacheKey,
        value,
        expiresAt: Date.now() + settings.cacheSeconds * 1000,
      };
      return value;
    })
    .finally(() => {
      dataRequest = null;
    });
  return dataRequest;
}
