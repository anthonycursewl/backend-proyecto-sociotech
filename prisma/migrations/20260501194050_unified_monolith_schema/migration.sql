-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_doctorId_fkey";
