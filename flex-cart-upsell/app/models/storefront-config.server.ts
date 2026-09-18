import type { CampaignDraft } from "../lib/recommendation-types";

type AdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<{ json: () => Promise<unknown> }>;
};

// Mirror only an already opted-in placement, after Shopify confirms the
// corresponding discount update. Never publish tokens or catalogue snapshots.
export async function syncNativeStorefrontConfig(
  admin: AdminClient,
  campaign: CampaignDraft,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await admin.graphql(`#graphql
      query ReadNativeUpsellConfig {
        shop { id metafield(namespace: "camosignal_upsell", key: "storefront_config") { id value compareDigest } }
      }
    `);
    const result = (await response.json()) as {
      errors?: { message: string }[];
      data?: {
        shop: {
          id: string;
          metafield: { value: string; compareDigest: string } | null;
        };
      };
    };
    if (result.errors?.length || !result.data)
      throw new Error("Unable to read Shopify storefront configuration.");
    const { shop } = result.data;
    if (!shop.metafield) return;
    const config = JSON.parse(shop.metafield.value);
    if (config?.version !== 1 || !config.placements?.[campaign.placement])
      return;
    config.placements[campaign.placement] = {
      ...config.placements[campaign.placement],
      enabled: campaign.enabled,
      maxProducts: campaign.filters.maxProducts,
      appearance: campaign.appearance,
      discount: campaign.discount,
    };
    const saved = await admin.graphql(
      `#graphql
      mutation WriteNativeUpsellConfig($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message code }
        }
      }
    `,
      {
        variables: {
          metafields: [
            {
              ownerId: shop.id,
              namespace: "camosignal_upsell",
              key: "storefront_config",
              type: "json",
              value: JSON.stringify(config),
              compareDigest: shop.metafield.compareDigest,
            },
          ],
        },
      },
    );
    const savedResult = (await saved.json()) as {
      errors?: { message: string }[];
      data?: {
        metafieldsSet: { userErrors: { message: string; code: string }[] };
      };
    };
    if (savedResult.errors?.length || !savedResult.data)
      throw new Error("Unable to save Shopify storefront configuration.");
    const errors = savedResult.data.metafieldsSet.userErrors;
    if (!errors.length) return;
    if (!errors.every((error) => error.code === "INVALID_COMPARE_DIGEST")) {
      throw new Error(errors.map((error) => error.message).join("; "));
    }
  }
  throw new Error(
    "Storefront configuration changed concurrently. Please save again.",
  );
}
