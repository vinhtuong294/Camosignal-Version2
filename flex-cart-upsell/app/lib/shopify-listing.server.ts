import { randomUUID } from "node:crypto";
import prisma from "../db.server";
import { imageCountsByColor, loadListingImages, unmatchedImageNames } from "./listing-images.server";
import { getLarkListingRow, larkFieldNames, updateLarkListingRecord } from "./lark.server";
import type {
  ListingPreview,
  ListingResult,
  LarkListingRow,
  ShopifyCollectionCandidate,
  ShopifyTemplateCandidate,
} from "./listing-types";
import {
  collectionKeywords,
  dedupeLabels,
  designNameFromProductTitle,
  designTagForProductTitle,
  effectiveColors,
  isColorlessProductType,
  normalizeText,
  orderListingImages,
  randomSoldCountBase,
  scoreTemplate,
} from "./listing-utils";

export type ShopifyAdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

type UserError = { field?: string[]; message: string };
type ProductOption = {
  id?: string;
  name: string;
  position: number;
  linkedMetafield?: { namespace: string; key: string } | null;
  optionValues: Array<{ name: string; linkedMetafieldValue?: string | null }>;
};
type ProductVariant = {
  id: string;
  price: string;
  compareAtPrice: string | null;
  selectedOptions: Array<{ name: string; value: string }>;
  inventoryItem: { id: string };
};
type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  featuredImage: { url: string } | null;
  options: ProductOption[];
  variants: { nodes: ProductVariant[] };
};

function getErrors(errors: UserError[]) {
  return errors.map((error) => error.message).join("; ");
}

async function graphql<T>(admin: ShopifyAdminClient, query: string, variables: Record<string, unknown> = {}) {
  const response = await admin.graphql(query, { variables });
  const body = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (body.errors?.length) throw new Error(body.errors.map((error) => error.message).join("; "));
  if (!body.data) throw new Error("Shopify returned no data.");
  return body.data;
}

function productSearch(productType: string) {
  const normalized = normalizeText(productType);
  const searchableType = normalized.includes("upf hoodie") ? "UPF Hoodie" : productType;
  return searchableType ? `product_type:'${searchableType.replace(/'/g, "\\'")}'` : "";
}


type ExistingDesignProduct = { id: string; title: string; tags: string[] };

function isDesignTag(tag: string) {
  return tag.trim().toLowerCase().startsWith("design:");
}

function shopifySearchLiteral(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function searchDesignProducts(admin: ShopifyAdminClient, query: string) {
  const products: ExistingDesignProduct[] = [];
  let after: string | null = null;
  do {
    const data: {
      products: {
        nodes: ExistingDesignProduct[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await graphql(
      admin,
      `#graphql
        query SearchDesignProducts($query: String!, $after: String) {
          products(first: 100, after: $after, query: $query, sortKey: TITLE) {
            nodes { id title tags }
            pageInfo { hasNextPage endCursor }
          }
        }`,
      { query, after },
    );
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function designTitleSearchQuery(designName: string) {
  const terms = normalizeText(designName).split(" ").filter(Boolean);
  if (!terms.length) throw new Error("The product title does not contain searchable design words.");
  return terms.map((term) => `title:${shopifySearchLiteral(term)}*`).join(" AND ");
}

async function findProductsForDesign(admin: ShopifyAdminClient, productTitle: string) {
  const designName = designNameFromProductTitle(productTitle);
  const products = await searchDesignProducts(admin, designTitleSearchQuery(designName));
  const target = normalizeText(designName);
  return products.filter((product) => normalizeText(designNameFromProductTitle(product.title)) === target);
}

async function designTagConflicts(admin: ShopifyAdminClient, tag: string, designName: string) {
  const products = await searchDesignProducts(admin, `tag:'${shopifySearchLiteral(tag)}'`);
  const target = normalizeText(designName);
  return products.some((product) => normalizeText(designNameFromProductTitle(product.title)) !== target);
}

async function resolveDesignTag(admin: ShopifyAdminClient, row: LarkListingRow, allowedExistingProductId?: string) {
  if (!row.title) throw new Error("Product name is required before resolving its design tag.");
  const designName = designNameFromProductTitle(row.title);
  const baseTag = designTagForProductTitle(row.title);
  if (!designName || !baseTag) throw new Error("Product name must include a design name before the garment type.");

  const products = await findProductsForDesign(admin, row.title);
  const exactProduct = products.find((product) => normalizeText(product.title) === normalizeText(row.title));
  if (exactProduct && exactProduct.id !== allowedExistingProductId) throw new Error(`A Shopify product named "${exactProduct.title}" already exists.`);

  const siblingProducts = products.filter((product) => product.id !== allowedExistingProductId);
  if (!siblingProducts.length) return { designName, tag: null, products: [] };

  const existingTags = dedupeLabels(siblingProducts.flatMap((product) => product.tags.filter(isDesignTag)));
  const normalizedBaseTag = normalizeText(baseTag);
  const matchingExistingTags = existingTags.filter((value) => {
    const normalized = normalizeText(value);
    return normalized === normalizedBaseTag || normalized.startsWith(`${normalizedBaseTag} `);
  });
  let tag = baseTag;
  for (const candidate of matchingExistingTags) {
    if (!(await designTagConflicts(admin, candidate, designName))) {
      tag = candidate;
      break;
    }
  }
  if (await designTagConflicts(admin, tag, designName)) {
    const idSuffix = designTagForProductTitle(row.designId)?.slice("design:".length) || "2";
    tag = `${baseTag}-${idSuffix}`;
    for (let suffix = 2; suffix < 100 && await designTagConflicts(admin, tag, designName); suffix += 1) {
      tag = `${baseTag}-${idSuffix}-${suffix}`;
    }
    if (await designTagConflicts(admin, tag, designName)) throw new Error("Could not allocate a unique Shopify design tag.");
  }
  return { designName, tag, products: siblingProducts };
}
async function syncDesignTag(admin: ShopifyAdminClient, products: ExistingDesignProduct[], designTag: string) {
  for (const product of products) {
    const currentDesignTags = product.tags.filter(isDesignTag);
    if (!currentDesignTags.includes(designTag)) {
      const added = await graphql<{ tagsAdd: { userErrors: UserError[] } }>(
        admin,
        `#graphql
          mutation AddDesignTag($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
          }`,
        { id: product.id, tags: [designTag] },
      );
      if (added.tagsAdd.userErrors.length) throw new Error(getErrors(added.tagsAdd.userErrors));
    }

    const unwantedTags = currentDesignTags.filter((tag) => tag !== designTag);
    if (unwantedTags.length) {
      const removed = await graphql<{ tagsRemove: { userErrors: UserError[] } }>(
        admin,
        `#graphql
          mutation RemoveConflictingDesignTags($id: ID!, $tags: [String!]!) {
            tagsRemove(id: $id, tags: $tags) { userErrors { field message } }
          }`,
        { id: product.id, tags: unwantedTags },
      );
      if (removed.tagsRemove.userErrors.length) throw new Error(getErrors(removed.tagsRemove.userErrors));
    }
  }
}
async function findTemplateProducts(admin: ShopifyAdminClient, row: LarkListingRow) {
  const data = await graphql<{ products: { nodes: ShopifyProduct[] } }>(
    admin,
    `#graphql
      query ListingTemplates($query: String!) {
        products(first: 100, query: $query, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id title handle descriptionHtml productType tags
            featuredImage { url }
            options { id name position linkedMetafield { namespace key } optionValues { name linkedMetafieldValue } }
            variants(first: 250) {
              nodes { id price compareAtPrice selectedOptions { name value } inventoryItem { id } }
            }
          }
        }
      }`,
    { query: productSearch(row.productType) },
  );
  return data.products.nodes
    .map((product) => {
      const scored = scoreTemplate(row, {
        title: product.title,
        productType: product.productType,
        optionNames: product.options.map((option) => option.name),
        variantCount: product.variants.nodes.length,
      });
      const candidate: ShopifyTemplateCandidate = {
        id: product.id,
        title: product.title,
        handle: product.handle,
        productType: product.productType,
        featuredImageUrl: product.featuredImage?.url ?? null,
        score: scored.score,
        reasons: scored.reasons,
        optionNames: product.options.map((option) => option.name),
        variantCount: product.variants.nodes.length,
      };
      return candidate;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);
}

async function getProduct(admin: ShopifyAdminClient, productId: string) {
  const data = await graphql<{ product: ShopifyProduct | null }>(
    admin,
    `#graphql
      query ListingTemplate($id: ID!) {
        product(id: $id) {
          id title handle descriptionHtml productType tags
          featuredImage { url }
          options { id name position linkedMetafield { namespace key } optionValues { name linkedMetafieldValue } }
          variants(first: 250) {
            nodes { id price compareAtPrice selectedOptions { name value } inventoryItem { id } }
          }
        }
      }`,
    { id: productId },
  );
  if (!data.product) throw new Error("The chosen Shopify template no longer exists.");
  return data.product;
}

async function ensureLinkedOptionValues(admin: ShopifyAdminClient, product: ShopifyProduct, row: LarkListingRow, template: ShopifyProduct) {
  const colorOption = product.options.find((option) => normalizeText(option.name) === "color");
  const templateColorOption = template.options.find((option) => normalizeText(option.name) === "color");
  if (!colorOption?.id || !colorOption.linkedMetafield || !templateColorOption) return;
  let configuredColorValues: Record<string, string> = {};
  try { configuredColorValues = JSON.parse(process.env.SHOPIFY_COLOR_METAOBJECT_MAP ?? "{}"); } catch { configuredColorValues = {}; }
  const sourceIds = new Map((templateColorOption.optionValues ?? []).map((value) => [normalizeText(value.name), value.linkedMetafieldValue ?? null]));
  const existingIds = new Set((colorOption.optionValues ?? []).map((value) => value.linkedMetafieldValue).filter((value): value is string => Boolean(value)));
  const values = effectiveColors(row)
    .map((color) => sourceIds.get(normalizeText(color)) ?? configuredColorValues[normalizeText(color)] ?? null)
    .filter((value): value is string => Boolean(value) && !existingIds.has(value))
    .map((linkedMetafieldValue) => ({ linkedMetafieldValue }));
  if (!values.length) return;
  const data = await graphql<{ productOptionUpdate: { userErrors: UserError[] } }>(
    admin,
    `#graphql
      mutation AddLinkedListingOptionValues($productId: ID!, $optionId: ID!, $values: [OptionValueCreateInput!]!) {
        productOptionUpdate(productId: $productId, option: { id: $optionId }, optionValuesToAdd: $values, variantStrategy: LEAVE_AS_IS) {
          userErrors { field message }
        }
      }`,
    { productId: product.id, optionId: colorOption.id, values },
  );
  if (data.productOptionUpdate.userErrors.length) throw new Error(getErrors(data.productOptionUpdate.userErrors));
}
async function suggestCollection(admin: ShopifyAdminClient, row: LarkListingRow) {
  const data = await graphql<{
    collections: { nodes: Array<{ id: string; title: string; handle: string }> };
  }>(
    admin,
    `#graphql
      query ListingCollections {
        collections(first: 250, sortKey: TITLE) { nodes { id title handle } }
      }`,
  );
  const keywords = collectionKeywords(row);
  const source = normalizeText([row.title, row.productType, row.weeklyDesignPlan, ...row.collectionNames].filter(Boolean).join(" "));
  const candidates = data.collections.nodes
    .map((collection) => {
      const normalized = normalizeText(`${collection.title} ${collection.handle}`);
      let score = 0;
      for (const collectionName of row.collectionNames) {
        const preferred = normalizeText(collectionName);
        if (preferred && (normalized === preferred || normalized.includes(preferred) || preferred.includes(normalized))) score += 1_000;
      }
      for (const keyword of keywords) if (normalized.includes(normalizeText(keyword))) score += 50;
      if (source.includes(normalized) || normalized.includes(source)) score += 25;
      return { ...collection, score };
    })
    .filter((collection) => collection.score > 0)
    .sort((left, right) => right.score - left.score || Number(normalizeText(left.title).includes(" new")) - Number(normalizeText(right.title).includes(" new")) || right.title.length - left.title.length);
  return (candidates[0] ?? null) as ShopifyCollectionCandidate | null;
}

function valueKey(values: Array<{ name: string; value: string }>) {
  return values
    .map((value) => `${normalizeText(value.name)}=${normalizeText(value.value)}`)
    .sort()
    .join("|");
}

function variantPlan(row: LarkListingRow, template: ShopifyProduct) {
  const colorOption = template.options.find((option) => normalizeText(option.name) === "color");
  const colorless = isColorlessProductType(row.productType);
  const maskBundle = normalizeText(row.productType).includes("face mask");
  if (!colorless && !colorOption) {
    throw new Error("The selected template has no Color option. Choose a matching product template.");
  }
  if (colorless && colorOption) {
    throw new Error("UPF Hoodie must use a template with no Color option.");
  }
  const colors = effectiveColors(row);
  const sourceVariants = template.variants.nodes.filter((source) => {
    if (maskBundle) return true;
    const setOption = source.selectedOptions.find((option) => normalizeText(option.name) === "choose your set");
    return !setOption || normalizeText(setOption.value) === "hoodie only";
  });
  if (!sourceVariants.length) throw new Error("The selected template has no variants.");
  const bases = new Map<string, ProductVariant>();
  for (const source of sourceVariants) {
    const nonColor = source.selectedOptions.filter((option) => normalizeText(option.name) !== "color" && (maskBundle || normalizeText(option.name) !== "choose your set"));
    bases.set(valueKey(nonColor), source);
  }
  const linkedColorValues = new Map((colorOption?.optionValues ?? []).map((value) => [normalizeText(value.name), value.linkedMetafieldValue ?? null]));
  let configuredColorValues: Record<string, string> = {};
  try { configuredColorValues = JSON.parse(process.env.SHOPIFY_COLOR_METAOBJECT_MAP ?? "{}"); } catch { configuredColorValues = {}; }
  const linkedColorId = (name: string) => linkedColorValues.get(normalizeText(name)) ?? configuredColorValues[normalizeText(name)] ?? null;
  const linkedSizeValues = new Map(
    template.options.find((option) => normalizeText(option.name) === "size")?.optionValues.map((value) => [normalizeText(value.name), value.linkedMetafieldValue ?? null]) ?? [],
  );
  // Brown Savana is only offered through 3XL. Other colors keep the complete
  // size run from the selected template. This is a color-specific restriction,
  // so mixed-color products retain larger sizes for their other colors.
  const brownSavanaMaxRank = 5;
  const sizeRank = (value: string) => {
    const normalized = normalizeText(value);
    return new Map([
      ["s", 0], ["m", 1], ["l", 2], ["xl", 3], ["2xl", 4], ["3xl", 5],
      ["4xl", 6], ["5xl", 7], ["6xl", 8],
    ]).get(normalized) ?? Number.POSITIVE_INFINITY;
  };
  const optionValue = (optionName: string, value: string) => {
    const linked = normalizeText(optionName) === "color" ? linkedColorId(value) : linkedSizeValues.get(normalizeText(value));
    return linked ? { optionName, linkedMetafieldValue: linked } : { optionName, name: value };
  };
  const twoSidePremium = row.printTwoSides ? 3 : 0;
  const variants = (colorless ? [null] : colors).flatMap((color) =>
    [...bases.values()].filter((source) => {
      if (!color || normalizeText(color) !== "brown savana") return true;
      const size = source.selectedOptions.find((option) => normalizeText(option.name) === "size")?.value;
      return size ? sizeRank(size) <= brownSavanaMaxRank : true;
    }).map((source) => {
      const compareAtPrice = source.compareAtPrice ? Number(source.compareAtPrice) + twoSidePremium : null;
      return {
        optionValues: [
          ...source.selectedOptions
            .filter((option) => normalizeText(option.name) !== "color" && (maskBundle || normalizeText(option.name) !== "choose your set"))
            .map((option) => optionValue(option.name, option.value)),
          ...(color && colorOption ? [optionValue(colorOption.name, color)] : []),
        ],
        price: (row.price ?? Number(source.price)) + twoSidePremium,
        ...(compareAtPrice !== null ? { compareAtPrice } : {}),
      };
    }),
  );
  const productOptions = template.options
    .filter((option) => (!colorless || normalizeText(option.name) !== "color") && (maskBundle || normalizeText(option.name) !== "choose your set"))
    .map((option) => ({
      name: option.name,
      position: option.position,      ...(option.linkedMetafield ? {
        linkedMetafield: {
          ...option.linkedMetafield,
          values: (normalizeText(option.name) === "color" ? colors : option.optionValues.map((value) => value.name))
            .map((name) => normalizeText(option.name) === "color" ? linkedColorId(name) : linkedSizeValues.get(normalizeText(name)))
            .filter((value): value is string => Boolean(value)),
        },
      } : {}),
      ...(!option.linkedMetafield ? {
        values: (normalizeText(option.name) === "color" ? colors : option.optionValues.map((value) => value.name)).map((name) => ({ name })),
      } : {}),
    }));
  return { productOptions, variants };
}
async function duplicateProduct(admin: ShopifyAdminClient, templateProductId: string, title: string) {
  const data = await graphql<{
    productDuplicate: { newProduct: { id: string } | null; userErrors: UserError[] };
  }>(
    admin,
    `#graphql
      mutation DuplicateListingProduct($productId: ID!, $newTitle: String!) {
        productDuplicate(productId: $productId, newTitle: $newTitle, newStatus: DRAFT, includeImages: false, synchronous: true) {
          newProduct { id }
          userErrors { field message }
        }
      }`,
    { productId: templateProductId, newTitle: title },
  );
  const result = data.productDuplicate;
  if (result.userErrors.length) throw new Error(getErrors(result.userErrors));
  if (!result.newProduct) throw new Error("Shopify did not return the duplicated product.");
  return result.newProduct.id;
}

async function setListingProduct(
  admin: ShopifyAdminClient,
  productId: string,
  row: LarkListingRow,
  template: ShopifyProduct,
  collectionId: string,
  designTag?: string,
) {
  const plan = variantPlan(row, template);
  const data = await graphql<{
    productSet: { product: ShopifyProduct | null; userErrors: UserError[] };
  }>(
    admin,
    `#graphql
      mutation SetListingProduct($identifier: ProductSetIdentifiers!, $input: ProductSetInput!) {
        productSet(identifier: $identifier, input: $input, synchronous: true) {
          product {
            id title handle productType tags
            featuredImage { url }
            options { id name position linkedMetafield { namespace key } optionValues { name linkedMetafieldValue } }
            variants(first: 250) { nodes { id price compareAtPrice selectedOptions { name value } inventoryItem { id } } }
          }
          userErrors { field message }
        }
      }`,
    {
      identifier: { id: productId },
      input: {
        title: row.title,
        descriptionHtml: normalizeText(row.productType) === "waterproof jacket" ? template.descriptionHtml : "",
        status: "DRAFT",
        productType: normalizeText(row.productType).includes("upf hoodie") ? "UPF Hoodie" : row.productType || template.productType,
        productOptions: plan.productOptions,
        variants: plan.variants,
        collections: [collectionId],
        tags: dedupeLabels([
          ...template.tags,
          ...row.tags,
          ...(normalizeText(row.productType).includes("long sleeve") ? ["longsleevetee"] : []),
          ...(normalizeText(row.productType).includes("hoodie") ? ["hoodie"] : []),
        ].filter((tag) => !isDesignTag(tag)).concat(designTag ? [designTag] : [])),
      },
    },
  );
  if (data.productSet.userErrors.length) throw new Error(getErrors(data.productSet.userErrors));
  if (!data.productSet.product) throw new Error("Shopify did not return the configured draft.");
  return data.productSet.product;
}

async function waitForMediaReady(admin: ShopifyAdminClient, productId: string, mediaIds: string[]) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const data = await graphql<{ product: { media: { nodes: Array<{ id: string; status?: string }> } } | null }>(
      admin,
      `#graphql
        query ListingMediaStatus($id: ID!) {
          product(id: $id) { media(first: 250) { nodes { ... on MediaImage { id status } } } }
        }`,
      { id: productId },
    );
    const statuses = new Map(data.product?.media.nodes.map((media) => [media.id, media.status]) ?? []);
    if (mediaIds.every((id) => statuses.get(id) === "READY")) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Shopify media did not become ready within 15 seconds.");
}
async function uploadImages(admin: ShopifyAdminClient, productId: string, row: LarkListingRow) {
  const images = orderListingImages(await loadListingImages(row), row);
  const staged = await graphql<{
    stagedUploadsCreate: {
      stagedTargets: Array<{ url: string; resourceUrl: string; parameters: Array<{ name: string; value: string }> }>;
      userErrors: UserError[];
    };
  }>(
    admin,
    `#graphql
      mutation StagedListingImages($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }`,
    {
      input: images.map((image) => ({
        resource: "PRODUCT_IMAGE",
        filename: image.name,
        mimeType: image.mimeType,
        httpMethod: "POST",
        fileSize: String(image.bytes.byteLength),
      })),
    },
  );
  if (staged.stagedUploadsCreate.userErrors.length) throw new Error(getErrors(staged.stagedUploadsCreate.userErrors));
  const targets = staged.stagedUploadsCreate.stagedTargets;
  if (targets.length !== images.length) throw new Error("Shopify returned an incomplete staged upload response.");
  await Promise.all(
    targets.map(async (target, index) => {
      const form = new FormData();
      target.parameters.forEach((parameter) => form.append(parameter.name, parameter.value));
      form.append("file", new Blob([images[index].bytes as unknown as BlobPart], { type: images[index].mimeType }), images[index].name);
      const response = await fetch(target.url, { method: "POST", body: form });
      if (!response.ok) throw new Error(`Image upload failed for ${images[index].name}.`);
    }),
  );
  const media = await graphql<{
    productCreateMedia: { media: Array<{ id: string }> | null; mediaUserErrors: UserError[] };
  }>(
    admin,
    `#graphql
      mutation CreateListingMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media { id }
          mediaUserErrors { field message }
        }
      }`,
    {
      productId,
      media: targets.map((target, index) => ({
        originalSource: target.resourceUrl,
        mediaContentType: "IMAGE",
        alt: images[index].name,
      })),
    },
  );
  if (media.productCreateMedia.mediaUserErrors.length) throw new Error(getErrors(media.productCreateMedia.mediaUserErrors));
  const mediaIds = media.productCreateMedia.media?.map((item) => item.id) ?? [];
  if (mediaIds.length !== images.length) throw new Error("Shopify could not create all product media.");
  await reorderListingMedia(admin, productId, mediaIds);
  await waitForMediaReady(admin, productId, mediaIds);
  return { images, mediaIds };
}

async function reorderListingMedia(admin: ShopifyAdminClient, productId: string, mediaIds: string[]) {
  if (mediaIds.length < 2) return;
  const data = await graphql<{
    productReorderMedia: { job: { id: string } | null; mediaUserErrors: UserError[] };
  }>(
    admin,
    `#graphql
      mutation ReorderListingMedia($id: ID!, $moves: [MoveInput!]!) {
        productReorderMedia(id: $id, moves: $moves) {
          job { id }
          mediaUserErrors { field message }
        }
      }`,
    {
      id: productId,
      moves: mediaIds.map((id, index) => ({ id, newPosition: String(index) })),
    },
  );
  if (data.productReorderMedia.mediaUserErrors.length) throw new Error(getErrors(data.productReorderMedia.mediaUserErrors));
  const jobId = data.productReorderMedia.job?.id;
  if (!jobId) throw new Error("Shopify did not return a media reorder job.");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const job = await graphql<{ job: { done: boolean } | null }>(
      admin,
      `#graphql
        query ListingMediaReorderJob($id: ID!) {
          job(id: $id) { done }
        }`,
      { id: jobId },
    );
    if (job.job?.done) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Shopify media reordering did not finish within 5 seconds.");
}
async function setListingMetafields(admin: ShopifyAdminClient, productId: string) {
  const definitions = await graphql<{
    metafieldDefinitions: { nodes: Array<{ namespace: string; key: string; name: string; type: { name: string } }> };
  }>(
    admin,
    `#graphql
      query SoldCountBaseDefinition {
        metafieldDefinitions(ownerType: PRODUCT, first: 250) {
          nodes { namespace key name type { name } }
        }
      }`,
  );
  const definition = definitions.metafieldDefinitions.nodes.find(
    (item) => normalizeText(item.name) === "sold count base",
  );
  if (!definition) throw new Error('Shopify product metafield definition "Sold Count Base" was not found.');

  const data = await graphql<{ metafieldsSet: { userErrors: UserError[] } }>(
    admin,
    `#graphql
      mutation SetSoldCountBase($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }`,
    {
      metafields: [{
        ownerId: productId,
        namespace: definition.namespace,
        key: definition.key,
        type: definition.type.name,
        value: String(randomSoldCountBase()),
      }],
    },
  );
  if (data.metafieldsSet.userErrors.length) throw new Error(getErrors(data.metafieldsSet.userErrors));
}
export async function attachMediaToVariants(
  admin: ShopifyAdminClient,
  product: ShopifyProduct,
  row: LarkListingRow,
  images: Awaited<ReturnType<typeof loadListingImages>>,
  mediaIds: string[],
) {
  const colorless = isColorlessProductType(row.productType);
  // UPF Hoodies are size-only products. Keep the product media gallery intact,
  // but do not attach the gallery image to every size variant.
  if (colorless) return;
  const mappings = product.variants.nodes
    .map((variant) => {
      const color = variant.selectedOptions.find((option) => normalizeText(option.name) === "color")?.value ?? null;
      const ids = mediaIds.filter((_, index) => normalizeText(images[index].color) === normalizeText(color)).slice(0, 1);
      return ids.length ? { variantId: variant.id, mediaIds: ids } : null;
    })
    .filter((mapping): mapping is { variantId: string; mediaIds: string[] } => Boolean(mapping));
  if (!mappings.length) return;
  const data = await graphql<{
    productVariantAppendMedia: { userErrors: UserError[] };
  }>(
    admin,
    `#graphql
      mutation AssignListingMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) {
        productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
          userErrors { field message }
        }
      }`,
    { productId: product.id, variantMedia: mappings },
  );
  if (data.productVariantAppendMedia.userErrors.length) throw new Error(getErrors(data.productVariantAppendMedia.userErrors));
}

async function setInventory(admin: ShopifyAdminClient, product: ShopifyProduct, quantity: number, productId: string) {
  const locationId = process.env.SHOPIFY_INVENTORY_LOCATION_ID?.trim();
  if (!locationId) throw new Error("Set SHOPIFY_INVENTORY_LOCATION_ID before setting listing inventory.");
  const current = await graphql<{
    product: {
      variants: {
        nodes: Array<{
          inventoryItem: {
            id: string;
            inventoryLevels: { nodes: Array<{ location: { id: string }; quantities: Array<{ quantity: number }> }> };
          };
        }>;
      };
    };
  }>(
    admin,
    `#graphql
      query CurrentListingInventory($id: ID!) {
        product(id: $id) {
          variants(first: 250) {
            nodes {
              inventoryItem {
                id
                inventoryLevels(first: 50) {
                  nodes {
                    location { id }
                    quantities(names: ["available"]) { quantity }
                  }
                }
              }
            }
          }
        }
      }`,
    { id: productId },
  );
  const targetQuantity = Math.max(0, Math.trunc(quantity));
  const currentByItem = new Map(
    current.product.variants.nodes.map((variant) => {
      const level = variant.inventoryItem.inventoryLevels.nodes.find((entry) => entry.location.id === locationId);
      return [variant.inventoryItem.id, level?.quantities[0]?.quantity ?? 0] as const;
    }),
  );
  const data = await graphql<{
    inventorySetQuantities: { userErrors: UserError[] };
  }>(
    admin,
    `#graphql
      mutation SetListingInventory($input: InventorySetQuantitiesInput!, $idempotencyKey: String!) {
        inventorySetQuantities(input: $input) @idempotent(key: $idempotencyKey) {
          userErrors { field message }
        }
      }`,
    {
      idempotencyKey: randomUUID(),
      input: {
        name: "available",
        reason: "correction",
        referenceDocumentUri: `camosignal://listing/${productId}/${Date.now()}`,
        quantities: product.variants.nodes.map((variant) => ({
          inventoryItemId: variant.inventoryItem.id,
          locationId,
          quantity: targetQuantity,
          changeFromQuantity: currentByItem.get(variant.inventoryItem.id) ?? 0,
        })),
      },
    },
  );
  if (data.inventorySetQuantities.userErrors.length) throw new Error(getErrors(data.inventorySetQuantities.userErrors));
}
export async function previewListing(admin: ShopifyAdminClient, recordId: string): Promise<ListingPreview> {
  const row = await getLarkListingRow(recordId);
  const warnings = [...row.warnings];
  let images: Awaited<ReturnType<typeof loadListingImages>> = [];
  if (row.attachments.length) {
    images = await loadListingImages(row);
    const unmatched = unmatchedImageNames(images, row);
    if (unmatched.length) warnings.push(`${unmatched.length} image(s) have no recognized color in the filename.`);
  }
  const [templates, suggestedCollection] = await Promise.all([findTemplateProducts(admin, row), suggestCollection(admin, row)]);
  if (!templates.length) warnings.push("No Shopify template found for this product type.");
  if (!suggestedCollection) warnings.push("No confident collection match. Create draft is disabled until the plan identifies one.");
  return {
    row,
    templates,
    selectedTemplateId: templates[0]?.id ?? null,
    suggestedCollection,
    imageCounts: imageCountsByColor(images, row),
    warnings,
  };
}

export async function createDraftListing(input: {
  admin: ShopifyAdminClient;
  shop: string;
  recordId: string;
  templateProductId: string;
  existingProductId?: string;
  collectionId?: string;
}) {
  const row = await getLarkListingRow(input.recordId);
  let createdProductId: string | null = null;
  try {
    if (row.status !== "READY") throw new Error(`Record is ${row.status} and cannot be listed.`);
    if (!row.title) throw new Error("Product name is required.");
    const design = await resolveDesignTag(input.admin, row, input.existingProductId);
    const [template, suggestedCollection] = await Promise.all([
      getProduct(input.admin, input.templateProductId),
      input.collectionId ? Promise.resolve(null) : suggestCollection(input.admin, row),
    ]);
    const collection = input.collectionId
      ? { id: input.collectionId, title: "Selected collection", handle: "" }
      : suggestedCollection;
    if (!collection) throw new Error("No collection could be inferred from the Weekly Design Plan or product name.");
    createdProductId = input.existingProductId ?? await duplicateProduct(input.admin, template.id, row.title);
    const draftBeforeSet = await getProduct(input.admin, createdProductId);
    await ensureLinkedOptionValues(input.admin, draftBeforeSet, row, template);
    const product = await setListingProduct(input.admin, createdProductId, row, template, collection.id, design.tag ?? undefined);
    if (design.tag) {
      await syncDesignTag(input.admin, design.products, design.tag);
    }
    await setListingMetafields(input.admin, product.id);
    const uploaded = await uploadImages(input.admin, product.id, row);
    await attachMediaToVariants(input.admin, product, row, uploaded.images, uploaded.mediaIds);
    // Every generated variant gets a default stock of 100 when Lark leaves the Inventory field blank. An explicit Lark value still takes precedence.
    await setInventory(input.admin, product, row.inventory ?? 100, product.id);
    const numericId = product.id.split("/").pop();
    const adminUrl = `https://${input.shop}/admin/products/${numericId}`;
    try {
      await updateLarkListingRecord(row.recordId, { [larkFieldNames().shopifyUrl]: adminUrl });
    } catch {
      // The draft is valid even if an optional Lark URL column update fails.
    }
    const result: ListingResult = {
      productId: product.id,
      adminUrl,
      title: product.title,
      templateProductId: template.id,
      collectionId: collection.id,
      imagesUploaded: uploaded.images.length,
      designTag: design.tag ?? "",
    };
    try { await prisma.listingRun.create({
      data: {
        shop: input.shop,
        larkRecordId: row.recordId,
        designId: row.designId,
        templateProductId: template.id,
        createdProductId: product.id,
        status: "DRAFT_CREATED",
        detailsJson: JSON.stringify(result),
      },
    }); } catch (auditError) { console.error("Could not persist listing audit record", auditError); }
    return result;
  } catch (error) {
    try { await prisma.listingRun.create({
      data: {
        shop: input.shop,
        larkRecordId: row.recordId,
        designId: row.designId,
        templateProductId: input.templateProductId,
        createdProductId,
        status: "ERROR",
        detailsJson: JSON.stringify({ recordId: row.recordId }),
        error: error instanceof Error ? error.message : "Unknown listing error",
      },
    }); } catch (auditError) { console.error("Could not persist listing audit record", auditError); }
    throw error;
  }
}
