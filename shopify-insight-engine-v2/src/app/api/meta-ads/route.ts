import { NextRequest, NextResponse } from "next/server";
import {
  GoogleMetaAdsError,
  googleMetaAdsConfigured,
  loadGoogleMetaAds,
} from "@/lib/google-meta-ads";
import { defaultShopDomain, shopifySessionFromRequest } from "@/lib/shopify-session";

export const runtime = "nodejs";

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  setCookie = "",
): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("cache-control", "private, no-store, max-age=0");
  response.headers.set("vary", "Authorization, Cookie, x-csi-shopify-session");
  response.headers.set("x-content-type-options", "nosniff");
  if (setCookie) response.headers.append("set-cookie", setCookie);
  return response;
}

export async function GET(request: NextRequest) {
  const sessionResult = await shopifySessionFromRequest(request).catch(() => ({
    session: null,
    setCookie: "",
  }));
  const expectedShop = defaultShopDomain();
  const sessionShop = sessionResult.session?.shop || "";

  if (!sessionShop) {
    return jsonResponse(
      {
        error: "Open the app inside Shopify Admin before syncing private Ads data.",
        code: "SHOPIFY_SESSION_REQUIRED",
      },
      401,
      sessionResult.setCookie,
    );
  }

  if (sessionShop && expectedShop && sessionShop !== expectedShop) {
    return jsonResponse(
      {
        error: "This Shopify session is not allowed to read the configured Ads Sheet.",
        code: "SHOPIFY_STORE_FORBIDDEN",
      },
      403,
      sessionResult.setCookie,
    );
  }

  if (!googleMetaAdsConfigured()) {
    return jsonResponse(
      {
        error: "Google Sheets sync is not configured on the server. Manual CSV/JSON import is still available.",
        code: "GOOGLE_SHEETS_NOT_CONFIGURED",
      },
      503,
      sessionResult.setCookie,
    );
  }

  try {
    const url = new URL(request.url);
    const result = await loadGoogleMetaAds({ force: url.searchParams.get("refresh") === "1" });
    return jsonResponse(
      {
        source: "google-sheets",
        rows: result.rows,
        loadedAt: result.loadedAt,
        sheet: result.sheet,
      },
      200,
      sessionResult.setCookie,
    );
  } catch (error) {
    if (error instanceof GoogleMetaAdsError) {
      return jsonResponse(
        {
          error: error.message,
          code: error.code,
        },
        error.status,
        sessionResult.setCookie,
      );
    }

    return jsonResponse(
      {
        error: "Google Sheets data could not be loaded. Manual CSV/JSON import is still available.",
        code: "GOOGLE_SHEETS_UNKNOWN_ERROR",
      },
      502,
      sessionResult.setCookie,
    );
  }
}
