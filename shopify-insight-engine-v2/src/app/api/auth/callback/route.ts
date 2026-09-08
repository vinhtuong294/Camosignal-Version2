import { NextRequest, NextResponse } from "next/server";
import {
  appUrl,
  clearStateCookie,
  encryptedSessionValue,
  exchangeCodeForToken,
  normalizeStoreDomain,
  setSessionCookieHeaders,
  type ShopifySession,
  validState,
  verifyShopifyHmac,
} from "@/lib/shopify-session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const shop = normalizeStoreDomain(url.searchParams.get("shop"));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateOk = validState(request, state);
  const hmacOk = verifyShopifyHmac(url);

  console.info("csi_auth_callback", {
    shop,
    hasCode: Boolean(code),
    stateOk,
    hmacOk,
    host: request.headers.get("host"),
  });

  if (!shop || !code) {
    return NextResponse.json({ error: "Missing Shopify OAuth callback parameters" }, { status: 400 });
  }
  if (!stateOk) {
    return NextResponse.json({ error: "Invalid Shopify OAuth state" }, { status: 400 });
  }
  if (!hmacOk) {
    return NextResponse.json({ error: "Invalid Shopify OAuth HMAC" }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    const session: ShopifySession = {
      shop,
      accessToken,
      createdAt: new Date().toISOString(),
    };
    const redirectUrl = new URL(appUrl(request).replace(/\/+$/g, "") || request.url);
    redirectUrl.searchParams.set("shop", shop);
    redirectUrl.searchParams.set("connected", "1");
    const encryptedSession = encryptedSessionValue(session);
    if (encryptedSession) redirectUrl.searchParams.set("csi_session", encryptedSession);
    console.info("csi_auth_connected", {
      shop,
      hasEncryptedSession: Boolean(encryptedSession),
    });
    const response = NextResponse.redirect(redirectUrl);
    setSessionCookieHeaders(response, session);
    response.headers.append("set-cookie", clearStateCookie());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to complete Shopify OAuth" },
      { status: error && typeof error === "object" && "status" in error ? Number(error.status) : 500 },
    );
  }
}
