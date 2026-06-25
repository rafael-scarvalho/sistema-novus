CREATE TYPE "ConsultationWorkflowStatus" AS ENUM ('CONSULTA', 'EXAMES_PRE_OP', 'CIRURGIA_AGENDADA', 'EXAMES_POS_OP', 'FINALIZADO');
ALTER TABLE "PreOpConsultation" ADD COLUMN "workflowStatus" "ConsultationWorkflowStatus" NOT NULL DEFAULT 'CONSULTA';
