-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA');

-- AlterEnum
ALTER TYPE "PatientRecordType" ADD VALUE 'PREOP_CONSULT';

-- CreateTable
CREATE TABLE "PreOpConsultation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "partnerId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "mode" "ConsultationMode" NOT NULL DEFAULT 'PRESENCIAL',
    "status" "ConsultationStatus" NOT NULL DEFAULT 'AGENDADA',
    "googleCalendarEventId" TEXT,
    "googleMeetLink" TEXT,
    "anamnesis" TEXT,
    "physicalExam" TEXT,
    "anestheticRisk" TEXT,
    "preOpExams" TEXT,
    "anestheticProtocol" TEXT,
    "surgicalPlan" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreOpConsultation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PreOpConsultation" ADD CONSTRAINT "PreOpConsultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOpConsultation" ADD CONSTRAINT "PreOpConsultation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
