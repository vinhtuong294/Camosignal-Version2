import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  CampaignDashboard,
  CampaignTemplatePicker,
} from "../components/campaign-dashboard";
import { CampaignEditor } from "../components/campaign-editor";
import type { CampaignDraft, Placement } from "../lib/recommendation-types";
import {
  createStorefrontPreviewProfile,
  createThemeEditorPreviewUrl,
} from "../lib/storefront-preview-profile";
import {
  getCampaign,
  getCatalogueStatus,
  getProductCatalogue,
  saveCampaign,
} from "../models/campaign.server";
import { getDashboardMetrics } from "../models/dashboard.server";
import { syncUpsellCampaignDiscount } from "../models/upsell-discount.server";
import { syncNativeStorefrontConfig } from "../models/storefront-config.server";
import { authenticate } from "../shopify.server";
import { syncProductCatalogue } from "../models/catalogue-sync.server";

interface PreviewShopQueryResponse {
  data?: {
    shop: {
      name: string;
      primaryDomain: { url: string };
    };
  };
}

type AppView = "dashboard" | "create" | "editor";

function getPlacement(request: Request): Placement {
  const placement = new URL(request.url).searchParams.get("placement");
  if (placement === "PRODUCT_PAGE") return "PRODUCT_PAGE";
  if (placement === "CART_PAGE") return "CART_PAGE";
  return "CART_DRAWER";
}

function getView(request: Request): AppView {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/create")) return "create";
  if (url.pathname.endsWith("/editor")) return "editor";
  const requestedView = url.searchParams.get("view");
  if (requestedView === "create") return "create";
  if (requestedView === "editor" || url.searchParams.has("placement")) {
    return "editor";
  }
  return "dashboard";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const placement = getPlacement(request);
  const [
    productPageCampaign,
    drawerCampaign,
    cartPageCampaign,
    catalogue,
    products,
    metrics,
    shopResponse,
  ] = await Promise.all([
    getCampaign(session.shop, "PRODUCT_PAGE"),
    getCampaign(session.shop, "CART_DRAWER"),
    getCampaign(session.shop, "CART_PAGE"),
    getCatalogueStatus(session.shop),
    getProductCatalogue(session.shop),
    getDashboardMetrics(session.shop),
    admin.graphql(`#graphql
      query FlexUpsellPreviewShop {
        shop {
          name
          primaryDomain {
            url
          }
        }
      }
    `),
  ]);
  const campaign =
    placement === "PRODUCT_PAGE"
      ? productPageCampaign
      : placement === "CART_PAGE"
        ? cartPageCampaign
        : drawerCampaign;
  const shopResult = (await shopResponse.json()) as PreviewShopQueryResponse;
  const shopName = shopResult.data?.shop.name ?? session.shop.split(".")[0];
  const storefrontUrl =
    shopResult.data?.shop.primaryDomain.url ?? `https://${session.shop}`;
  const storefrontProfile = createStorefrontPreviewProfile({
    products,
    shopDomain: session.shop,
    shopName,
    storefrontUrl,
  });
  const testInStoreUrl = createThemeEditorPreviewUrl({
    apiKey: process.env.SHOPIFY_API_KEY ?? "",
    placement,
    shopDomain: session.shop,
  });

  return {
    campaign,
    campaigns: [productPageCampaign, drawerCampaign, cartPageCampaign],
    catalogue,
    metrics,
    productChoices: products.map((product) => ({
      id: product.productId,
      title: product.title,
    })),
    storefrontProfile,
    testInStoreUrl,
    view: getView(request),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");

  if (intent === "sync-catalogue") {
    try {
      const count = await syncProductCatalogue({
        admin,
        shop: session.shop,
      });
      return { ok: true, intent, count };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sync the product catalogue.";
      console.error("Catalogue sync failed", {
        error: message,
        shop: session.shop,
      });
      return { ok: false, intent, error: message };
    }
  }
  const payload = String(formData.get("payload") ?? "");
  const campaign = JSON.parse(payload) as CampaignDraft;
  const savedCampaign = await saveCampaign(session.shop, campaign);

  try {
    await syncUpsellCampaignDiscount({
      admin,
      campaign: savedCampaign,
      shop: session.shop,
    });
    await syncNativeStorefrontConfig(admin, savedCampaign);
  } catch (error) {
    console.error("Upsell discount sync failed", {
      error,
      placement: savedCampaign.placement,
      shop: session.shop,
    });
    return {
      ok: false,
      intent,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the upsell discount.",
    };
  }

  return { ok: true, intent: "save" };
};

export default function Index() {
  const {
    campaign,
    campaigns,
    catalogue,
    metrics,
    productChoices,
    storefrontProfile,
    testInStoreUrl,
    view,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isSaving =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "save";
  const isSyncing =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "sync-catalogue";

  useEffect(() => {
    if (!fetcher.data || fetcher.state !== "idle") return;
    if (!fetcher.data.ok) {
      shopify.toast.show(
        fetcher.data.error ?? "Unable to sync the product catalogue.",
        { isError: true },
      );
      return;
    }
    shopify.toast.show(
      fetcher.data.intent === "sync-catalogue"
        ? `${fetcher.data.count ?? 0} products synced`
        : "Campaign saved",
    );
  }, [fetcher.data, fetcher.state, shopify]);

  if (view === "dashboard") {
    return (
      <CampaignDashboard
        campaigns={campaigns}
        catalogueCount={catalogue.count}
        metrics={metrics}
        syncedAt={catalogue.syncedAt}
        themeEditorUrl={testInStoreUrl}
      />
    );
  }

  if (view === "create") {
    return <CampaignTemplatePicker />;
  }

  return (
    <CampaignEditor
      catalogueCount={catalogue.count}
      initialCampaign={campaign}
      key={campaign.placement}
      onSave={(nextCampaign) =>
        fetcher.submit(
          {
            intent: "save",
            payload: JSON.stringify(nextCampaign),
          },
          { action: "/app?index", method: "POST" },
        )
      }
      onSync={() =>
        fetcher.submit(
          { intent: "sync-catalogue" },
          { action: "/app?index", method: "POST" },
        )
      }
      productChoices={productChoices}
      saving={isSaving}
      storefrontProfile={storefrontProfile}
      syncedAt={catalogue.syncedAt}
      syncing={isSyncing}
      testInStoreUrl={testInStoreUrl}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
