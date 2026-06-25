ALTER TABLE "Guardian" ADD COLUMN "portalUsername" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "portalPasswordHash" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "portalActive" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "Guardian_portalUsername_key" ON "Guardian"("portalUsername");
