import { useSearchParams } from "react-router";
import { CampaignEditor } from "../components/campaign-editor";
import { createDefaultCampaign } from "../lib/campaign-defaults";
import type { ProductCandidate } from "../lib/recommendation-types";
import { createStorefrontPreviewProfile } from "../lib/storefront-preview-profile";
import beanieImage from "../assets/camosignal-preview/black-labrador-beanie.jpg";
import hoodieImage from "../assets/camosignal-preview/bred-to-point-hoodie.jpg";
import troutShirtImage from "../assets/camosignal-preview/trout-long-sleeve.jpg";
import elkShirtImage from "../assets/camosignal-preview/elk-long-sleeve.jpg";

function previewProduct({
  id,
  imageUrl,
  price,
  title,
  tags = [],
}: {
  id: string;
  imageUrl: string;
  price: number;
  title: string;
  tags?: string[];
}): ProductCandidate {
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    productId: `gid://shopify/Product/${id}`,
    handle,
    title,
    vendor: "CamoSignal",
    productType: title.includes("Beanie") ? "Accessories" : "Apparel",
    tags,
    collections: ["featured"],
    imageUrl,
    priceMin: price,
    priceMax: price,
    inventoryAvailable: true,
    popularityScore: 90,
    variants: [
      {
        id: `gid://shopify/ProductVariant/${id}01`,
        title: "SAND / S",
        price,
        compareAtPrice: Number((price / 0.9).toFixed(2)),
        available: true,
      },
      {
        id: `gid://shopify/ProductVariant/${id}02`,
        title: "CHARCOAL / M",
        price,
        compareAtPrice: Number((price / 0.9).toFixed(2)),
        available: true,
      },
    ],
  };
}

const camosignalProducts = [
  previewProduct({
    id: "1001",
    imageUrl: beanieImage,
    price: 24.95,
    title: "Black Labrador Embroidery Beanie",
  }),
  previewProduct({
    id: "1002",
    imageUrl: hoodieImage,
    price: 63,
    title: "Bred To Point Hunting Hoodie",
  }),
  previewProduct({
    id: "1003",
    imageUrl: elkShirtImage,
    price: 22.46,
    title: "The Wild Proclaims His Glory Long-sleeve",
    tags: ["flex-upsell:customize"],
  }),
  previewProduct({
    id: "1004",
    imageUrl: troutShirtImage,
    price: 22.46,
    title: "Cast All Your Cares Fishing Long-sleeve",
  }),
];

export default function Preview() {
  const [searchParams] = useSearchParams();
  const requestedPlacement = searchParams.get("placement");
  const placement =
    requestedPlacement === "PRODUCT_PAGE"
      ? "PRODUCT_PAGE"
      : requestedPlacement === "CART_PAGE"
        ? "CART_PAGE"
        : "CART_DRAWER";
  const campaign = createDefaultCampaign(placement);
  const storefrontProfile = createStorefrontPreviewProfile({
    products: camosignalProducts,
    shopDomain: "apepsd-ha.myshopify.com",
    shopName: "CamoSignal",
    storefrontUrl: "https://camosignal.com",
  });

  return (
    <main className="preview-only-shell">
      <CampaignEditor
        catalogueCount={248}
        initialCampaign={campaign}
        onSave={() => undefined}
        onSync={() => undefined}
        productChoices={camosignalProducts.map((product) => ({
          id: product.productId,
          title: product.title,
        }))}
        saving={false}
        storefrontProfile={storefrontProfile}
        testInStoreUrl="https://apepsd-ha.myshopify.com/admin/themes/current/editor"
        syncedAt="2026-07-28T02:30:00.000Z"
        syncing={false}
      />
    </main>
  );
}
