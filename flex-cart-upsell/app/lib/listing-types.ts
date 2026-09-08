export type ListingStatus =
  | "READY"
  | "NEEDS_TITLE"
  | "NEEDS_ASSETS"
  | "NEEDS_REVIEW"
  | "DRAFT_CREATED"
  | "ERROR";

export interface ListingMetafieldInput {
  namespace: string;
  key: string;
  type: string;
  value: string;
}

export interface LarkAttachment {
  fileToken: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface LarkListingRow {
  recordId: string;
  designId: string;
  title: string | null;
  titleSource: "upload" | "weekly-plan" | "missing";
  productType: string;
  mainColor: string | null;
  colors: string[];
  collectionNames: string[];
  weeklyDesignPlan: string | null;
  weeklyPlanRecordIds: string[];
  shopifyUrl: string | null;
  liveDate: string | null;
  price: number | null;
  inventory: number | null;
  printTwoSides: boolean;
  tags: string[];
  metafields: ListingMetafieldInput[];
  attachments: LarkAttachment[];
  status: ListingStatus;
  warnings: string[];
}

export interface ListingImage {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  color: string | null;
}

export interface ShopifyTemplateCandidate {
  id: string;
  title: string;
  handle: string;
  productType: string;
  featuredImageUrl: string | null;
  score: number;
  reasons: string[];
  optionNames: string[];
  variantCount: number;
}

export interface ShopifyCollectionCandidate {
  id: string;
  title: string;
  handle: string;
  score: number;
}

export interface ListingPreview {
  row: LarkListingRow;
  templates: ShopifyTemplateCandidate[];
  selectedTemplateId: string | null;
  suggestedCollection: ShopifyCollectionCandidate | null;
  imageCounts: Array<{ color: string; count: number }>;
  warnings: string[];
}

export interface ListingResult {
  productId: string;
  adminUrl: string;
  title: string;
  templateProductId: string;
  collectionId: string | null;
  imagesUploaded: number;
  designTag: string;
}

export interface ListingFieldNames {
  designId: string;
  productType: string;
  mainColor: string;
  colors: string;
  shopifyUrl: string;
  liveDate: string;
  collection: string;
  weeklyPlan: string;
  attachments: string;
  title: string;
  weeklyPlanTitle: string;
  listingStatus: string;
  templateProduct: string;
  listingNote: string;
  price: string;
  inventory: string;
  printTwoSides: string;
  tags: string;
  metafields: string;
}
