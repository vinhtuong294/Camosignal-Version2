import { NextRequest, NextResponse } from "next/server";
import { normalizeStoreDomain, oauthConfigured, shopifySessionFromRequest } from "@/lib/shopify-session";

export async function GET(request: NextRequest) {
  const sessionResult = await shopifySessionFromRequest(request).catch(() => ({
    session: null,
    setCookie: "",
  }));
  const url = new URL(request.url);
  const response = NextResponse.json({
    oauthConfigured: oauthConfigured(),
    connected: Boolean(sessionResult.session?.accessToken),
    shop:
      sessionResult.session?.shop ||
      normalizeStoreDomain(url.searchParams.get("shop")) ||
      normalizeStoreDomain(process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP_DOMAIN),
  });

  if (sessionResult.setCookie) response.headers.append("set-cookie", sessionResult.setCookie);
  return response;
}
