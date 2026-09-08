import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "csi_shopify_session";
const DEFAULT_SHOPIFY_STORE_DOMAIN = "apepsd-ha.myshopify.com";

export type ShopifySession = {
  shop: string;
  accessToken: string;
  createdAt?: string;
  mode?: string;
};

type CookieRequest = Request & {
  cookies?: {
    get?: (name: string) => { value?: string } | undefined;
  };
};

function env(name: string, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

export function oauthConfigured(): boolean {
  return Boolean(env("SHOPIFY_API_KEY") && env("SHOPIFY_API_SECRET"));
}

export function normalizeStoreDomain(value: unknown): string {
  const raw = String(value || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  if (raw.endsWith(".myshopify.com")) return raw;
  if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(raw)) return `${raw}.myshopify.com`;
  return "";
}

export function defaultShopDomain(): string {
  return normalizeStoreDomain(env("SHOPIFY_STORE_DOMAIN") || env("SHOPIFY_SHOP_DOMAIN") || DEFAULT_SHOPIFY_STORE_DOMAIN);
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function toBase64Url(value: Buffer): string {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function secretKey(): Buffer | null {
  const secret = env("SHOPIFY_API_SECRET") || env("INSIGHT_ACCESS_KEY") || env("LEGACY_INSIGHTS_KEY");
  if (!secret) return null;
  return createHash("sha256").update(secret).digest();
}

function parseCookieHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function getCookie(request: CookieRequest, name: string): string {
  const nextCookie = request.cookies?.get?.(name)?.value;
  if (nextCookie) return nextCookie;
  return parseCookieHeader(request.headers.get("cookie") || "")[name] || "";
}

export function appUrl(request: Request): string {
  return env("SHOPIFY_APP_URL") || env("APP_URL") || `${new URL(request.url).protocol}//${request.headers.get("host") || "localhost"}`;
}

function callbackUrl(request: Request): string {
  return env("SHOPIFY_REDIRECT_URI") || `${appUrl(request).replace(/\/+$/g, "")}/api/auth/callback`;
}

function encryptSession(session: ShopifySession): string {
  const key = secretKey();
  if (!key) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [toBase64Url(iv), toBase64Url(tag), toBase64Url(encrypted)].join(".");
}

export function encryptedSessionValue(session: ShopifySession): string {
  return encryptSession(session);
}

function decryptSession(value: string): ShopifySession | null {
  try {
    const key = secretKey();
    if (!key || !value) return null;
    const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
    if (!ivRaw || !tagRaw || !encryptedRaw) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, fromBase64Url(ivRaw));
    decipher.setAuthTag(fromBase64Url(tagRaw));
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(encryptedRaw)),
      decipher.final(),
    ]).toString("utf8");
    const session = JSON.parse(decrypted) as ShopifySession;
    if (!session?.accessToken || !normalizeStoreDomain(session.shop)) return null;
    return session;
  } catch {
    return null;
  }
}

function headerSession(request: Request): ShopifySession | null {
  const encrypted = request.headers.get("x-csi-shopify-session") || "";
  return decryptSession(encrypted);
}

function sessionCookie(session: ShopifySession): string {
  const encrypted = encryptSession(session);
  if (!encrypted) return "";
  const secure = env("NODE_ENV") === "production" ? "; Secure" : "";
  const sameSite = env("NODE_ENV") === "production" ? "None" : "Lax";
  return `${SESSION_COOKIE}=${encodeURIComponent(encrypted)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=${sameSite}; HttpOnly${secure}`;
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const secure = env("NODE_ENV") === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly${secure}`;
}

export function makeState(): string {
  return toBase64Url(randomBytes(24));
}

export function stateCookie(state: string): string {
  return serializeCookie("csi_oauth_state", state, 60 * 10);
}

export function clearStateCookie(): string {
  return serializeCookie("csi_oauth_state", "", 0);
}

export function validState(request: CookieRequest, state: string | null): boolean {
  return Boolean(state && getCookie(request, "csi_oauth_state") === state);
}

export function verifyShopifyHmac(url: URL): boolean {
  const secret = env("SHOPIFY_API_SECRET");
  const hmac = url.searchParams.get("hmac");
  if (!secret || !hmac) return false;

  const params = [...url.searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = createHmac("sha256", secret).update(params).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(hmac, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export function shopFromIdToken(token: string): string {
  try {
    const [, payload] = String(token || "").split(".");
    if (!payload) return "";
    const claims = JSON.parse(fromBase64Url(payload).toString("utf8")) as {
      dest?: string;
      iss?: string;
    };
    return normalizeStoreDomain(claims.dest || claims.iss);
  } catch {
    return "";
  }
}

function urlSessionToken(request: Request): string {
  const url = new URL(request.url);
  const idToken = url.searchParams.get("id_token") || "";
  const session = url.searchParams.get("session") || "";
  return idToken || (session.split(".").length === 3 ? session : "");
}

export async function exchangeSessionTokenForAccessToken(shop: string, sessionToken: string): Promise<string> {
  if (!oauthConfigured()) {
    throw Object.assign(new Error("Shopify OAuth is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET."), {
      status: 501,
    });
  }

  const body = new URLSearchParams({
    client_id: env("SHOPIFY_API_KEY"),
    client_secret: env("SHOPIFY_API_SECRET"),
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token: sessionToken,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
    expiring: "0",
  });

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw Object.assign(new Error(payload.error_description || payload.error || "Unable to exchange Shopify session token"), {
      status: response.status || 502,
    });
  }

  return String(payload.access_token);
}

export async function exchangeCodeForToken(shop: string, code: string): Promise<string> {
  if (!oauthConfigured()) {
    throw Object.assign(new Error("Shopify OAuth is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET."), {
      status: 501,
    });
  }

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: env("SHOPIFY_API_KEY"),
      client_secret: env("SHOPIFY_API_SECRET"),
      code,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw Object.assign(new Error(payload.error_description || payload.error || "Unable to exchange Shopify OAuth code"), {
      status: response.status || 502,
    });
  }

  return String(payload.access_token);
}

export function authorizeUrl(request: Request, shop: string, state: string): string {
  const scope = env("SHOPIFY_SCOPES", "read_orders,read_products,read_customers,read_reports");
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", env("SHOPIFY_API_KEY"));
  url.searchParams.set("scope", scope);
  url.searchParams.set("redirect_uri", callbackUrl(request));
  url.searchParams.set("state", state);
  return url.toString();
}

export function setSessionCookieHeaders(response: Response, session: ShopifySession): void {
  const cookie = sessionCookie(session);
  if (cookie) response.headers.append("set-cookie", cookie);
}

export async function shopifySessionFromRequest(request: CookieRequest): Promise<{
  session: ShopifySession | null;
  setCookie: string;
}> {
  const storedSession = decryptSession(getCookie(request, SESSION_COOKIE));
  if (storedSession) return { session: storedSession, setCookie: "" };

  const clientSession = headerSession(request);
  if (clientSession) return { session: clientSession, setCookie: "" };

  const token = bearerToken(request) || urlSessionToken(request);
  if (!token) return { session: null, setCookie: "" };

  const url = new URL(request.url);
  const shop =
    normalizeStoreDomain(url.searchParams.get("shop")) ||
    shopFromIdToken(token) ||
    defaultShopDomain();
  if (!shop) return { session: null, setCookie: "" };

  const accessToken = await exchangeSessionTokenForAccessToken(shop, token);
  const freshSession: ShopifySession = {
    shop,
    accessToken,
    createdAt: new Date().toISOString(),
    mode: "token-exchange",
  };

  return { session: freshSession, setCookie: sessionCookie(freshSession) };
}
