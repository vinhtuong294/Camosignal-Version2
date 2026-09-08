import {
  isExcludedFromUpsell,
  withCustomizationMarker,
} from "../lib/product-eligibility.ts";
import type { ProductCandidate } from "../lib/recommendation-types";
import type { ProductSnapshotInput } from "./campaign.server";
import { reconcileProductSnapshots } from "./campaign.server";

export type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<{ json: () => Promise<unknown> }>;
};

type VariantNode = {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
};

type VariantConnection = {
  nodes: VariantNode[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  customizationEnabled: { value: string } | null;
  publishedAt: string | null;
  status: string;
  requiresSellingPlan: boolean;
  totalInventory: number | null;
  featuredImage: { url: string } | null;
  priceRangeV2: {
    minVariantPrice: { amount: string };
    maxVariantPrice: { amount: string };
  };
  collections: { nodes: Array<{ handle: string }> };
  variants: VariantConnection;
};

type CataloguePageResponse = {
  data?: {
    shop: { currencyCode: string };
    products: {
      nodes: ProductNode[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
  errors?: Array<{ message: string }>;
};

type ProductResponse = {
  data?: {
    shop: { currencyCode: string };
    product: ProductNode | null;
  };
  errors?: Array<{ message: string }>;
};

type VariantPageResponse = {
  data?: {
    product: { variants: VariantConnection } | null;
  };
  errors?: Array<{ message: string }>;
};

const productFields = `
  id
  handle
  title
  vendor
  productType
  tags
  customizationEnabled: metafield(
    namespace: "custom"
    key: "enable_name_custom"
  ) {
    value
  }
  publishedAt
  status
  requiresSellingPlan
  totalInventory
  featuredImage {
    url
  }
  priceRangeV2 {
    minVariantPrice {
      amount
    }
    maxVariantPrice {
      amount
    }
  }
  collections(first: 20) {
    nodes {
      handle
    }
  }
  variants(first: 20) {
    nodes {
      id
      title
      price
      compareAtPrice
      availableForSale
      selectedOptions {
        name
        value
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
`;

const variantFields = `
  id
  title
  price
  compareAtPrice
  availableForSale
  selectedOptions {
    name
    value
  }
`;

function responseError(
  errors: Array<{ message: string }> | undefined,
  fallback: string,
) {
  return errors?.map((error) => error.message).join("; ") || fallback;
}

async function loadRemainingVariants(
  admin: AdminGraphqlClient,
  productId: string,
  firstPage: VariantConnection,
) {
  const variants = [...firstPage.nodes];
  let cursor = firstPage.pageInfo.hasNextPage
    ? firstPage.pageInfo.endCursor
    : null;

  while (cursor) {
    const response = await admin.graphql(
      `#graphql
        query FlexUpsellProductVariants($id: ID!, $after: String!) {
          product(id: $id) {
            variants(first: 100, after: $after) {
              nodes {${variantFields}}
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }`,
      { variables: { id: productId, after: cursor } },
    );
    const result = (await response.json()) as VariantPageResponse;
    if (result.errors?.length || !result.data?.product) {
      throw new Error(
        responseError(result.errors, "Shopify returned no variant data."),
      );
    }

    variants.push(...result.data.product.variants.nodes);
    cursor = result.data.product.variants.pageInfo.hasNextPage
      ? result.data.product.variants.pageInfo.endCursor
      : null;
  }

  return variants;
}

function productSnapshot(
  product: ProductNode,
  variants: VariantNode[],
): ProductSnapshotInput {
  const mappedVariants: ProductCandidate["variants"] = variants.map(
    (variant) => ({
      id: variant.id,
      title: variant.title,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice
        ? Number(variant.compareAtPrice)
        : undefined,
      available: variant.availableForSale && !product.requiresSellingPlan,
      selectedOptions: variant.selectedOptions,
    }),
  );

  return {
    productId: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor || "Unknown",
    productType: product.productType || "Other",
    tags: withCustomizationMarker(
      product.tags,
      product.customizationEnabled,
    ),
    collections: product.collections.nodes.map((collection) => collection.handle),
    imageUrl: product.featuredImage?.url,
    priceMin: Number(product.priceRangeV2.minVariantPrice.amount),
    priceMax: Number(product.priceRangeV2.maxVariantPrice.amount),
    inventoryAvailable: mappedVariants.some((variant) => variant.available),
    publishedAt: product.publishedAt ?? undefined,
    variants: mappedVariants,
  };
}

export async function getProductSnapshotForSync({
  admin,
  productId,
}: {
  admin: AdminGraphqlClient;
  productId: string;
}) {
  const response = await admin.graphql(
    `#graphql
      query FlexUpsellSingleProduct($id: ID!) {
        shop {
          currencyCode
        }
        product(id: $id) {${productFields}}
      }`,
    { variables: { id: productId } },
  );
  const result = (await response.json()) as ProductResponse;
  if (result.errors?.length || !result.data) {
    throw new Error(
      responseError(result.errors, "Shopify returned no product data."),
    );
  }

  const product = result.data.product;
  if (
    !product ||
    product.status !== "ACTIVE" ||
    !product.publishedAt ||
    product.requiresSellingPlan ||
    isExcludedFromUpsell(product)
  ) {
    return {
      currency: result.data.shop.currencyCode,
      snapshot: null,
    };
  }

  const variants = await loadRemainingVariants(admin, product.id, product.variants);
  const snapshot = productSnapshot(product, variants);
  return {
    currency: result.data.shop.currencyCode,
    snapshot: snapshot.inventoryAvailable ? snapshot : null,
  };
}

export async function syncProductCatalogue({
  admin,
  shop,
}: {
  admin: AdminGraphqlClient;
  shop: string;
}) {
  const snapshots: ProductSnapshotInput[] = [];
  let cursor: string | null = null;
  let currency = "USD";

  do {
    const response = await admin.graphql(
      `#graphql
        query FlexUpsellCatalogue($after: String) {
          shop {
            currencyCode
          }
          products(
            first: 50
            after: $after
            query: "status:active AND published_status:published"
          ) {
            nodes {${productFields}}
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`,
      { variables: { after: cursor } },
    );
    const result = (await response.json()) as CataloguePageResponse;
    if (result.errors?.length || !result.data) {
      throw new Error(
        responseError(result.errors, "Shopify returned no catalogue data."),
      );
    }

    currency = result.data.shop.currencyCode || currency;
    for (const product of result.data.products.nodes) {
      if (isExcludedFromUpsell(product)) continue;
      const variants = await loadRemainingVariants(
        admin,
        product.id,
        product.variants,
      );
      const snapshot = productSnapshot(product, variants);
      if (snapshot.inventoryAvailable) snapshots.push(snapshot);
    }

    cursor = result.data.products.pageInfo.hasNextPage
      ? result.data.products.pageInfo.endCursor
      : null;
  } while (cursor);

  await reconcileProductSnapshots(shop, currency, snapshots);
  return snapshots.length;
}
