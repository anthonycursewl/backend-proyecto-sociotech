-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_medications" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "prescribedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_chronic_diseases" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_chronic_diseases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_allergies_patientId_idx" ON "patient_allergies"("patientId");

-- CreateIndex
CREATE INDEX "patient_medications_patientId_idx" ON "patient_medications"("patientId");

-- CreateIndex
CREATE INDEX "patient_chronic_diseases_patientId_idx" ON "patient_chronic_diseases"("patientId");

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_chronic_diseases" ADD CONSTRAINT "patient_chronic_diseases_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data: allergies
INSERT INTO "patient_allergies" ("id", "patientId", "name", "createdAt")
SELECT gen_random_uuid()::text, "id", unnest("allergies"), NOW()
FROM "patients"
WHERE "allergies" IS NOT NULL AND array_length("allergies", 1) > 0;

-- Migrate data: medications
INSERT INTO "patient_medications" ("id", "patientId", "name", "createdAt")
SELECT gen_random_uuid()::text, "id", unnest("currentMedications"), NOW()
FROM "patients"
WHERE "currentMedications" IS NOT NULL AND array_length("currentMedications", 1) > 0;

-- Migrate data: chronic diseases
INSERT INTO "patient_chronic_diseases" ("id", "patientId", "name", "createdAt")
SELECT gen_random_uuid()::text, "id", unnest("chronicDiseases"), NOW()
FROM "patients"
WHERE "chronicDiseases" IS NOT NULL AND array_length("chronicDiseases", 1) > 0;

-- AlterTable
ALTER TABLE "patients" DROP COLUMN IF EXISTS "allergies";
ALTER TABLE "patients" DROP COLUMN IF EXISTS "currentMedications";
ALTER TABLE "patients" DROP COLUMN IF EXISTS "chronicDiseases";
