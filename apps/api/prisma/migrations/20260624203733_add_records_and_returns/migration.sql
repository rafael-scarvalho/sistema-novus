-- CreateEnum
CREATE TYPE "PatientRecordType" AS ENUM ('EXAM_REQUEST', 'PRESCRIPTION', 'SURGERY_REPORT', 'EXAM_REPORT', 'DOCUMENT', 'WEIGHT');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDENTE', 'REALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "PatientRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "PatientRecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurgeryReturn" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDENTE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurgeryReturn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientRecord" ADD CONSTRAINT "PatientRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryReturn" ADD CONSTRAINT "SurgeryReturn_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "Surgery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
