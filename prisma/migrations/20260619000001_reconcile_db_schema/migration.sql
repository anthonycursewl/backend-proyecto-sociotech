-- Reconcile database schema with Prisma schema after manual prisma db push
-- and manual SQL migrations that didn't match Prisma's expected types

-- Add isVisible column to doctors (added via prisma db push)
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- Fix medical_records column types (VARCHAR -> TEXT to match Prisma String?)
ALTER TABLE "medical_records" ALTER COLUMN "diagnosis_code" TYPE TEXT;
ALTER TABLE "medical_records" ALTER COLUMN "blood_pressure" TYPE TEXT;

-- Fix medical_prescriptions to match Prisma schema expectations
-- Drop old FK constraint before altering column types
ALTER TABLE "medical_prescriptions" DROP CONSTRAINT IF EXISTS "medical_prescriptions_medical_record_id_fkey";

-- Alter column types from VARCHAR to TEXT (Prisma String maps to TEXT)
ALTER TABLE "medical_prescriptions" ALTER COLUMN "medication_name" TYPE TEXT;
ALTER TABLE "medical_prescriptions" ALTER COLUMN "dosage" TYPE TEXT;
ALTER TABLE "medical_prescriptions" ALTER COLUMN "frequency" TYPE TEXT;
ALTER TABLE "medical_prescriptions" ALTER COLUMN "duration" TYPE TEXT;

-- Drop gen_random_uuid() default; Prisma @default(uuid()) handles UUID at app level
ALTER TABLE "medical_prescriptions" ALTER COLUMN "id" DROP DEFAULT;

-- Fix created_at: set NOT NULL and match Prisma's DateTime (TIMESTAMP(3))
ALTER TABLE "medical_prescriptions" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at"::TIMESTAMP(3);
ALTER TABLE "medical_prescriptions" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "medical_prescriptions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Re-add FK with Prisma-compatible name
ALTER TABLE "medical_prescriptions" ADD CONSTRAINT "medical_prescriptions_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE;

-- Drop old manual index name, create index matching Prisma convention
DROP INDEX IF EXISTS "idx_prescriptions_medical_record";
CREATE INDEX IF NOT EXISTS "medical_prescriptions_medical_record_id_idx" ON "medical_prescriptions"("medical_record_id");
