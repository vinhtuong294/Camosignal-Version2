import type { ShopifyAdminClient } from "./shopify-listing.server";

type DirectShopifyConfig = {
  shop: string;
  clientId: string;
  clientSecret: string;
  apiVersion: string;
};

type AccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function normalizeShop(shop: string) {
  const hostname = shop.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(hostname)) {
    throw new Error("SHOPIFY_SHOP must be a valid *.myshopify.com domain.");
  }
  return hostname;
}

function config(): DirectShopifyConfig {
  const values = {
    shop: env("SHOPIFY_SHOP"),
    clientId: env("SHOPIFY_CLIENT_ID"),
    clientSecret: env("SHOPIFY_CLIENT_SECRET"),
    apiVersion: env("SHOPIFY_ADMIN_API_VERSION") || "2026-07",
  };
  const missing = [
    ["SHOPIFY_SHOP", values.shop],
    ["SHOPIFY_CLIENT_ID", values.clientId],
    ["SHOPIFY_CLIENT_SECRET", values.clientSecret],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Missing direct Shopify configuration: ${missing.join(", ")}`);
  return { ...values, shop: normalizeShop(values.shop) };
}

export function getDirectShopifyConfigStatus() {
  const required = ["SHOPIFY_SHOP", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"];
  return { configured: required.every((name) => Boolean(env(name))), missing: required.filter((name) => !env(name)) };
}

async function accessToken(settings: DirectShopifyConfig) {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
  });
  const response = await fetch(`https://${settings.shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json()) as AccessTokenResponse & { errors?: string };
  if (!response.ok || !data.access_token) throw new Error(`Shopify authentication failed: ${data.errors ?? response.statusText}`);
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 86_400) - 300) * 1_000 };
  return cachedToken.value;
}

export async function getDirectShopifyAdmin(): Promise<{ admin: ShopifyAdminClient; shop: string }> {
  const settings = config();
  const token = await accessToken(settings);
  return {
    shop: settings.shop,
    admin: {
      graphql: (query, options = {}) =>
        fetch(`https://${settings.shop}/admin/api/${settings.apiVersion}/graphql.json`, {
          method: "POST",
          headers: { "content-type": "application/json", "X-Shopify-Access-Token": token },
          body: JSON.stringify({ query, variables: options.variables ?? {} }),
        }),
    },
  };
}
