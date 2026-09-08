-- CreateTable
CREATE TABLE "ListingRun" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "larkRecordId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "templateProductId" TEXT,
    "createdProductId" TEXT,
    "status" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingRun_shop_larkRecordId_idx" ON "ListingRun"("shop", "larkRecordId");
CREATE INDEX "ListingRun_shop_status_idx" ON "ListingRun"("shop", "status");
