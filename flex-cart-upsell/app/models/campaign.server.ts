import prisma from "../db.server";
import { createDefaultCampaign } from "../lib/campaign-defaults";
import type {
  CampaignDraft,
  Placement,
  ProductCandidate,
} from "../lib/recommendation-types";

type StoredCampaign = {
  name: string;
  placement: string;
  enabled: boolean;
  strategy: string;
  strategyJson: string;
  conditionsJson: string;
  filtersJson: string;
  appearanceJson: string;
  discountJson: string;
};

const catalogueCache = new Map<
  string,
  { expiresAt: number; products: ProductCandidate[] }
>();
const catalogueCacheTtlMs = 5 * 60_000;

function invalidateCatalogueCache(shop: string) {
  catalogueCache.delete(shop);
}

export interface ProductSnapshotInput {
  productId: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  collections: string[];
  imageUrl?: string;
  priceMin: number;
  priceMax: number;
  inventoryAvailable: boolean;
  publishedAt?: string;
  variants: ProductCandidate["variants"];
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toDraft(record: StoredCampaign): CampaignDraft {
  const placement =
    record.placement === "PRODUCT_PAGE"
      ? "PRODUCT_PAGE"
      : record.placement === "CART_PAGE"
        ? "CART_PAGE"
        : "CART_DRAWER";
  const fallback = createDefaultCampaign(placement);
  const storedAppearance = parseJson<Partial<CampaignDraft["appearance"]>>(
    record.appearanceJson,
    {},
  );
  const appearance = storedAppearance.stylePreset
    ? { ...fallback.appearance, ...storedAppearance }
    : fallback.appearance;
  const storedDiscount = parseJson<Partial<CampaignDraft["discount"]>>(
    record.discountJson,
    {},
  );

  return {
    ...fallback,
    name: record.name,
    enabled: record.enabled,
    strategy: record.strategy as CampaignDraft["strategy"],
    strategyConfig: parseJson(record.strategyJson, fallback.strategyConfig),
    conditions: parseJson(record.conditionsJson, fallback.conditions),
    filters: parseJson(record.filtersJson, fallback.filters),
    appearance,
    discount: { ...fallback.discount, ...storedDiscount },
  };
}

function serializedCampaign(shop: string, draft: CampaignDraft) {
  return {
    shop,
    placement: draft.placement,
    name: draft.name,
    enabled: draft.enabled,
    strategy: draft.strategy,
    strategyJson: JSON.stringify(draft.strategyConfig),
    conditionsJson: JSON.stringify(draft.conditions),
    filtersJson: JSON.stringify(draft.filters),
    appearanceJson: JSON.stringify(draft.appearance),
    discountJson: JSON.stringify(draft.discount),
  };
}

export async function getCampaign(shop: string, placement: Placement) {
  const existing = await prisma.campaign.findUnique({
    where: { shop_placement: { shop, placement } },
  });

  if (existing) return toDraft(existing);

  const draft = createDefaultCampaign(placement);
  const created = await prisma.campaign.create({
    data: serializedCampaign(shop, draft),
  });
  return toDraft(created);
}

export async function saveCampaign(shop: string, draft: CampaignDraft) {
  const saved = await prisma.campaign.upsert({
    where: {
      shop_placement: { shop, placement: draft.placement },
    },
    create: serializedCampaign(shop, draft),
    update: serializedCampaign(shop, draft),
  });
  return toDraft(saved);
}

export async function getCatalogueStatus(shop: string) {
  const [count, settings] = await Promise.all([
    prisma.productSnapshot.count({ where: { shop } }),
    prisma.shopSetting.findUnique({ where: { shop } }),
  ]);

  return {
    count,
    syncedAt: settings?.catalogueSyncedAt?.toISOString() ?? null,
  };
}

export async function replaceProductSnapshots(
  shop: string,
  currency: string,
  products: ProductSnapshotInput[],
) {
  const upserts = products.map((product) =>
    prisma.productSnapshot.upsert({
      where: {
        shop_productId: { shop, productId: product.productId },
      },
      create: {
        shop,
        productId: product.productId,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        tagsJson: JSON.stringify(product.tags),
        collectionsJson: JSON.stringify(product.collections),
        imageUrl: product.imageUrl ?? null,
        variantsJson: JSON.stringify(product.variants),
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        inventoryAvailable: product.inventoryAvailable,
        publishedAt: product.publishedAt
          ? new Date(product.publishedAt)
          : null,
      },
      update: {
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        tagsJson: JSON.stringify(product.tags),
        collectionsJson: JSON.stringify(product.collections),
        imageUrl: product.imageUrl ?? null,
        variantsJson: JSON.stringify(product.variants),
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        inventoryAvailable: product.inventoryAvailable,
        publishedAt: product.publishedAt
          ? new Date(product.publishedAt)
          : null,
      },
    }),
  );

  await prisma.$transaction([
    ...upserts,
    prisma.shopSetting.upsert({
      where: { shop },
      create: { shop, currency, catalogueSyncedAt: new Date() },
      update: { currency, catalogueSyncedAt: new Date() },
    }),
  ]);
  invalidateCatalogueCache(shop);
}

export async function reconcileProductSnapshots(
  shop: string,
  currency: string,
  products: ProductSnapshotInput[],
) {
  const productIds = products.map((product) => product.productId);
  const upserts = products.map((product) =>
    prisma.productSnapshot.upsert({
      where: {
        shop_productId: { shop, productId: product.productId },
      },
      create: {
        shop,
        productId: product.productId,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        tagsJson: JSON.stringify(product.tags),
        collectionsJson: JSON.stringify(product.collections),
        imageUrl: product.imageUrl ?? null,
        variantsJson: JSON.stringify(product.variants),
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        inventoryAvailable: product.inventoryAvailable,
        publishedAt: product.publishedAt
          ? new Date(product.publishedAt)
          : null,
      },
      update: {
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        tagsJson: JSON.stringify(product.tags),
        collectionsJson: JSON.stringify(product.collections),
        imageUrl: product.imageUrl ?? null,
        variantsJson: JSON.stringify(product.variants),
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        inventoryAvailable: product.inventoryAvailable,
        publishedAt: product.publishedAt
          ? new Date(product.publishedAt)
          : null,
      },
    }),
  );

  const staleSnapshots = prisma.productSnapshot.deleteMany({
    where: productIds.length
      ? { shop, productId: { notIn: productIds } }
      : { shop },
  });

  await prisma.$transaction([
    ...upserts,
    staleSnapshots,
    prisma.shopSetting.upsert({
      where: { shop },
      create: { shop, currency, catalogueSyncedAt: new Date() },
      update: { currency, catalogueSyncedAt: new Date() },
    }),
  ]);
  invalidateCatalogueCache(shop);
}
export async function removeProductSnapshot(shop: string, productId: string) {
  await prisma.$transaction([
    prisma.productSnapshot.deleteMany({
      where: { shop, productId },
    }),
    prisma.shopSetting.upsert({
      where: { shop },
      create: { shop, catalogueSyncedAt: new Date() },
      update: { catalogueSyncedAt: new Date() },
    }),
  ]);
  invalidateCatalogueCache(shop);
}

export async function getProductCatalogue(shop: string) {
  const cached = catalogueCache.get(shop);
  if (cached && cached.expiresAt > Date.now()) return cached.products;

  const snapshots = await prisma.productSnapshot.findMany({
    where: { shop },
    orderBy: [{ popularityScore: "desc" }, { title: "asc" }],
    select: {
      productId: true,
      handle: true,
      title: true,
      vendor: true,
      productType: true,
      tagsJson: true,
      collectionsJson: true,
      imageUrl: true,
      priceMin: true,
      priceMax: true,
      inventoryAvailable: true,
      publishedAt: true,
      popularityScore: true,
    },
  });

  const products = snapshots.map<ProductCandidate>((snapshot) => ({
    productId: snapshot.productId,
    handle: snapshot.handle,
    title: snapshot.title,
    vendor: snapshot.vendor,
    productType: snapshot.productType,
    tags: parseJson(snapshot.tagsJson, []),
    collections: parseJson(snapshot.collectionsJson, []),
    imageUrl: snapshot.imageUrl ?? undefined,
    priceMin: snapshot.priceMin,
    priceMax: snapshot.priceMax,
    inventoryAvailable: snapshot.inventoryAvailable,
    publishedAt: snapshot.publishedAt?.toISOString(),
    popularityScore: snapshot.popularityScore,
    variants: [],
  }));
  catalogueCache.set(shop, {
    expiresAt: Date.now() + catalogueCacheTtlMs,
    products,
  });
  return products;
}

export async function getProductVariants(
  shop: string,
  productIds: string[],
) {
  const uniqueProductIds = [...new Set(productIds)];
  if (uniqueProductIds.length === 0) {
    return new Map<string, ProductCandidate["variants"]>();
  }

  const snapshots = await prisma.productSnapshot.findMany({
    where: {
      shop,
      productId: { in: uniqueProductIds },
    },
    select: {
      productId: true,
      variantsJson: true,
    },
  });

  return new Map(
    snapshots.map((snapshot) => [
      snapshot.productId,
      parseJson<ProductCandidate["variants"]>(snapshot.variantsJson, []),
    ]),
  );
}

export async function getCampaignDiscountId(shop: string, placement: Placement) {
  const campaign = await prisma.campaign.findUnique({
    where: { shop_placement: { shop, placement } },
    select: { discountId: true },
  });

  return campaign?.discountId ?? null;
}

export async function setCampaignDiscountId(
  shop: string,
  placement: Placement,
  discountId: string | null,
) {
  await prisma.campaign.update({
    where: { shop_placement: { shop, placement } },
    data: { discountId },
  });
}
