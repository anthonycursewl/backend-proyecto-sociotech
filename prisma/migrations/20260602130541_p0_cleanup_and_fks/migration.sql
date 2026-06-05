-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_userId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "services_userId_idx";

-- AlterTable
ALTER TABLE "services" DROP COLUMN IF EXISTS "userId";

-- DropTable
DROP TABLE IF EXISTS "_UserDoctorServices";

-- DropTable
DROP TABLE IF EXISTS "_UserServices";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_doctorId_scheduledAt_idx" ON "appointments"("doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_patientId_scheduledAt_idx" ON "appointments"("patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "medical_records_doctorId_idx" ON "medical_records"("doctorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "medical_records_patientId_idx" ON "medical_records"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_refreshToken_key" ON "users"("refreshToken");

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
