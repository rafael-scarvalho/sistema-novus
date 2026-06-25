-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SURGEON', 'ASSISTANT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('CANINO', 'FELINO', 'EXOTICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('CLINICA', 'HOSPITAL', 'VETERINARIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTUAL', 'FIXO', 'NENHUM');

-- CreateEnum
CREATE TYPE "CatalogItemCategory" AS ENUM ('PROCEDIMENTO_CIRURGICO', 'ANESTESIA', 'MATERIAL', 'MEDICAMENTO', 'EXAME', 'CONSULTORIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA', 'PARCELADO');

-- CreateEnum
CREATE TYPE "SurgeryStatus" AS ENUM ('AGENDADA', 'CHECKIN_REALIZADO', 'PREPARACAO_ANESTESICA', 'EM_CIRURGIA', 'RECUPERACAO', 'ALTA_CONCEDIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('CIRURGIA', 'CONSULTA', 'MATERIAL', 'REPASSE_PARCEIRO', 'IMPOSTO', 'SALARIO', 'EQUIPAMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ASSISTANT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "portalToken" TEXT,
    "portalTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT,
    "sex" "Sex" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "microchip" TEXT,
    "guardianId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL,
    "cnpj" TEXT,
    "cpf" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "commissionType" "CommissionType" NOT NULL DEFAULT 'NENHUM',
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "CatalogItemCategory" NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "partnerId" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'RASCUNHO',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvedPaymentMethod" "PaymentMethod",
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPaymentOption" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "installments" INTEGER,
    "discount" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BudgetPaymentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surgery" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "partnerId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "SurgeryStatus" NOT NULL DEFAULT 'AGENDADA',
    "googleCalendarEventId" TEXT,
    "preOpAnamnesis" TEXT,
    "preOpRequiredExams" TEXT[],
    "preOpAnestheticRisk" TEXT,
    "preOpAnestheticProtocol" TEXT,
    "preOpObservations" TEXT,
    "preOpExamFiles" TEXT[],
    "transOpStartTime" TIMESTAMP(3),
    "transOpEndTime" TIMESTAMP(3),
    "transOpTeam" TEXT[],
    "transOpTechniques" TEXT,
    "transOpIntercurrences" TEXT,
    "transOpAnesthesiaNotes" TEXT,
    "postOpRecoveryNotes" TEXT,
    "postOpPrescriptions" TEXT,
    "postOpReturnDate" TIMESTAMP(3),
    "postOpDischargeSummary" TEXT,
    "postOpReportFiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Surgery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurgeryStatusUpdate" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "status" "SurgeryStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "notifiedWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurgeryStatusUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "surgeryId" TEXT,
    "budgetId" TEXT,
    "partnerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSettlement" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionType" TEXT NOT NULL,
    "commissionValue" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_cpf_key" ON "Guardian"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_portalToken_key" ON "Guardian"("portalToken");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_cnpj_key" ON "Partner"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_cpf_key" ON "Partner"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_code_key" ON "Budget"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Surgery_budgetId_key" ON "Surgery"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSettlement_surgeryId_key" ON "PartnerSettlement"("surgeryId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPaymentOption" ADD CONSTRAINT "BudgetPaymentOption_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryStatusUpdate" ADD CONSTRAINT "SurgeryStatusUpdate_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "Surgery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "Surgery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "Surgery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
