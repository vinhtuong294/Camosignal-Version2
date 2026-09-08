-- CreateTable
CREATE TABLE "ShopSetting" (
    "shop" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "catalogueSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSetting_pkey" PRIMARY KEY ("shop")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "strategy" TEXT NOT NULL,
    "strategyJson" TEXT NOT NULL,
    "conditionsJson" TEXT NOT NULL,
    "filtersJson" TEXT NOT NULL,
    "appearanceJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "collectionsJson" TEXT NOT NULL,
    "imageUrl" TEXT,
    "variantsJson" TEXT NOT NULL,
    "priceMin" DOUBLE PRECISION NOT NULL,
    "priceMax" DOUBLE PRECISION NOT NULL,
    "inventoryAvailable" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "campaignId" TEXT,
    "placement" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "sessionKey" TEXT,
    "value" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpsellEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_shop_enabled_idx" ON "Campaign"("shop", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_shop_placement_key" ON "Campaign"("shop", "placement");

-- CreateIndex
CREATE INDEX "ProductSnapshot_shop_inventoryAvailable_idx" ON "ProductSnapshot"("shop", "inventoryAvailable");

-- CreateIndex
CREATE INDEX "ProductSnapshot_shop_productType_idx" ON "ProductSnapshot"("shop", "productType");

-- CreateIndex
CREATE INDEX "ProductSnapshot_shop_vendor_idx" ON "ProductSnapshot"("shop", "vendor");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSnapshot_shop_productId_key" ON "ProductSnapshot"("shop", "productId");

-- CreateIndex
CREATE INDEX "UpsellEvent_shop_createdAt_idx" ON "UpsellEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "UpsellEvent_campaignId_eventType_idx" ON "UpsellEvent"("campaignId", "eventType");
