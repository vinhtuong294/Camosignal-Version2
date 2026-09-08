import { productRequiresCustomization } from "./product-eligibility.ts";
import type { ProductCandidate } from "./recommendation-types";

export interface StorefrontPreviewProduct {
  compareAtPrice?: number;
  handle: string;
  imageUrl?: string;
  price: number;
  requiresCustomization: boolean;
  title: string;
  vendor: string;
  variants: Array<{
    id: string;
    price: number;
    title: string;
  }>;
}

export interface StorefrontPreviewProfile {
  shopDomain: string;
  shopName: string;
  storefrontUrl: string;
  theme: {
    bodyFontSize: number;
    buttonBackground: string;
    buttonHeight: number;
    buttonRadius: number;
    buttonTextColor: string;
    fontFamily: string;
    profileLabel: string;
    saleAccent: string;
  };
  primaryProduct?: StorefrontPreviewProduct;
  recommendedProducts: StorefrontPreviewProduct[];
}

function toPreviewProduct(product: ProductCandidate): StorefrontPreviewProduct {
  const firstVariant = product.variants.find((variant) => variant.available);

  return {
    compareAtPrice: firstVariant?.compareAtPrice,
    handle: product.handle,
    imageUrl: product.imageUrl,
    price: firstVariant?.price ?? product.priceMin,
    requiresCustomization: productRequiresCustomization(product),
    title: product.title,
    vendor: product.vendor,
    variants: product.variants
      .filter((variant) => variant.available)
      .slice(0, 8)
      .map((variant) => ({
        id: variant.id,
        price: variant.price,
        title: variant.title,
      })),
  };
}

export function createStorefrontPreviewProfile({
  products,
  shopDomain,
  shopName,
  storefrontUrl,
}: {
  products: ProductCandidate[];
  shopDomain: string;
  shopName: string;
  storefrontUrl: string;
}): StorefrontPreviewProfile {
  const isCamoSignal = shopDomain.toLowerCase().includes("apepsd-ha");
  const previewProducts = products
    .filter((product) => product.inventoryAvailable)
    .map(toPreviewProduct);

  return {
    shopDomain,
    shopName,
    storefrontUrl,
    theme: isCamoSignal
      ? {
          bodyFontSize: 16,
          buttonBackground: "#294237",
          buttonHeight: 46,
          buttonRadius: 8,
          buttonTextColor: "#ffffff",
          fontFamily: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif',
          profileLabel: "CamoSignal theme profile",
          saleAccent: "#c84436",
        }
      : {
          bodyFontSize: 16,
          buttonBackground: "#1f2124",
          buttonHeight: 42,
          buttonRadius: 8,
          buttonTextColor: "#ffffff",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          profileLabel: "Installed store profile",
          saleAccent: "#d72c0d",
        },
    primaryProduct: previewProducts[0],
    recommendedProducts: previewProducts.slice(1, 5),
  };
}

export function createThemeEditorPreviewUrl({
  apiKey,
  placement,
  shopDomain,
}: {
  apiKey: string;
  placement: "PRODUCT_PAGE" | "CART_DRAWER" | "CART_PAGE";
  shopDomain: string;
}) {
  const parameters = new URLSearchParams({
    addAppBlockId: `${apiKey}/${
      placement === "PRODUCT_PAGE"
        ? "product-page-upsell"
        : placement === "CART_DRAWER"
          ? "cart-drawer-upsell"
          : "cart-page-upsell"
    }`,
    target:
      placement === "CART_DRAWER" ? "sectionGroup:header" : "newAppsSection",
    template: placement === "CART_PAGE" ? "cart" : "product",
  });

  return `https://${shopDomain}/admin/themes/current/editor?${parameters}`;
}
