import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma, { ensureSessionTable } from "./db.server";

type CamoSessionStorage = PrismaSessionStorage<typeof prisma>;

let repairedSessionStorage: CamoSessionStorage | undefined;

async function getSessionStorage() {
  await ensureSessionTable();
  repairedSessionStorage ??= new PrismaSessionStorage(prisma);
  return repairedSessionStorage;
}

const repairingSessionStorage = {
  async storeSession(
    ...args: Parameters<CamoSessionStorage["storeSession"]>
  ) {
    return (await getSessionStorage()).storeSession(...args);
  },
  async loadSession(...args: Parameters<CamoSessionStorage["loadSession"]>) {
    return (await getSessionStorage()).loadSession(...args);
  },
  async deleteSession(...args: Parameters<CamoSessionStorage["deleteSession"]>) {
    return (await getSessionStorage()).deleteSession(...args);
  },
  async deleteSessions(
    ...args: Parameters<CamoSessionStorage["deleteSessions"]>
  ) {
    return (await getSessionStorage()).deleteSessions(...args);
  },
  async findSessionsByShop(
    ...args: Parameters<CamoSessionStorage["findSessionsByShop"]>
  ) {
    return (await getSessionStorage()).findSessionsByShop(...args);
  },
};

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July26,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: repairingSessionStorage,
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
