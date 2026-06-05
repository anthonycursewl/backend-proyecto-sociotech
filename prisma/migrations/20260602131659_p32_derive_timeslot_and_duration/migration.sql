-- DropDefault
ALTER TABLE "appointments" ALTER COLUMN "timeSlot" DROP DEFAULT;

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "timeSlot";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "durationMinutes";
