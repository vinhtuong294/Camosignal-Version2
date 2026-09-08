import { NextRequest, NextResponse } from "next/server";
import {
  bearerToken,
  encryptedSessionValue,
  exchangeSessionTokenForAccessToken,
  normalizeStoreDomain,
  setSessionCookieHeaders,
  shopFromIdToken,
  type ShopifySession,
} from "@/lib/shopify-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.idToken || body.sessionToken || bearerToken(request) || "").trim();
  if (!token) {
    return NextResponse.json({ error: "Missing Shopify session token" }, { status: 400 });
  }

  const shop =
    normalizeStoreDomain(body.shop) ||
    shopFromIdToken(token) ||
    normalizeStoreDomain(process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP_DOMAIN);
  if (!shop) {
    return NextResponse.json({ error: "Missing or invalid Shopify shop domain" }, { status: 400 });
  }

  try {
    const accessToken = await exchangeSessionTokenForAccessToken(shop, token);
    const session: ShopifySession = {
      shop,
      accessToken,
      createdAt: new Date().toISOString(),
      mode: "token-exchange",
    };
    const clientSession = encryptedSessionValue(session);
    console.info("csi_auth_exchange", {
      shop,
      hasClientSession: Boolean(clientSession),
    });
    const response = NextResponse.json({ connected: true, shop, clientSession });
    setSessionCookieHeaders(response, session);
    return response;
  } catch (error) {
    console.info("csi_auth_exchange_error", {
      shop,
      message: error instanceof Error ? error.message : "Unable to connect Shopify session",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to connect Shopify session" },
      { status: error && typeof error === "object" && "status" in error ? Number(error.status) : 500 },
    );
  }
}
