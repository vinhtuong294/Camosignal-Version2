import { NextRequest, NextResponse } from "next/server";
import { adaptLegacyInsights } from "@/lib/legacy-adapter";
import { sampleAnalysis } from "@/lib/sample-analysis";
import { buildShopifyLiveAnalysis, shopifyLiveConfigured } from "@/lib/shopify-live";
import { shopifySessionFromRequest } from "@/lib/shopify-session";

const legacyEndpoint = process.env.LEGACY_INSIGHTS_API || "";

function legacyInsightsConfigured(request: NextRequest | Request) {
  if (!legacyEndpoint) return false;

  try {
    const current = new URL(request.url);
    const legacy = new URL(legacyEndpoint);
    return legacy.origin !== current.origin || legacy.pathname !== current.pathname;
  } catch {
    return false;
  }
}

function legacyUrl(request: NextRequest) {
  if (!legacyInsightsConfigured(request)) {
    throw new Error("Legacy insights API is not configured");
  }

  const incoming = new URL(request.url);
  const target = new URL(legacyEndpoint);
  target.searchParams.set("source", incoming.searchParams.get("source") || "shopify");

  for (const key of [
    "days",
    "start",
    "end",
    "shop",
    "seasonMapping",
    "currentAdSpend",
    "previousAdSpend",
  ]) {
    const value = incoming.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }

  const accessKey = process.env.LEGACY_INSIGHTS_KEY || incoming.searchParams.get("key");
  if (accessKey) target.searchParams.set("key", accessKey);

  return target;
}

function proxyHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  const insightKey = request.headers.get("x-insight-key") || process.env.LEGACY_INSIGHTS_KEY;

  if (authorization) headers.set("authorization", authorization);
  if (cookie) headers.set("cookie", cookie);
  if (insightKey) headers.set("x-insight-key", insightKey);

  return headers;
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url);
  if (incoming.searchParams.get("source") === "sample") {
    return NextResponse.json({
      source: "sample",
      analysis: sampleAnalysis,
    });
  }

  const wantsShopify = incoming.searchParams.get("source") === "shopify";
  let sessionResult: Awaited<ReturnType<typeof shopifySessionFromRequest>> = {
    session: null,
    setCookie: "",
  };
  if (wantsShopify) {
    try {
      sessionResult = await shopifySessionFromRequest(request);
      console.info("csi_insights_auth", {
        hasAuthorization: Boolean(request.headers.get("authorization")),
        hasClientSession: Boolean(request.headers.get("x-csi-shopify-session")),
        hasCookie: Boolean(request.headers.get("cookie")),
        sessionReady: Boolean(sessionResult.session?.accessToken),
        shop: sessionResult.session?.shop || incoming.searchParams.get("shop") || "",
      });
    } catch (error) {
      sessionResult = { session: null, setCookie: "" };
      const authError = error instanceof Error ? error.message : "Could not exchange Shopify session token";
      console.info("csi_insights_auth_error", {
        hasAuthorization: Boolean(request.headers.get("authorization")),
        hasClientSession: Boolean(request.headers.get("x-csi-shopify-session")),
        shop: incoming.searchParams.get("shop") || "",
        message: authError,
      });
      if ((incoming.searchParams.get("id_token") || incoming.searchParams.get("session") || request.headers.get("authorization")) && !shopifyLiveConfigured()) {
        return NextResponse.json(
          {
            source: "sample",
            warning: authError,
            analysis: sampleAnalysis,
          },
          { status: 200 },
        );
      }
    }
  }

  if (wantsShopify && (sessionResult.session?.accessToken || shopifyLiveConfigured())) {
    try {
      const response = NextResponse.json({
        source: "shopify",
        rawSource: sessionResult.session?.accessToken ? "shopify-session-token" : "shopify-admin-api",
        analysis: await buildShopifyLiveAnalysis(incoming.searchParams, sessionResult.session),
      });
      if (sessionResult.setCookie) response.headers.append("set-cookie", sessionResult.setCookie);
      return response;
    } catch (error) {
      const directError = error instanceof Error ? error.message : "Direct Shopify data unavailable";
      if (!legacyInsightsConfigured(request)) {
        return NextResponse.json(
          {
            source: "sample",
            warning: directError,
            analysis: sampleAnalysis,
          },
          { status: 200 },
        );
      }

      try {
        const response = await fetch(legacyUrl(request), {
          headers: proxyHeaders(request),
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || `Legacy insights returned ${response.status}`);
        }

        const nextResponse = NextResponse.json({
          source: payload?.source || "shopify",
          rawSource: "legacy-shopify-insight-engine",
          warning: `Direct Shopify failed: ${directError}`,
          snapshot: payload?.snapshot,
          analysis: adaptLegacyInsights(payload),
        });
        if (sessionResult.setCookie) nextResponse.headers.append("set-cookie", sessionResult.setCookie);
        return nextResponse;
      } catch {
        return NextResponse.json(
          {
            source: "sample",
            warning: directError,
            analysis: sampleAnalysis,
          },
          { status: 200 },
        );
      }
    }
  }

  if (wantsShopify && !legacyInsightsConfigured(request)) {
    return NextResponse.json(
      {
        source: "sample",
        warning: "Shopify session token is missing. Open the app inside Shopify Admin, or configure SHOPIFY_ADMIN_ACCESS_TOKEN for direct server access.",
        analysis: sampleAnalysis,
      },
      { status: 200 },
    );
  }

  try {
    const response = await fetch(legacyUrl(request), {
      headers: proxyHeaders(request),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || `Legacy insights returned ${response.status}`);
    }

    return NextResponse.json({
      source: payload?.source || "shopify",
      rawSource: "legacy-shopify-insight-engine",
      snapshot: payload?.snapshot,
      analysis: adaptLegacyInsights(payload),
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "sample",
        warning: error instanceof Error ? error.message : "Live Shopify data unavailable",
        analysis: sampleAnalysis,
      },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.text();

  try {
    if (!legacyInsightsConfigured(request)) {
      throw new Error("Legacy insights API is not configured");
    }

    const response = await fetch(legacyEndpoint, {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") || "application/json",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Legacy insights returned ${response.status}`);
    }

    const payload = await response.json();
    return NextResponse.json({
      source: "legacy",
      ...payload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "sample",
        warning: error instanceof Error ? error.message : "Legacy insights unavailable",
        analysis: sampleAnalysis,
      },
      { status: 200 },
    );
  }
}
