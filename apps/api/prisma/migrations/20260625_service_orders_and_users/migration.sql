-- User: add phone, specialty, commissionRate
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialty" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ServiceOrderStatus enum
DO $$ BEGIN
  CREATE TYPE "ServiceOrderStatus" AS ENUM ('ABERTA', 'FECHADA', 'PAGA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ServiceOrder
CREATE TABLE IF NOT EXISTS "ServiceOrder" (
  "id"              TEXT NOT NULL,
  "patientId"       TEXT NOT NULL,
  "vetId"           TEXT NOT NULL,
  "status"          "ServiceOrderStatus" NOT NULL DEFAULT 'ABERTA',
  "notes"           TEXT,
  "total"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paidAt"          TIMESTAMP(3),
  "paymentMethod"   "PaymentMethod",
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ServiceOrder_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ServiceOrderItem
CREATE TABLE IF NOT EXISTS "ServiceOrderItem" (
  "id"               TEXT NOT NULL,
  "serviceOrderId"   TEXT NOT NULL,
  "catalogItemId"    TEXT,
  "name"             TEXT NOT NULL,
  "quantity"         DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice"        DOUBLE PRECISION NOT NULL,
  "commissionRate"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total"            DOUBLE PRECISION NOT NULL,
  CONSTRAINT "ServiceOrderItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceOrderItem_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ServiceOrderItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
