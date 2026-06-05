-- CreateTable
CREATE TABLE "appointment_cancellations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_cancellations_pkey" PRIMARY KEY ("id")
);

-- Migrate existing cancellation data
INSERT INTO "appointment_cancellations" ("id", "appointmentId", "cancelledBy", "cancellationReason", "cancelledAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "cancelledBy",
    "cancellationReason",
    COALESCE("cancelledAt", "updatedAt")
FROM "appointments"
WHERE "cancelledBy" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "appointment_cancellations_appointmentId_key" ON "appointment_cancellations"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_cancellations_cancelledBy_idx" ON "appointment_cancellations"("cancelledBy");

-- AddForeignKey
ALTER TABLE "appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_cancelledBy_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "cancelledAt";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "cancelledBy";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "cancellationReason";
