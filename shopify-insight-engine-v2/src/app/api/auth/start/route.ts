import { NextRequest, NextResponse } from "next/server";
import {
  authorizeUrl,
  defaultShopDomain,
  makeState,
  normalizeStoreDomain,
  oauthConfigured,
  stateCookie,
} from "@/lib/shopify-session";

export async function GET(request: NextRequest) {
  if (!oauthConfigured()) {
    return NextResponse.json(
      { error: "Shopify OAuth is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const shop = normalizeStoreDomain(url.searchParams.get("shop")) || defaultShopDomain();
  if (!shop) {
    return NextResponse.json({ error: "Missing or invalid shop domain" }, { status: 400 });
  }

  const state = makeState();
  console.info("csi_auth_start", {
    shop,
    hasShopParam: Boolean(url.searchParams.get("shop")),
    host: request.headers.get("host"),
  });
  const response = NextResponse.redirect(authorizeUrl(request, shop, state));
  response.headers.append("set-cookie", stateCookie(state));
  return response;
}
