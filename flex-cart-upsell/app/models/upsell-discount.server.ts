import type { CampaignDraft } from "../lib/recommendation-types";
import {
  automaticAppDiscountSearchQuery,
  findOwnedAutomaticAppDiscountId,
  isDuplicateDiscountTitleError,
  type AutomaticAppDiscountReference,
  type DiscountFunctionReference,
  type DiscountUserError,
} from "../lib/upsell-discount-recovery";
import {
  getCampaignDiscountId,
  setCampaignDiscountId,
} from "./campaign.server";

type GraphqlResponse = {
  json: () => Promise<unknown>;
};

type AdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<GraphqlResponse>;
};

type GraphqlResult<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type UserError = DiscountUserError;

const FUNCTION_HANDLE = "flex-upsell-product-discount";
const METAFIELD_NAMESPACE = "$app:flex-upsell-product-discount";
const METAFIELD_KEY = "configuration";

function userErrorMessage(userErrors: UserError[]) {
  return userErrors
    .map((error) =>
      error.field?.length
        ? `${error.field.join(".")}: ${error.message}`
        : error.message,
    )
    .join("; ");
}

async function graphql<T>(
  admin: AdminClient,
  query: string,
  variables: Record<string, unknown>,
) {
  const response = await admin.graphql(query, { variables });
  const result = (await response.json()) as GraphqlResult<T>;
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join("; "));
  }
  if (!result.data) throw new Error("Shopify returned no discount data.");
  return result.data;
}

function discountMetafield(campaign: CampaignDraft) {
  return {
    key: METAFIELD_KEY,
    namespace: METAFIELD_NAMESPACE,
    type: "json",
    value: JSON.stringify({
      campaignKey: campaign.placement,
      discountType: campaign.discount.type,
      message: campaign.discount.message.trim() || "Upsell offer",
      value: campaign.discount.value,
    }),
  };
}

function discountTitle(campaign: CampaignDraft) {
  return `${campaign.name} - Upsell discount`;
}

async function deleteDiscount(admin: AdminClient, discountId: string) {
  const data = await graphql<{
    discountAutomaticDelete: {
      userErrors: UserError[];
    };
  }>(
    admin,
    `
      #graphql
      mutation DeleteFlexUpsellDiscount($id: ID!) {
        discountAutomaticDelete(id: $id) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    { id: discountId },
  );
  const errors = data.discountAutomaticDelete.userErrors;
  if (errors.length) throw new Error(userErrorMessage(errors));
}

async function updateDiscount(
  admin: AdminClient,
  discountId: string,
  campaign: CampaignDraft,
) {
  const data = await graphql<{
    discountAutomaticAppUpdate: {
      automaticAppDiscount: { discountId: string } | null;
      userErrors: UserError[];
    };
  }>(
    admin,
    `
      #graphql
      mutation UpdateFlexUpsellDiscount(
        $id: ID!
        $automaticAppDiscount: DiscountAutomaticAppInput!
      ) {
        discountAutomaticAppUpdate(
          id: $id
          automaticAppDiscount: $automaticAppDiscount
        ) {
          automaticAppDiscount {
            discountId
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      id: discountId,
      automaticAppDiscount: {
        metafields: [discountMetafield(campaign)],
        title: discountTitle(campaign),
      },
    },
  );
  const errors = data.discountAutomaticAppUpdate.userErrors;
  if (errors.length) throw new Error(userErrorMessage(errors));
}

async function findExistingDiscountId(
  admin: AdminClient,
  campaign: CampaignDraft,
) {
  const title = discountTitle(campaign);
  const data = await graphql<{
    discountNodes: {
      nodes: Array<{
        configuration: { value: string } | null;
        discount: {
          __typename: string;
          appDiscountType?: { appKey: string; functionId: string };
          discountId?: string;
          title?: string;
        };
      }>;
    };
    shopifyFunctions: { nodes: DiscountFunctionReference[] };
  }>(
    admin,
    `
      #graphql
      query FindFlexUpsellDiscount($query: String!) {
        shopifyFunctions(first: 100) {
          nodes {
            appKey
            handle
            id
          }
        }
        discountNodes(first: 25, query: $query) {
          nodes {
            configuration: metafield(
              namespace: "$app:flex-upsell-product-discount"
              key: "configuration"
            ) {
              value
            }
            discount {
              __typename
              ... on DiscountAutomaticApp {
                appDiscountType {
                  appKey
                  functionId
                }
                discountId
                title
              }
            }
          }
        }
      }
    `,
    { query: automaticAppDiscountSearchQuery(title) },
  );
  const candidates = data.discountNodes.nodes.flatMap(
    ({ configuration, discount }): AutomaticAppDiscountReference[] => {
      if (
        discount.__typename !== "DiscountAutomaticApp" ||
        !discount.appDiscountType ||
        !discount.discountId ||
        !discount.title
      ) {
        return [];
      }

      return [
        {
          appKey: discount.appDiscountType.appKey,
          configurationValue: configuration?.value ?? null,
          discountId: discount.discountId,
          functionId: discount.appDiscountType.functionId,
          title: discount.title,
        },
      ];
    },
  );

  return findOwnedAutomaticAppDiscountId({
    candidates,
    functions: data.shopifyFunctions.nodes,
    functionHandle: FUNCTION_HANDLE,
    placement: campaign.placement,
    title,
  });
}

async function adoptExistingDiscount(
  admin: AdminClient,
  campaign: CampaignDraft,
  shop: string,
) {
  const discountId = await findExistingDiscountId(admin, campaign);
  if (!discountId) return false;

  await updateDiscount(admin, discountId, campaign);
  await setCampaignDiscountId(shop, campaign.placement, discountId);
  return true;
}

export async function syncUpsellCampaignDiscount({
  admin,
  campaign,
  shop,
}: {
  admin: AdminClient;
  campaign: CampaignDraft;
  shop: string;
}) {
  const existingDiscountId = await getCampaignDiscountId(
    shop,
    campaign.placement,
  );
  const enabled =
    campaign.enabled &&
    campaign.discount.type !== "NONE" &&
    campaign.discount.value > 0;

  if (!enabled) {
    if (existingDiscountId) await deleteDiscount(admin, existingDiscountId);
    if (existingDiscountId) {
      await setCampaignDiscountId(shop, campaign.placement, null);
    }
    return;
  }

  if (existingDiscountId) {
    await updateDiscount(admin, existingDiscountId, campaign);
    return;
  }

  if (await adoptExistingDiscount(admin, campaign, shop)) return;

  const data = await graphql<{
    discountAutomaticAppCreate: {
      automaticAppDiscount: { discountId: string } | null;
      userErrors: UserError[];
    };
  }>(
    admin,
    `
      #graphql
      mutation CreateFlexUpsellDiscount(
        $automaticAppDiscount: DiscountAutomaticAppInput!
      ) {
        discountAutomaticAppCreate(
          automaticAppDiscount: $automaticAppDiscount
        ) {
          automaticAppDiscount {
            discountId
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      automaticAppDiscount: {
        combinesWith: {
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: false,
        },
        discountClasses: ["PRODUCT"],
        functionHandle: FUNCTION_HANDLE,
        metafields: [discountMetafield(campaign)],
        startsAt: new Date().toISOString(),
        title: discountTitle(campaign),
      },
    },
  );
  const errors = data.discountAutomaticAppCreate.userErrors;
  if (errors.length) {
    if (
      isDuplicateDiscountTitleError(errors) &&
      (await adoptExistingDiscount(admin, campaign, shop))
    ) {
      return;
    }
    throw new Error(userErrorMessage(errors));
  }
  const discountId =
    data.discountAutomaticAppCreate.automaticAppDiscount?.discountId;
  if (!discountId) {
    throw new Error("Shopify did not return the automatic discount ID.");
  }
  await setCampaignDiscountId(shop, campaign.placement, discountId);
}
