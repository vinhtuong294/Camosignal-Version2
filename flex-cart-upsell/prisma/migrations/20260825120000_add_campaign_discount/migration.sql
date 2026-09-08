ALTER TABLE "Campaign"
ADD COLUMN "discountJson" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN "discountId" TEXT;
